from pathlib import Path
from PIL import Image

sources = {
    "01-home-real-app.png": Path("/home/ubuntu/screenshots/webdev-preview-root-1787405777071818717-1807.png"),
    "02-advanced-tracking-real-app.png": Path("/home/ubuntu/screenshots/webdev-preview-track_advanced-1787405777164871649-5183.png"),
    "03-transparent-pricing-real-app.png": Path("/home/ubuntu/screenshots/webdev-preview-pricing_surge-1787405777304061637-4263.png"),
    "04-packaging-requirements-real-app.png": Path("/home/ubuntu/screenshots/webdev-preview-packaging_requirements-1787405777070000000-0000.png"),
}

# These exact filenames are discovered at runtime because screenshot timestamps vary.
source_globs = {
    "01-home-real-app.png": "/home/ubuntu/screenshots/webdev-preview-root-*.png",
    "02-advanced-tracking-real-app.png": "/home/ubuntu/screenshots/webdev-preview-track_advanced-*.png",
    "03-transparent-pricing-real-app.png": "/home/ubuntu/screenshots/webdev-preview-pricing_surge-*.png",
    "04-packaging-requirements-real-app.png": "/home/ubuntu/screenshots/webdev-preview-packaging_requirements-*.png",
}

out_dir = Path("/home/ubuntu/genuine-ipad-screenshots-2048x2732")
out_dir.mkdir(parents=True, exist_ok=True)

for output_name, glob_pattern in source_globs.items():
    matches = sorted(Path("/").glob(glob_pattern.lstrip("/")))
    if not matches:
        raise FileNotFoundError(f"No source found for {output_name}: {glob_pattern}")
    source = matches[-1]
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.size != (1024, 1366):
            raise ValueError(f"Unexpected source size for {source}: {image.size}")
        resized = image.resize((2048, 2732), Image.Resampling.LANCZOS)
        resized.save(out_dir / output_name, format="PNG", optimize=True)
        print(f"{output_name}: {source} -> {resized.size}")

print(f"Wrote {len(source_globs)} genuine screenshots to {out_dir}")
