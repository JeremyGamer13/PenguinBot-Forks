import sys
import json
import argparse
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
from thefuzz import process

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    # Read classes
    input_data = sys.stdin.read()
    classes = json.loads(input_data)
    
    # Grounding DINO prompt format
    prompt = " . ".join(classes)
    
    # Load model and processor
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_id = "IDEA-Research/grounding-dino-base"
    
    processor = AutoProcessor.from_pretrained(model_id)
    model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id).to(device)
    
    # Load and process image
    image = Image.open(args.input).convert("RGB")
    inputs = processor(images=image, text=prompt, return_tensors="pt").to(device)
    
    # Run inference
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Post-process
    results = processor.post_process_grounded_object_detection(
        outputs,
        inputs.input_ids,
        target_sizes=[image.size[::-1]]
    )
    
    # Format output as PredictionResult: Object.<string, PredictionBox>
    # Note: Structure uses lists to handle multiple detections per term
    output = {}
    
    for box, score, label in zip(results[0]["boxes"], results[0]["scores"], results[0]["labels"]):
        # Fuzzy match the AI-generated label against the original input classes
        best_match, _ = process.extractOne(label, classes)
        
        box_coords = [int(coord) for coord in box.tolist()]
        
        prediction_box = {
            "box": box_coords,
            "score": float(score),
            "term": label
        }
        
        # Initialize list if key does not exist
        if best_match not in output:
            output[best_match] = []
        
        output[best_match].append(prediction_box)

    sys.stdout.write(json.dumps(output))
    sys.stdout.flush()

if __name__ == "__main__":
    main()