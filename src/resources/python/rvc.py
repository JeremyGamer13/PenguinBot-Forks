import sys
import argparse

# Fuck python i hate python its so fucking shit
# You dont deserve any respect python this is all vibecoded fuck off python genuinely fuck this shitty language
import torch
from fairseq.data.dictionary import Dictionary

# Tell Torch to allow fairseq objects to be loaded
torch.serialization.add_safe_globals([Dictionary])

from rvc_python.infer import RVCInference

parser = argparse.ArgumentParser(description="RVC Inference Wrapper")
parser.add_argument("--input", required=True, help="Path to input vocal audio")
parser.add_argument("--model", required=True, help="Path to .pth file")
parser.add_argument("--index", required=True, help="Path to .index file")
parser.add_argument("--output", required=True, help="Path for output audio")
parser.add_argument("--method", required=True, help="Model method")
parser.add_argument("--semitones", required=True, help="Semitones to shift")

args = parser.parse_args()

# Path to your trained model and the source audio you want to cover
model_path = args.model
index_path = args.index
source_audio = args.input
output_path = args.output

# https://github.com/daswer123/rvc-python/blob/main/rvc_python/infer.py#L181
# because the ai didnt get this right so i just actually did this part
rvc = RVCInference(
    device="cuda:0",
    model_path=model_path,
    index_path=index_path,
)
rvc.set_params(
    f0method = args.method,
    index_rate = 0.75, # NOTE: not sure if this should be configurable it might not need to change for different methods but unsure
    protect = 0.33,
    f0up_key = args.semitones
)

# Perform the conversion
rvc.infer_file(
    input_path=source_audio,
    output_path=output_path
)

print(f"Cover generated at: {output_path}")