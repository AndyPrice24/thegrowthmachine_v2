"""
Builds The Growth Machine's logo files and site icons from the vector source
in components/growth-machine/logo-paths.js (the wordmark, and the lop-sided
cog that sits in the O).

    python3 tools/brand/build_logo.py

Writes:
  public/brand/tgm-logo.svg          black wordmark, red cog with a hard shadow
                                     (light backgrounds: the site header)
  public/brand/tgm-logo-white.svg    white wordmark, bright red cog, no shadow
                                     (dark backgrounds: the site footer)
  public/brand/tgm-cog.svg           the cog on its own, red
  public/brand/*.png                 PNG copies of the above, plus a square
                                     app / social-profile icon, for collateral
  app/icon.svg                       browser tab icon (the red cog)
  app/favicon.ico                    the same, 16, 32 and 48px, for old browsers
  app/apple-icon.png                 phone home-screen icon (red cog on ink)

Needs Pillow and Playwright (with the preinstalled Chromium) to draw the PNGs.
"""
import io
import json
import os
import re
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SRC = (ROOT / 'components/growth-machine/logo-paths.js').read_text()

INK, RED, HOT, WHITE = '#111111', '#c8221c', '#ff4b3e', '#ffffff'


def const(name):
    """The value of `export const NAME = ...;` in logo-paths.js."""
    m = re.search(rf'export const {name} = (.*?);\n', SRC, re.S)
    return m.group(1)


VIEWBOX = json.loads(const('LOGO_VIEWBOX'))
WORDMARK = re.findall(r'"(M[^"]+)"', const('WORDMARK'))
COG = json.loads(const('COG'))
CENTRE = json.loads(re.sub(r'(\w+):', r'"\1":', const('COG_CENTRE')))
SCALE = float(const('COG_SCALE'))
SHADOW = json.loads(re.sub(r'(\w+):', r'"\1":', const('COG_SHADOW')))


def logo_svg(word, cog, shadow=None):
    paths = ''.join(f'<path d="{d}"/>' for d in WORDMARK)
    behind = (
        f'<path transform="translate({SHADOW["x"]} {SHADOW["y"]}) translate({CENTRE["x"]} {CENTRE["y"]}) scale({SCALE})" '
        f'd="{COG}" fill="{shadow}"/>'
        if shadow
        else ''
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEWBOX}" role="img" aria-label="The Growth Machine">'
        f'<g fill="{word}">{paths}</g>{behind}'
        f'<path transform="translate({CENTRE["x"]} {CENTRE["y"]}) scale({SCALE})" d="{COG}" fill="{cog}"/></svg>\n'
    )


def cog_svg(fill, tile=None):
    """The cog alone, 64 units square; on a full-bleed tile when given one."""
    back = f'<rect x="-32" y="-32" width="64" height="64" fill="{tile}"/>' if tile else ''
    scale = ' transform="scale(.72)"' if tile else ''
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64">{back}'
        f'<path d="{COG}" fill="{fill}"{scale}/></svg>\n'
    )


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    print('wrote', path.relative_to(ROOT))


def main():
    brand = ROOT / 'public/brand'
    light = logo_svg(INK, RED, INK)
    dark = logo_svg(WHITE, HOT)
    cog = cog_svg(RED)
    tile = cog_svg(HOT, INK)
    write(brand / 'tgm-logo.svg', light)
    write(brand / 'tgm-logo-white.svg', dark)
    write(brand / 'tgm-cog.svg', cog)
    write(ROOT / 'app/icon.svg', cog)

    vw, vh = (float(v) for v in VIEWBOX.split()[2:])
    renders = [
        # (svg, width, height, file)
        (light, 2400, round(2400 * vh / vw), brand / 'tgm-logo.png'),
        (dark, 2400, round(2400 * vh / vw), brand / 'tgm-logo-white.png'),
        (cog, 1024, 1024, brand / 'tgm-cog.png'),
        (tile, 1024, 1024, brand / 'tgm-icon.png'),
        (tile, 180, 180, ROOT / 'app/apple-icon.png'),
        (cog, 256, 256, None),  # source for favicon.ico
    ]
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        page = browser.new_page()
        for svg, w, h, out in renders:
            page.set_viewport_size({'width': w, 'height': h})
            sized = svg.replace('<svg ', f'<svg width="{w}" height="{h}" ', 1)
            page.set_content(f'<html><body style="margin:0;background:transparent">{sized}</body></html>')
            png = page.screenshot(omit_background=True, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
            if out:
                out.write_bytes(png)
                print('wrote', out.relative_to(ROOT))
            else:
                icon = Image.open(io.BytesIO(png))
                icon.save(ROOT / 'app/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
                print('wrote app/favicon.ico')
        browser.close()


if __name__ == '__main__':
    os.chdir(ROOT)
    main()
