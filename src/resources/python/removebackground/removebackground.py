from rembg import remove
from PIL import Image
import io
import argparse

parser = argparse.ArgumentParser(description="rembg wrapper")
parser.add_argument("--input", required=True, help="Path to input image")
parser.add_argument("--output", required=True, help="Path for output PNG")
args = parser.parse_args()

# Load the input image
input_path = args.input
output_path = args.output

with open(input_path, 'rb') as i:
    input_image = i.read()
    # Perform background removal
    output_image = remove(input_image)

# Save the result
with open(output_path, 'wb') as o:
    o.write(output_image)