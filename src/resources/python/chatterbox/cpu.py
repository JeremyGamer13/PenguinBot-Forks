# Fuck you python this is all ai generated code slop code fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you 
#fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you 
#fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you fuck you 
# Fuck python i hate python its so fucking shit
# You dont deserve any respect python this is all vibecoded fuck off python genuinely fuck this shitty language
import os
import re
import sys
import json
import math
import argparse
from pathlib import Path
os.environ['HF_HUB_OFFLINE'] = '1'

# "type=int" why the fuck would a type be a function you indecisive dimwit
parser = argparse.ArgumentParser(description="Chatterbox Wrapper")
parser.add_argument("--max_length", type=int, default=99999, required=False, help="A maximum total string length to allow.")
parser.add_argument("--max_chunks", type=int, default=99999, required=False, help="A maximum amount of chunks to allow.")
parser.add_argument("--silent", action="store_true", required=False, help="Don't print for the user, only make JSON stdout packets")
parser.add_argument("--model", required=True, help="The folder with the model's files")
parser.add_argument("--conditionals", required=True, help="A scheme to follow for conditional path")
parser.add_argument("--output", required=True, help="The output .wav path")
parser.add_argument("--prompt", required=False, help="A prompt to speak out. Takes priority over stdin.")
parsed_args = parser.parse_args()

# shit we need to make or we'll spit into stdout constantly
def print_if_appropriate(*args, sep=' ', end='\n', file=None, flush=False):
    # this args thiig is entrirely why i named the other var parsed_args because
    # python has no concept of naming things differently (genius design) (im fucking joking)
    if parsed_args.silent:
        return
    
    # thank you ai
    """
    A wrapper function for the built-in print () function.
    Parameters match the standard print () signature.
    """
    print(*args, sep=sep, end=end, file=file, flush=flush)

import time
# Capture the start time
start_time = time.time()

# akjlsdjasld
# Configuration variables
# INPUT_CONDITIONAL_SCHEME is a path pattern with all the conditionals (from 0-2 exaggeration)
# EX: INPUT_CONDITIONAL_SCHEME + str(exaggeration) + ".pt"
INPUT_MODEL_PATH = parsed_args.model
INPUT_CONDITIONAL_SCHEME = parsed_args.conditionals
OUTPUT_AUDIO_PATH = parsed_args.output
TEXT_PROMPT = parsed_args.prompt
if not parsed_args.prompt:
    TEXT_PROMPT = sys.stdin.read() # tung tung sagenius

# Hyperparameters

# CFG Scale: Higher values increase adherence to the prompt and reference audio,
# but may introduce artifacts if set too high.

# Temperature: Controls output randomness. 
# Lower values (< 1.0) produce more deterministic, stable outputs.
# Higher values (> 1.0) increase variability and potential for errors.

# Exaggeration: Often implemented as a multiplier on the latent variance 
# or specific prosody-influencing components of the embedding.
# snapped to 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0

# These are the tags you can attach like "[passionate]I love fortnite, [stale]but i hate defaults"
TAG_MAP = {
    "[intense]":     {"exaggeration": 1.5, "cfg_weight": 0.3 , "temperature": 0.9},
    "[passionate]":  {"exaggeration": 0.9, "cfg_weight": 0.4 , "temperature": 0.8},
    "[normal]":      {"exaggeration": 0.5, "cfg_weight": 0.6 , "temperature": 0.6},
    "[stale]":       {"exaggeration": 0.1, "cfg_weight": 0.95, "temperature": 0.2},
}
TAG_DEFAULT = "[normal]"

# go FUCK yourself
print_if_appropriate("imports because these take time to load")
import torch
import torchaudio as ta
# NOTE: I COULDNT GET THIS WORKING WITH the silent AI-generated disclosure/watermark chatterbox TTS usually adds, so PLEASE TRY TO GET THIS WORKING ON YOUR END!!!!! i will NOT explain how to remove it like i had to
from chatterbox.tts import ChatterboxTTS, Conditionals

# This is the only cleanup we need to do because ChatterboxTTS replaces characters like ’ and … for us
# maybe we shouold do more fleanup idk i dont care
def replace_emojis_with_em_dash(text):
    # Regex pattern defining common emoji Unicode ranges
    # what the FUCK is this regex syntax python this is genuinely horrid
    emoji_pattern = re.compile(
        r'['
        r'\U0001f300-\U0001f64f'
        r'\U0001f680-\U0001f6ff'
        r'\U0001f900-\U0001f9ff'
        r'\U0001fa70-\U0001faff'
        r'\U00002600-\U000026ff'
        r'\U00002700-\U000027bf'
        r']+', flags=re.UNICODE)
    
    return emoji_pattern.sub('—', text)
def process_and_generate(text):
    preprocessed_text = replace_emojis_with_em_dash(text)
    
    if len(preprocessed_text) > int(parsed_args.max_length):
        raise Exception("Too long of an input")

    # Define tag mapping
    active_tag = TAG_DEFAULT
    current_params = TAG_MAP[active_tag]

    # 1. Split into sentences and extract tags
    raw_sentences = re.split(r'(?<=[.!?—…\-])\s+', preprocessed_text)
    processed_data = [] # List of tuples: (text, hyperparams)

    for sent in raw_sentences:
        sent = sent.strip()
        found_tag = next((tag for tag in TAG_MAP if sent.startswith(tag)), None)
        
        is_tagged = False
        if found_tag:
            current_params = TAG_MAP[found_tag]
            sent = sent[len(found_tag):].strip()
            is_tagged = True
        
        # Cleanup: Replace only trailing separators (dash, ellipsis, em-dash) 
        # with a full stop, but only if it's acting as a separator.
        # Target any trailing whitespace followed by one or more separators
        # This regex: \s*[—…\-]+$
        # \s* : matches optional trailing spaces
        # [—…\-]+ : matches one or more dash/ellipsis characters at the end
        # $ : anchors to the end of the string
        cleanup_pattern = re.compile(r'\s*[—…\-]+$')
        
        if cleanup_pattern.search(sent):
            # Replace the entire sequence of whitespace + separators with a period
            sent = cleanup_pattern.sub(".", sent)
            
        # Optional: final safety check to ensure no double periods
        sent = re.sub(r'\.\.+$', '.', sent)
            
        processed_data.append({
            "text": sent, 
            "params": current_params, 
            "is_tagged": is_tagged, # Persistent flag for grouping
            "tag": found_tag # Persistent flag for grouping
        })
        
    # 2. Grouping logic
    chunks = []
    max_len = 80
    i = 0
    while i < len(processed_data):
        item = processed_data[i]
        
        buffer_text = item["text"]
        buffer_params = item["params"]
        
        i += 1
        while i < len(processed_data):
            next_item = processed_data[i]
            
            # CRITICAL: If the next item has a new tag, we MUST stop merging 
            # to preserve the new style/parameter block.
            if next_item["is_tagged"]:
                break
            
            # Otherwise, check length and merge
            if (len(buffer_text) + len(next_item["text"]) + 1 < max_len):
                buffer_text += " " + next_item["text"]
                i += 1
            else:
                break
        
        chunks.append({
            "text": buffer_text,
            "params": buffer_params,
            "is_tagged": item["is_tagged"],
            "tag": item["tag"],
        })

    if len(chunks) > int(parsed_args.max_chunks):
        raise Exception("Too many chunks")

    # Initialize model
    print_if_appropriate("from_local")
    model = ChatterboxTTS.from_local(INPUT_MODEL_PATH, device="cpu")
    print_if_appropriate("------")

    # speak
    i = 0
    all_wavs = []
    for chunk in chunks:
        with torch.amp.autocast(device_type='cpu', dtype=torch.bfloat16):
            print_if_appropriate("------")

            # NOTE: print for user to see
            if chunk["is_tagged"]:
                active_tag = chunk["tag"]
            print_if_appropriate("model.generate", i + 1, "/", len(chunks), ";", active_tag, chunk["text"])

            # NOTE: print for json output
            sys.stdout.write(json.dumps({
                "type": "chunk",
                "current": i,
                "length": len(chunks),
                "text": chunk["text"],
                "active_tag": active_tag,
                "chunk": chunk
            }))
            sys.stdout.flush()

            # use conditionals
            closest_exaggeration_factor = max(0.0, min(2.0, round(chunk["params"]["exaggeration"], 1)))
            saved_conds_path = Path(INPUT_CONDITIONAL_SCHEME + str(closest_exaggeration_factor) + ".pt")
            model.conds = Conditionals.load(saved_conds_path, map_location="cpu")

            # Gebnerate the audoi
            wav = model.generate(
                chunk["text"],
                cfg_weight=chunk["params"]["cfg_weight"],
                temperature=chunk["params"]["temperature"],
                exaggeration=closest_exaggeration_factor
            )

            # normalization audio
            # idk how the fuck this works but i guess torch has some magical math shit whatever the ai figured it out
            # Assuming wav is a torch tensor of shape (1, samples)
            # Calculate the absolute maximum amplitude of the current segment
            peak = torch.max(torch.abs(wav))

            # Avoid division by zero for silence
            if peak > 0:
                wav = wav / peak

            # add to list
            all_wavs.append(wav) 
            print_if_appropriate("------")
        i += 1
    
    # Concatenate along the time dimension (dim=1)
    print_if_appropriate("combinidng wavs", len(all_wavs))
    combined_wav = torch.cat(all_wavs, dim=1)
    
    # Save the final concatenated output
    print_if_appropriate("save combinidng wavs")
    ta.save(OUTPUT_AUDIO_PATH, combined_wav, model.sr)
    print_if_appropriate(f"File saved to {OUTPUT_AUDIO_PATH}")
    print_if_appropriate(OUTPUT_AUDIO_PATH)
    sys.stdout.write(json.dumps({
        "type": "output",
        "output": OUTPUT_AUDIO_PATH,
    }))
    sys.stdout.flush()

# stupid fucking bullshit you have to do for every python file i guess
if __name__ == "__main__":
    print_if_appropriate("generate speech")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    process_and_generate(TEXT_PROMPT)
    
    # Capture the end time
    end_time = time.time()
    elapsed_time = end_time - start_time
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate("------")
    print_if_appropriate(f"Time passed: {elapsed_time:.4f} seconds")

    # time time time sahur
    sys.stdout.write(json.dumps({
        "type": "time",
        "start": start_time,
        "end": end_time,
        "elapsed": elapsed_time,
    }))
    sys.stdout.flush()
