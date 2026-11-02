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
  app/opengraph-image.png            the preview card shown when a page is
                                     shared (LinkedIn, WhatsApp, Slack…)
  public/brand/email/*.png           the images the email signature uses
                                     (brand/email-signature.html): the logo
                                     on white, so it shows in dark-mode
                                     inboxes, and red email and phone icons,
                                     all at twice their display size

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


# The share card: cream paper, the logo, the promise, and the address.
SHARE = '''<html><head><style>
body{margin:0;width:1200px;height:630px;background:#faf8f4;font-family:Georgia,'Liberation Serif',serif;color:#171715;position:relative;overflow:hidden}
.logo{position:absolute;left:80px;top:72px;width:300px}.logo svg{width:100%;height:auto;display:block}
h1{position:absolute;left:80px;top:220px;width:860px;margin:0;font-weight:400;font-size:76px;line-height:1.02;letter-spacing:-2.5px}
h1 em{color:#c8221c}
p{position:absolute;left:80px;bottom:64px;margin:0;font:600 22px Inter,'DejaVu Sans',sans-serif;letter-spacing:4px;text-transform:uppercase}
.cog{position:absolute;right:-120px;bottom:-140px;width:520px}.cog svg{width:100%;height:auto;display:block}
.rule{position:absolute;left:80px;right:400px;bottom:120px;height:2px;background:#171715}
</style></head><body><div class="logo">{LOGO}</div>
<h1>Senior growth leadership. <em>Without the full-time hire.</em></h1>
<div class="rule"></div><p>thegrowthmachine.co</p><div class="cog">{COG}</div></body></html>'''


# Email signature icons, 24 units square, in the brand red so they read on
# light and dark backgrounds alike.
MAIL_ICON = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
    '<path fill="#c8221c" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.6 2'
    ' 7.4 5.6L19.4 7H4.6ZM20 8.4l-7.4 5.6a1 1 0 0 1-1.2 0L4 8.4V17h16V8.4Z"/></svg>'
)
PHONE_ICON = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
    '<path fill="#c8221c" d="M6.6 2.9 9 2.3a1 1 0 0 1 1.2.6l1.4 3.6a1 1 0 0 1-.3 1.1L9.6 9a12 12 0 0 0 5.4'
    ' 5.4l1.4-1.7a1 1 0 0 1 1.1-.3l3.6 1.4a1 1 0 0 1 .6 1.2l-.6 2.4a2 2 0 0 1-2 1.5A16 16 0 0 1 3.1 4.9a2'
    ' 2 0 0 1 1.5-2Z"/></svg>'
)

WEB_ICON = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#c8221c" stroke-width="2">'
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.8 5.7 3.8 9s-1.2 6.3-3.8 9c-2.6-2.7-3.8-5.7-3.8-9'
    's1.2-6.3 3.8-9Z"/></g></svg>'
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
        # Email signature: shown at 210 x 79 and 16 x 16.
        (light.replace('<g fill', f'<rect x="{VIEWBOX.split()[0]}" y="{VIEWBOX.split()[1]}" width="100%" height="100%" fill="#fff"/><g fill', 1),
         420, round(420 * vh / vw), brand / 'email/logo.png'),
        (MAIL_ICON, 32, 32, brand / 'email/mail.png'),
        (PHONE_ICON, 32, 32, brand / 'email/phone.png'),
        (WEB_ICON, 32, 32, brand / 'email/web.png'),
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
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(png)
                print('wrote', out.relative_to(ROOT))
            else:
                icon = Image.open(io.BytesIO(png))
                icon.save(ROOT / 'app/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
                print('wrote app/favicon.ico')
        share = SHARE.replace('{LOGO}', light).replace('{COG}', cog_svg(RED))
        page.set_viewport_size({'width': 1200, 'height': 630})
        page.set_content(share)
        page.screenshot(path=str(ROOT / 'app/opengraph-image.png'))
        print('wrote app/opengraph-image.png')
        browser.close()


if __name__ == '__main__':
    os.chdir(ROOT)
    main()
