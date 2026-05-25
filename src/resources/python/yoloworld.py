# Fuck python i hate python its so fucking shit
# You dont deserve any respect python this is all vibecoded fuck off python genuinely fuck this shitty language
import sys
import json
import argparse
import logging
from ultralytics import YOLOWorld

# Suppress Ultralytics logging to stdout
logging.getLogger('ultralytics').setLevel(logging.ERROR)

# Argument for image path
parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True)
parser.add_argument("--pt", required=True)
args = parser.parse_args()

# Read classes from stdin as sent by Node.js
input_data = sys.stdin.read()
classes = json.loads(input_data)

# Initialize model
model = YOLOWorld(args.pt)
model.set_classes(classes)

# Inference
results = model.predict(args.input, verbose=False)

# Prepare output
output = {}
for r in results:
    for box, cls in zip(r.boxes.xyxy.tolist(), r.boxes.cls.tolist()):
        cls_name = model.names[int(cls)]
        if cls_name not in output:
            output[cls_name] = []
        output[cls_name].append(box)

# Print JSON to stdout for Node.js
print(json.dumps(output))