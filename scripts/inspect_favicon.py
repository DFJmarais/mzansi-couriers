from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/mzansi-couriers/client/public/favicon.ico')
out = Path('/tmp/mzansi-favicon-largest.png')
with Image.open(source) as ico:
    frames = []
    for index in range(getattr(ico, 'n_frames', 1)):
        ico.seek(index)
        frame = ico.convert('RGBA').copy()
        frames.append(frame)
    largest = max(frames, key=lambda image: image.width * image.height)
    largest.save(out)
    print(f'frames={len(frames)} largest={largest.width}x{largest.height} mode={largest.mode} output={out}')
