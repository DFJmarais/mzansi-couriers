from pathlib import Path
import json
import plistlib
from PIL import Image

root = Path('/home/ubuntu/mzansi-couriers/ios/App/App')
plist_path = root / 'Info.plist'
plistlib.load(plist_path.open('rb'))
manifest = json.loads((root / 'Assets.xcassets/AppIcon.appiconset/Contents.json').read_text())
assert len(manifest['images']) >= 15
for image in manifest['images']:
    path = root / 'Assets.xcassets/AppIcon.appiconset' / image['filename']
    assert path.exists(), path
    with Image.open(path) as im:
        assert im.width == im.height, (path, im.size)
        if 'A' in im.getbands():
            alpha = im.getchannel('A')
            assert alpha.getextrema() == (255, 255), (path, alpha.getextrema())
pbx = (root.parent / 'App.xcodeproj/project.pbxproj').read_text()
for token in ['ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;', 'GENERATE_INFOPLIST_FILE = NO;', 'INFOPLIST_FILE = App/Info.plist;', 'CURRENT_PROJECT_VERSION = 13;', 'MARKETING_VERSION = 2.0.2;', 'TARGETED_DEVICE_FAMILY = "1,2";', 'BridgeViewController.swift in Sources */']:
    assert token in pbx, token
print('plist_valid=True')
print(f"icon_slots={len(manifest['images'])}")
print('all_icons_opaque=True')
print('required_release_settings=True')
