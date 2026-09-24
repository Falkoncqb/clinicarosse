import subprocess
import imageio_ffmpeg
import os
import sys

def main():
    video_path = "Video_ultrarrealista_de_segu.mp4"
    output_dir = "frames"
    os.makedirs(output_dir, exist_ok=True)

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using ffmpeg at: {ffmpeg}")

    # Extraer a 16 fps -> ~160 cuadros para 10 segundos
    # 160 cuadros a 1280x720 en WebP ofrece una suavidad excepcional
    # ocupando menos de 2.5 MB en total y cargando instantáneamente
    output_pattern = os.path.join(output_dir, "frame_%04d.webp")

    cmd = [
        ffmpeg,
        "-i", video_path,
        "-vf", "fps=16,scale=1280:720",
        "-c:v", "libwebp",
        "-quality", "80",
        "-compression_level", "4",
        output_pattern,
        "-y"
    ]

    print("Running ffmpeg extraction...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error during extraction:")
        print(result.stderr)
        sys.exit(1)

    frames = [f for f in os.listdir(output_dir) if f.endswith(".webp")]
    frames.sort()
    print(f"Successfully extracted {len(frames)} frames into '{output_dir}'.")
    if frames:
        sample_path = os.path.join(output_dir, frames[0])
        print(f"Sample frame size: {os.path.getsize(sample_path) / 1024:.1f} KB")
        total_size = sum(os.path.getsize(os.path.join(output_dir, f)) for f in frames) / (1024 * 1024)
        print(f"Total sequence size: {total_size:.2f} MB")

if __name__ == "__main__":
    main()
