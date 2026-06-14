# NOTE: THIS IS THE SCRIPT WHERE YOU MAKE THE CHATTERBOX_PATH_CONDITIONALS / --conditionals, just replace the things with the Your things. Itll make a few files so make a folder

# Fuck you python this is all ai generated code slop code fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you 
#fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you 
#fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you
# Fuck python i hate python its so fucking shit
# You dont deserve any respect python this is all vibecoded fuck off python genuinely fuck this shitty language 
import os
os.environ['HF_HUB_OFFLINE'] = '1'
import time
import torch
import torchaudio as ta
import numpy as np
from pathlib import Path
from chatterbox.tts import ChatterboxTTS, Conditionals

# Configuration variables
# change these or nothing will work brody
INPUT_MODEL_PATH = "E:/AIModels/Chatterbox-torch-2.6.0+cu118-cp310/HF_HOME/hub/models--ResembleAI--chatterbox/snapshots/5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18"
REFERENCE_AUDIO_PATH = "C:/Users/Jeremy/Downloads/Games & Tools/WALLS/modifiers/yapper/lines.mp3"
OUTPUT_CONDITIONAL_SCHEME = "C:/Users/Jeremy/Documents/Other/testchatterbox1/conditionals/yapper_lines" # this makes yapper_lines0.3.pt for example

# ass
# Initialize model
print("from_local")
model = ChatterboxTTS.from_local(INPUT_MODEL_PATH, device="cuda")
# Python is so unbelievably fucking pathetic that i need to use numpy for a fucking for loop
for i in np.arange(0, 2.1, 0.1):
    # Exaggeration: Often implemented as a multiplier on the latent variance 
    # or specific prosody-influencing components of the embedding.
    exaggeration_factor = (round(i, 1))
    # prepare conditionals
    print("conmditional making", exaggeration_factor)
    model.prepare_conditionals(wav_fpath=REFERENCE_AUDIO_PATH, exaggeration=exaggeration_factor)
    model.conds.save(Path(OUTPUT_CONDITIONAL_SCHEME + str(exaggeration_factor) + ".pt"))
    # Genuinely go FUCK yourself
    # stupid fucking shit we have to do
    if i == 0 or i == 0.0 or i == 1 or i == 1.0 or i == 2 or i == 2.0:
        model.conds.save(Path(OUTPUT_CONDITIONAL_SCHEME + str(round(exaggeration_factor)) + ".pt"))
    print("conmditional saved", exaggeration_factor)
print("Conditionals saved successfully.")
