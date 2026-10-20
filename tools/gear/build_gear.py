"""Render the How we work gear as image layers.

The gear is lit as a 3D object: a height map (chamfered teeth, recessed
face, an engraved ring channel, a raised dial) shaded with a key light up
and to the left, a studio reflection, and soft shadows. Finish: ivory
ceramic, a fine red enamel ring, a glossy ivory dial (option C of the
October 2026 stills).

The red leaves the gear through ports: a short red channel runs from the
ring to the gear's edge, into a ceramic port behind the gear, and the
page's red lines leave from the port's end. Phones and tablets have one
port at the bottom (two lines out); desktop has one each side (three
wires out of each).

Writes public/how-we-work/, all on the same square canvas with the gear
centred and its tip radius 80% of the half-width. Per layout, `bottom`
(phones and tablets) or `sides` (desktop):

  shadow-<layout>.webp  shadow of the gear and its ports on the paper
  port-<layout>.webp    the ports, behind the gear
  back.webp             the plate behind, a darker stone; clicks into line
  front-<layout>.webp   the gear, ring and channels unlit, dial without text
  ring-<layout>.webp    the ring and channels lit, laid over the front
  glow.webp             the bloom around the ring as it lights

The words on the dial are live text on the page, not part of the image.
Where the page's lines start (each port's exits) is EXITS below, in tip
radii from the centre; the component uses the same numbers.

    npm run gear        # = python3 tools/gear/build_gear.py (numpy, scipy, pillow)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'how-we-work'
N = 1440                 # render size; written at half
C = N / 2
RU = 0.80 * C            # tip radius
SIZE = N // 2

yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
dx, dy = (xx - C) / RU, (yy - C) / RU      # in tip radii, y down
r = np.hypot(dx, dy)
th = np.arctan2(dy, dx)
PX = 1 / RU


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- geometry

TEETH = 12               # teeth centred at 15deg + k*30deg: gaps at 0, 90, 180, 270
ROOT_R = 0.845
u = np.abs(((th / (2 * np.pi)) * TEETH) % 1 - 0.5)
edge = ROOT_R + (1 - ROOT_R) * (1 - smooth(0.165, 0.285, u))
MASK = (r < edge).astype(np.float64)
INSIDE = ndi.distance_transform_edt(MASK)

R_DIAL = 0.60
R_FACE_IN, R_FACE_OUT = 0.625, 0.725
R_RING = 0.77
GROOVE_W = 0.022         # the engraved channel the red sits in
LINE_W = 0.0085          # half-width of the red line: about 2px on screen

# The port: a cable gland with a rounded nose, a darker collar and a red
# sleeve the lines leave through.
PORT_FROM, PORT_TO = 0.80, 1.16    # along its axis, nose tip at PORT_TO
PORT_W = 0.085                     # half-width
SLEEVE_W = 0.045                   # half-width of the red sleeve at the nose
EXITS = {
    'bottom': [(-0.02, PORT_TO - 0.006), (0.02, PORT_TO - 0.006)],
    'sides': [(s * (PORT_TO - 0.008), o) for s in (-1, 1) for o in (-0.03, 0.0, 0.03)],
}
AXES = {'bottom': [(0, 1)], 'sides': [(-1, 0), (1, 0)]}


def along(ax):
    """Distance along a port axis, and across it."""
    a = dx * ax[0] + dy * ax[1]
    c = dx * -ax[1] + dy * ax[0]
    return a, c


def channel(layout, half):
    """The radial channel(s) from the ring out to the gear's edge."""
    m = np.zeros_like(r)
    for ax in AXES[layout]:
        a, c = along(ax)
        m = np.maximum(m, (np.abs(c) < half) * smooth(R_RING - 0.01, R_RING + 0.005, a) * (a < 0.99))
    return m


def heights(layout=None, *, detail=True):
    H = 34 * smooth(0, 1, np.clip(INSIDE / 20, 0, 1)) ** 0.85         # chamfered edge
    if detail:
        f = smooth(R_FACE_IN - 6 * PX, R_FACE_IN + 6 * PX, r) * (1 - smooth(R_FACE_OUT - 6 * PX, R_FACE_OUT + 6 * PX, r))
        H -= 7 * f
        g = np.clip(1 - np.abs(r - R_RING) / GROOVE_W, 0, 1)
        if layout:
            for ax in AXES[layout]:
                a, c = along(ax)
                gc = np.clip(1 - np.abs(c) / GROOVE_W, 0, 1) * (a > R_RING) * (a < 1.0)
                g = np.maximum(g, gc)
        H -= 5 * np.sqrt(g)
        H += 9 * (1 - smooth(R_DIAL - 10 * PX, R_DIAL + 2 * PX, r))
    return ndi.gaussian_filter(H, 1.2)


def capsule(ax):
    """Distance from the port's axis segment (its body is all points within
    PORT_W of it, so the end is a round nose)."""
    a, c = along(ax)
    t = np.clip(a, PORT_FROM, PORT_TO - PORT_W)
    return np.hypot(a - t, c), a, c


def port_mask(layout):
    m = np.zeros_like(r)
    for ax in AXES[layout]:
        d, _, _ = capsule(ax)
        m = np.maximum(m, (d < PORT_W).astype(float))
    return ndi.gaussian_filter(m, 0.8)


def port_parts(layout):
    """Heights (a rounded body, a raised collar) and the collar and sleeve
    masks."""
    H = np.zeros_like(r)
    collar = np.zeros_like(r)
    sleeve = np.zeros_like(r)
    for ax in AXES[layout]:
        d, a, c = capsule(ax)
        body = np.sqrt(np.clip(1 - (d / PORT_W) ** 2, 0, 1))      # a rounded cylinder
        H = np.maximum(H, 26 * body)
        col = smooth(0.965, 0.975, a) * (1 - smooth(1.015, 1.025, a)) * (d < PORT_W)
        collar = np.maximum(collar, col)
        H += 3 * col
        sl = (np.abs(c) < SLEEVE_W) * smooth(PORT_TO - 0.05, PORT_TO - 0.045, a) * (d < PORT_W)
        sleeve = np.maximum(sleeve, sl)
    return ndi.gaussian_filter(H, 1.0), ndi.gaussian_filter(collar, 0.8), ndi.gaussian_filter(sleeve, 0.8)


# ---------------------------------------------------------------- shading

L = np.array([-0.5, -0.72, 0.9]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
HV = (L + V) / np.linalg.norm(L + V)


def shade(albedo, H, *, rough, spec=1.0):
    gy, gx = np.gradient(H)
    n = np.dstack([-gx * 1.6, -gy * 1.6, np.ones_like(H)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    ndl = np.clip(n @ L, 0, 1)
    ndh = np.clip(n @ HV, 0, 1)
    R = 2 * n[..., 2:3] * n - V
    env = 0.42 + 0.38 * smooth(-0.6, 0.7, -R[..., 1]) + 0.18 * smooth(-0.2, 0.9, -R[..., 0])
    hi = spec * ndh ** (8 + (1 - rough) * 120) * (1 - rough * 0.6)
    a = np.asarray(albedo)[None, None, :]
    # Ceramic: a high, warm ambient so the shaded sides stay creamy, not grey.
    col = a * (0.48 + 0.56 * ndl[..., None]) * np.array([1.0, 0.985, 0.96]) + hi[..., None] * 0.5 + 0.05 * env[..., None]
    ao = 1 - np.clip((ndi.gaussian_filter(H, 10) - H) / 16, 0, 0.32)
    return np.clip(col * ao[..., None], 0, 1)


def save(name, rgb, alpha):
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f'{name}.webp', 'WEBP', quality=90, method=6)


def shadow_of(mask):
    soft = ndi.gaussian_filter(np.roll(mask, (int(0.06 * RU), int(0.025 * RU)), (0, 1)), 0.045 * RU)
    contact = ndi.gaussian_filter(np.roll(mask, (int(0.014 * RU), int(0.005 * RU)), (0, 1)), 0.011 * RU)
    return 1 - (1 - 0.26 * soft) * (1 - 0.22 * contact)


CERAMIC = [0.99, 0.965, 0.92]
DIAL = [1.0, 0.985, 0.955]
STONE = [0.80, 0.76, 0.70]
PORT = [0.95, 0.92, 0.87]
COLLAR = [0.78, 0.74, 0.68]
OXBLOOD = [0.42, 0.12, 0.10]
ENAMEL = [0.86, 0.13, 0.10]
SHADOW = np.array([0.27, 0.19, 0.12])

alpha = ndi.gaussian_filter(MASK, 0.7)
dial_m = ndi.gaussian_filter((r < R_DIAL - 0.004).astype(float), 1.0)
gloss = np.exp(-(((dx + 0.30) / 0.30) ** 2 + ((dy + 0.34) / 0.17) ** 2))
ring_line = (np.abs(r - R_RING) < LINE_W).astype(float)

for layout in ('bottom', 'sides'):
    H = heights(layout)
    line = ndi.gaussian_filter(np.maximum(ring_line, channel(layout, LINE_W)), 0.9)

    # The gear, ring and channels unlit.
    col = shade(CERAMIC, H, rough=0.5)
    unlit = shade(OXBLOOD, H, rough=0.3)
    col = col * (1 - line[..., None]) + unlit * line[..., None]
    dial = shade(DIAL, H, rough=0.2)
    dial = np.clip(dial + 0.22 * gloss[..., None] * (r < R_DIAL)[..., None], 0, 1)
    dial *= (1 - 0.06 * smooth(0.25, R_DIAL, r))[..., None]
    col = col * (1 - dial_m[..., None]) + dial * dial_m[..., None]
    save(f'front-{layout}', col, alpha)

    # The ring and channels lit.
    lit = np.clip(shade(ENAMEL, H, rough=0.12, spec=1.5) * 1.1, 0, 1)
    save(f'ring-{layout}', lit, line * alpha)

    # The ports, behind the gear.
    pm = port_mask(layout)
    Hp, collar, sleeve = port_parts(layout)
    pc = shade(PORT, Hp, rough=0.4)
    pc = pc * (1 - collar[..., None]) + shade(COLLAR, Hp, rough=0.35) * collar[..., None]
    pc = pc * (1 - sleeve[..., None]) + shade(ENAMEL, Hp, rough=0.15, spec=1.4) * sleeve[..., None]
    save(f'port-{layout}', pc, pm)

    # Their shadow, and the gear's.
    save(f'shadow-{layout}', np.ones((N, N, 3)) * SHADOW, shadow_of(np.maximum(MASK, pm)))

# The plate behind: the same gear in a darker stone, no face detail.
save('back', shade(STONE, heights(detail=False), rough=0.5), alpha)

# The bloom as the ring lights.
band = (np.abs(r - R_RING) < 0.012).astype(float)
bloom = ndi.gaussian_filter(band, 12) * 1.1 + ndi.gaussian_filter(band, 3.5) * 0.6
save('glow', np.ones((N, N, 3)) * np.array([1.0, 0.36, 0.24]), np.clip(bloom, 0, 1))

for old in ('front', 'ring', 'shadow'):
    (OUT / f'{old}.webp').unlink(missing_ok=True)
print('wrote', ', '.join(sorted(p.name for p in OUT.glob('*.webp'))))
