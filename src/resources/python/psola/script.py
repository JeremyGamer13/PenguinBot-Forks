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
    fmin = librosa.note_to_hz('C1')
    fmax = librosa.note_to_hz('C8')
    
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

def transfer_pitch(input_path, reference_path, output_path):
    print(f"[Python] Source input file: {input_path}")
    print(f"[Python] Reference melody file: {reference_path}")
    print(f"[Python] Output file: {output_path}")
    
    print("[Python] Loading audio files...")
    y, sr = librosa.load(input_path, sr=None)
    # Load reference audio matching the input's sample rate for alignment ease
    y_ref, sr_ref = librosa.load(reference_path, sr=sr)
    
    fmin = librosa.note_to_hz('C1')
    fmax = librosa.note_to_hz('C8')
    
    print("[Python] Analyzing pitch of source input audio...")
    f0_input, _, _ = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr)
    
    print("[Python] Analyzing pitch of reference audio...")
    f0_ref, _, _ = librosa.pyin(y_ref, fmin=fmin, fmax=fmax, sr=sr)
    
    # Clean up any NaN values (unvoiced sections) in the reference pitch contour via interpolation
    f0_ref_clean = np.copy(f0_ref)
    valid_indices = ~np.isnan(f0_ref_clean)
    if np.any(valid_indices):
        times = np.arange(len(f0_ref_clean))
        f0_ref_clean = np.interp(times, times[valid_indices], f0_ref_clean[valid_indices])
    else:
        f0_ref_clean.fill(220.0) # Fallback default note if completely unvoiced
        
    # Resize/interpolate reference pitch contour to match the exact frame count of the input audio
    num_input_frames = len(f0_input) if f0_input is not None else int(len(y) / 512)
    print(f"[Python] Resampling reference melody to match input frames ({num_input_frames} frames)...")
    
    ref_times = np.linspace(0, 1, len(f0_ref_clean))
    input_times = np.linspace(0, 1, num_input_frames)
    target_f0 = np.interp(input_times, ref_times, f0_ref_clean)
    
    print("[Python] Starting PSOLA pitch transfer and resynthesis...")
    fixed_y = psola.vocode(
        y, 
        sample_rate=int(sr), 
        target_pitch=target_f0, 
        fmin=fmin, 
        fmax=fmax
    )
    print("[Python] PSOLA transfer processing finished successfully.")
    
    print(f"[Python] Writing final audio file to disk: {output_path}...")
    sf.write(output_path, fixed_y, sr)
    print(f"[Python] Success! Processed file written to {output_path}")

if __name__ == "__main__":
    print("[Python] Python subprocess initialized.")
    
    parser = argparse.ArgumentParser(description="Audio processing script.")
    parser.add_argument("--task", required=True, help="Task to perform (e.g., pitchcorrect, transferpitch)")
    parser.add_argument("--input", required=True, help="Path to input audio file")
    parser.add_argument("--output", required=True, help="Path to output audio file")
    parser.add_argument("--frequency", required=False, help="Target frequency in Hz (used for pitchcorrect)")
    parser.add_argument("--reference", required=False, help="Path to reference audio file (used for transferpitch)")
    
    args = parser.parse_args()
    
    if args.task == "pitchcorrect":
        if not args.frequency:
            print("[Python ERROR] Task 'pitchcorrect' requires the '--frequency' argument!")
            sys.exit(1)
        flatten_audio(args.frequency, args.input, args.output)
        
    elif args.task == "transferpitch":
        if not args.reference:
            print("[Python ERROR] Task 'transferpitch' requires the '--reference' argument!")
            sys.exit(1)
        transfer_pitch(args.input, args.reference, args.output)
        
    else:
        print(f"[Python ERROR] Task '{args.task}' is not implemented!")
        sys.exit(1)
