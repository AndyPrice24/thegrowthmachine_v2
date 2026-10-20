"""Render the How we work gear as image layers.

The gear is lit as a 3D object: a height map (chamfered teeth, recessed
face, enamel ring channel, raised dial) shaded with a key light up-left, a
studio reflection and a brushed-metal texture. Finish: gunmetal with a red
enamel ring and an ivory dial (option B of the October 2026 stills).

Writes public/how-we-work/, all the same square canvas, gear centred, tip
radius 80% of the half-width (room for the shadow and the glow):

  shadow.webp  soft and contact shadow on the paper (static)
  back.webp    the plate behind, darker; turned out of step, then clicks in
  front.webp   the gear itself, ring unlit (dark oxblood), dial without text
  ring.webp    the ring lit: red enamel, laid over front.webp
  glow.webp    the bloom around the ring as it lights

The words on the dial are live text on the page, not part of the image.

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
dx, dy = xx - C, yy - C
r = np.hypot(dx, dy) / RU
th = np.arctan2(dy, dx)
PX = 1 / RU


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- geometry

TEETH = 12
ROOT_R, TIP_R = 0.845, 1.0
u = np.abs(((th / (2 * np.pi)) * TEETH) % 1 - 0.5)     # 0 mid-tooth
edge = ROOT_R + (TIP_R - ROOT_R) * (1 - smooth(0.165, 0.285, u))
MASK = (r < edge).astype(np.float64)
INSIDE = ndi.distance_transform_edt(MASK)

R_DIAL = 0.60
R_FACE_IN, R_FACE_OUT = 0.625, 0.725
R_RING, RING_W = 0.77, 0.03


def heights(*, face=True, ring=True, dial=True):
    H = 34 * smooth(0, 1, np.clip(INSIDE / 20, 0, 1)) ** 0.85        # chamfered edge
    if face:
        f = smooth(R_FACE_IN - 6 * PX, R_FACE_IN + 6 * PX, r) * (1 - smooth(R_FACE_OUT - 6 * PX, R_FACE_OUT + 6 * PX, r))
        H -= 7 * f
    if ring:
        g = np.clip(1 - np.abs(r - R_RING) / RING_W, 0, 1)
        H -= 9 * np.sqrt(g)
    if dial:
        H += 9 * (1 - smooth(R_DIAL - 10 * PX, R_DIAL + 2 * PX, r))
    return ndi.gaussian_filter(H, 1.2)


# ---------------------------------------------------------------- shading

L = np.array([-0.5, -0.72, 0.9]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
HV = (L + V) / np.linalg.norm(L + V)
RING_NOISE = ndi.gaussian_filter1d(np.random.default_rng(7).standard_normal(int(RU * 1.2)), 0.8)
TEX_RINGS = RING_NOISE[np.clip((r * RU).astype(int), 0, len(RING_NOISE) - 1)]
SHEEN = np.cos(2 * (th - np.arctan2(-0.72, -0.5))) ** 2


def shade(albedo, H, *, metal, rough, brushed=0.0, spec=1.0, env_k=1.0):
    gy, gx = np.gradient(H)
    n = np.dstack([-gx * 1.6, -gy * 1.6, np.ones_like(H)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    ndl = np.clip(n @ L, 0, 1)
    ndh = np.clip(n @ HV, 0, 1)
    R = 2 * n[..., 2:3] * n - V                           # reflection
    env = 0.42 + 0.38 * smooth(-0.6, 0.7, -R[..., 1]) + 0.18 * smooth(-0.2, 0.9, -R[..., 0])
    env += 0.55 * np.exp(-((R[..., 0] + 0.42) ** 2 + (R[..., 1] + 0.55) ** 2) / 0.06)
    tex = 1 + brushed * (0.035 * TEX_RINGS + 0.16 * (SHEEN - 0.5))
    hi = spec * ndh ** (8 + (1 - rough) * 120) * (1 - rough * 0.6)
    a = np.asarray(albedo)[None, None, :]
    if metal:
        col = a * (0.1 + 0.25 * ndl[..., None] + env_k * 0.85 * (env * tex)[..., None]) + hi[..., None] * (0.55 * a + 0.45)
    else:
        col = a * (0.32 + 0.72 * ndl[..., None]) * tex[..., None] + hi[..., None] * 0.55 + 0.06 * env[..., None]
    ao = 1 - np.clip((ndi.gaussian_filter(H, 10) - H) / 14, 0, 0.45)
    return np.clip(col * ao[..., None], 0, 1)


def save(name, rgb, alpha):
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f'{name}.webp', 'WEBP', quality=88, method=6)


GUNMETAL = [0.40, 0.40, 0.42]
IVORY = [0.99, 0.975, 0.95]
OXBLOOD = [0.34, 0.07, 0.06]
ENAMEL = [0.86, 0.13, 0.10]

alpha = ndi.gaussian_filter(MASK, 0.7)
ring_band = np.clip(1 - np.abs(r - R_RING) / RING_W, 0, 1) > 0.05
ring_m = ndi.gaussian_filter(ring_band.astype(float), 1.0)
dial_m = ndi.gaussian_filter((r < R_DIAL - 0.004).astype(float), 1.0)
face_m = smooth(R_FACE_IN - 6 * PX, R_FACE_IN + 6 * PX, r) * (1 - smooth(R_FACE_OUT - 6 * PX, R_FACE_OUT + 6 * PX, r))

H = heights()

# The gear, ring unlit.
body = shade(GUNMETAL, H, metal=True, rough=0.35, brushed=1.0, env_k=1.15)
face = shade(GUNMETAL, H, metal=True, rough=0.45, brushed=1.2, env_k=1.15)
col = body * (1 - face_m[..., None]) + face * face_m[..., None]
unlit = shade(OXBLOOD, H, metal=False, rough=0.15, spec=1.2)
col = col * (1 - ring_m[..., None]) + unlit * ring_m[..., None]
dial = shade(IVORY, H, metal=False, rough=0.15)
gloss = np.exp(-(((dx + 0.30 * RU) / (0.30 * RU)) ** 2 + ((dy + 0.34 * RU) / (0.17 * RU)) ** 2))
dial = np.clip(dial + 0.22 * gloss[..., None] * (r < R_DIAL)[..., None], 0, 1)
dial *= (1 - 0.06 * smooth(0.25, R_DIAL, r))[..., None]
col = col * (1 - dial_m[..., None]) + dial * dial_m[..., None]
save('front', col, alpha)

# The ring lit, on its own.
lit = shade(ENAMEL, H, metal=False, rough=0.12, spec=1.5)
lit = np.clip(lit * 1.08 + 0.05 * np.array([1, 0.3, 0.25]), 0, 1)
save('ring', lit, ring_m)

# Its bloom.
bloom = ndi.gaussian_filter(ring_band.astype(float), 14) * 0.9 + ndi.gaussian_filter(ring_band.astype(float), 4) * 0.5
save('glow', np.ones((N, N, 3)) * np.array([1.0, 0.36, 0.24]), np.clip(bloom, 0, 1))

# The plate behind: the same gear, darker, no face detail.
Hb = heights(face=False, ring=False, dial=False)
back = shade([0.24, 0.24, 0.26], Hb, metal=True, rough=0.4, brushed=0.8, env_k=1.0)
save('back', back, alpha)

# The shadow it casts on the paper.
soft = ndi.gaussian_filter(np.roll(MASK, (int(0.06 * RU), int(0.025 * RU)), (0, 1)), 0.045 * RU)
contact = ndi.gaussian_filter(np.roll(MASK, (int(0.014 * RU), int(0.005 * RU)), (0, 1)), 0.011 * RU)
shadow_a = 1 - (1 - 0.30 * soft) * (1 - 0.24 * contact)
save('shadow', np.ones((N, N, 3)) * np.array([0.27, 0.19, 0.12]), shadow_a)

print('wrote', ', '.join(sorted(p.name for p in OUT.glob('*.webp'))))
