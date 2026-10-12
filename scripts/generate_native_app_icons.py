from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path('/home/ubuntu/mzansi-couriers/ios/App/App/Assets.xcassets/AppIcon.appiconset')
OUT.mkdir(parents=True, exist_ok=True)

BG = '#0B3B2E'
BG_DARK = '#07291F'
ORANGE = '#F28C28'
ORANGE_LIGHT = '#FFB24A'
ORANGE_DARK = '#C96416'
CREAM = '#FFF7E8'
GREEN_ACCENT = '#51B58A'


def make_icon(size: int) -> Image.Image:
    # Render oversize and downsample for crisp anti-aliased edges.
    scale = 4
    n = size * scale
    image = Image.new('RGB', (n, n), BG)
    draw = ImageDraw.Draw(image)
    s = lambda value: int(value * scale)

    # Solid, high-contrast inset panel. Apple applies the final mask.
    draw.rounded_rectangle((s(42), s(42), s(982), s(982)), radius=s(210), fill=BG_DARK)
    draw.rounded_rectangle((s(58), s(58), s(966), s(966)), radius=s(190), fill=BG)

    # Route line running behind the parcel.
    route = [(s(166), s(782)), (s(286), s(782)), (s(366), s(690)), (s(470), s(690)), (s(560), s(596)), (s(692), s(596)), (s(806), s(470))]
    draw.line(route, fill=CREAM, width=s(28), joint='curve')
    for x, y in [(166, 782), (366, 690), (692, 596)]:
        draw.ellipse((s(x-13), s(y-13), s(x+13), s(y+13)), fill=GREEN_ACCENT)

    # Location pin at the route endpoint.
    cx, cy = s(806), s(428)
    draw.ellipse((cx-s(72), cy-s(72), cx+s(72), cy+s(72)), fill=CREAM)
    draw.polygon([(cx-s(56), cy+s(42)), (cx, cy+s(132)), (cx+s(56), cy+s(42))], fill=CREAM)
    draw.ellipse((cx-s(26), cy-s(26), cx+s(26), cy+s(26)), fill=ORANGE)

    # Parcel body: top, left/front and right/front faces.
    top = [(s(210), s(360)), (s(512), s(218)), (s(814), s(360)), (s(512), s(508))]
    left = [(s(210), s(360)), (s(512), s(508)), (s(512), s(816)), (s(210), s(668))]
    right = [(s(512), s(508)), (s(814), s(360)), (s(814), s(668)), (s(512), s(816))]
    draw.polygon(left, fill=ORANGE)
    draw.polygon(right, fill=ORANGE_DARK)
    draw.polygon(top, fill=ORANGE_LIGHT)

    # Parcel seams and tape.
    draw.line([(s(210), s(360)), (s(512), s(508)), (s(814), s(360))], fill=CREAM, width=s(14), joint='curve')
    draw.line([(s(512), s(508)), (s(512), s(816))], fill=CREAM, width=s(14))
    draw.polygon([(s(455), s(246)), (s(569), s(300)), (s(569), s(476)), (s(455), s(420))], fill=CREAM)
    draw.line([(s(512), s(222)), (s(512), s(494))], fill=ORANGE_DARK, width=s(12))

    # Small route chevron on the parcel face, kept large enough for small icons.
    chevron = [(s(286), s(558)), (s(354), s(626)), (s(286), s(694))]
    draw.line(chevron, fill=CREAM, width=s(26), joint='curve')

    # Downsample to the exact requested dimensions and force RGB (no alpha channel).
    return image.resize((size, size), Image.Resampling.LANCZOS).convert('RGB')


slots = {
    'AppIcon-20@2x.png': 40,
    'AppIcon-20@3x.png': 60,
    'AppIcon-29@2x.png': 58,
    'AppIcon-29@3x.png': 87,
    'AppIcon-40@2x.png': 80,
    'AppIcon-40@3x.png': 120,
    'AppIcon-60@2x.png': 120,
    'AppIcon-60@3x.png': 180,
    'AppIcon-20~ipad@2x.png': 40,
    'AppIcon-29~ipad@2x.png': 58,
    'AppIcon-40~ipad@2x.png': 80,
    'AppIcon-40~ipad@3x.png': 120,
    'AppIcon-76~ipad@1x.png': 76,
    'AppIcon-76~ipad@2x.png': 152,
    'AppIcon-83.5~ipad@2x.png': 167,
    'AppIcon-1024.png': 1024,
}

for filename, size in slots.items():
    make_icon(size).save(OUT / filename, format='PNG', optimize=True)
    print(f'{filename}: {size}x{size}, RGB')
