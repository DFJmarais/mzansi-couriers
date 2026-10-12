from pathlib import Path
import json
import plistlib
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
icon_dir = root / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
contents = json.loads((icon_dir / "Contents.json").read_text())
pbx = (root / "ios/App/App.xcodeproj/project.pbxproj").read_text()
plist = plistlib.loads((root / "ios/App/App/Info.plist").read_bytes())

required = [(x["filename"], x["idiom"], x["scale"], x["size"]) for x in contents["images"]]
missing = [name for name, *_ in required if not (icon_dir / name).exists()]
if missing:
    raise SystemExit(f"Missing icon files: {missing}")

bad = []
for name, idiom, scale, size in required:
    image = Image.open(icon_dir / name)
    expected_px = int(float(size.split("x")[0]) * int(scale.rstrip("x")))
    if image.size != (expected_px, expected_px):
        bad.append(f"{name}: {image.size} != {(expected_px, expected_px)}")
    if image.mode not in ("RGB", "L"):
        alpha = image.getchannel("A")
        if alpha.getextrema()[0] != 255:
            bad.append(f"{name}: non-opaque alpha {alpha.getextrema()}")
if bad:
    raise SystemExit("Icon validation failed: " + "; ".join(bad))

for key, value in {
    "MARKETING_VERSION": "2.0.2",
    "CURRENT_PROJECT_VERSION": "13",
    "PRODUCT_BUNDLE_IDENTIFIER": "com.mzansi.couriers",
    "IPHONEOS_DEPLOYMENT_TARGET": "15.0",
    "TARGETED_DEVICE_FAMILY": '"1,2"',
    "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon",
    "INFOPLIST_FILE": "App/Info.plist",
}.items():
    if not re.search(rf"{re.escape(key)} = {re.escape(value)};", pbx):
        raise SystemExit(f"Missing or incorrect Xcode setting: {key} = {value}")

if plist.get("NSUserTrackingUsageDescription"):
    raise SystemExit("ATT usage description is present although the app does not request tracking")
if plist.get("CFBundleIconName") != "AppIcon":
    raise SystemExit("CFBundleIconName is not AppIcon")

web_index = root / "ios/App/App/public/index.html"
if not web_index.exists() or web_index.stat().st_size == 0:
    raise SystemExit("Embedded production web bundle is missing")

print(json.dumps({
    "icons_checked": len(required),
    "icons_opaque": True,
    "marketing_version": "2.0.2",
    "build_number": "13",
    "bundle_id": "com.mzansi.couriers",
    "deployment_target": "15.0",
    "device_family": "iPhone+iPad",
    "att_tracking_prompt": False,
    "embedded_web_bundle": True,
}, indent=2))
