# DISCLOSURE: Slopcoded vibecoded because FUCK python
print("[Python] Script starting, importing dependencies...")
import sys
import argparse
import librosa
import soundfile as sf
import numpy as np
import psola
print("[Python] Dependencies imported successfully.")

def flatten_audio(target_freq, input_path, output_path):
    print(f"[Python] Target frequency set to: {target_freq} Hz")
    print(f"[Python] Input file: {input_path}")
    print(f"[Python] Output file: {output_path}")
    
    target_freq = float(target_freq)
    
    print("[Python] Loading audio file using librosa...")
    y, sr = librosa.load(input_path, sr=None)
    duration = len(y) / sr
    print(f"[Python] Audio loaded. Sample Rate: {sr} Hz | Duration: {duration} seconds")
    
    # 1. Track the melody/pitch contour using PYIN (to match frame lengths)
    fmin = librosa.note_to_hz('C2')
    fmax = librosa.note_to_hz('C7')
    
    print("[Python] Analyzing vocal melody using PYIN pitch detection...")
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y, 
        fmin=fmin, 
        fmax=fmax,
        sr=sr
    )
    print("[Python] Pitch detection analysis complete.")
    
    # 2. Create an array matching the frames of f0, locked entirely to target_freq
    num_frames = len(f0) if f0 is not None else 100
    print(f"[Python] Generating flat target pitch curve ({num_frames} frames at {target_freq} Hz)...")
    target_f0 = np.full(num_frames, target_freq)
    
    # 3. Resynthesize audio using PSOLA
    print("[Python] Starting PSOLA pitch alignment and audio resynthesis...")
    fixed_y = psola.vocode(
        y, 
        sample_rate=int(sr), 
        target_pitch=target_f0, 
        fmin=fmin, 
        fmax=fmax
    )
    print("[Python] PSOLA processing finished successfully.")
    
    # 4. Export the result
    print(f"[Python] Writing final audio file to disk: {output_path}...")
    sf.write(output_path, fixed_y, sr)
    print(f"[Python] Success! Processed file written to {output_path}")

if __name__ == "__main__":
    print("[Python] Python subprocess initialized.")
    
    parser = argparse.ArgumentParser(description="Audio processing script.")
    parser.add_argument("--task", required=True, help="Task to perform (e.g., pitchcorrect)")
    parser.add_argument("--frequency", required=True, help="Target frequency in Hz")
    parser.add_argument("--input", required=True, help="Path to input audio file")
    parser.add_argument("--output", required=True, help="Path to output audio file")
    
    args = parser.parse_args()
    
    if args.task != "pitchcorrect":
        print(f"[Python ERROR] Task '{args.task}' is not implemented!")
        sys.exit(1)
        
    flatten_audio(args.frequency, args.input, args.output)