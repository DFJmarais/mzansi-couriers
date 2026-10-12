from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/mzansi-couriers-logo-no-toyota-faithful.png')
destination = Path('/home/ubuntu/mzansi-couriers/ios/App/App/public/mzansi-couriers-logo.jpg')

with Image.open(source) as image:
    image.convert('RGB').save(destination, format='JPEG', quality=88, optimize=True, progressive=True)
print(f'Wrote {destination} ({destination.stat().st_size} bytes)')
