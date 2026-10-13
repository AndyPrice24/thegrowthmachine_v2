# Growth Machine hero assets

`build_machine.py` turns Andrew's two approved artworks into the layers the
hero uses. The approved files are the source of truth and are never edited:

- `public/growth-machine-desktop-approved.webp`
- `public/growth-machine-mobile-approved.webp`

Run it whenever either file changes:

```bash
pip install -r tools/machine/requirements.txt
npm run machine        # = python3 tools/machine/build_machine.py
```

It writes `public/machine/{desktop,mobile}/*.webp` and
`components/growth-machine/manifest.json`. Commit both.

## What it does

1. **Transparency.** The art was flattened onto a cream vignette. The script
   estimates that backdrop and converts it to alpha, so soft shadows and red
   glow become real translucency instead of a cream rectangle.
2. **Cards.** The baked-in cards are erased; the page draws them as live,
   readable text in the same positions (on phones the inputs move into a
   three-by-two block over their pipes).
3. **Nameplate.** The art's lettering is an AI approximation of the logo. It
   is cleaned off and the real vector logo (`logo-paths.js`, from the original
   Astro repo) is laid over it.
4. **Gear rig.** Each gear's teeth are unwrapped to polar coordinates and
   folded by tooth pitch; the median tooth gives an exactly periodic ring that
   can turn any whole number of teeth. The base under the rings is filled with
   what lies behind the teeth, and glows/brackets in front of the gears go on
   a static front layer. The rig is only visible while the gears turn, so the
   resting machine is the approved art itself.
5. **Pipes.** Every pipe's centre-line is traced from the red in the artwork,
   so the light in the animation follows the real pipe.

## Measurements

All coordinates in `CFG` are pixels of the approved artwork. Card boxes and
pipe connector positions were read off gridded crops; gear centres were fitted
by maximising tooth periodicity (central gear: 28 teeth; top function gears:
21; bottom: 20). If a new artwork moves anything, re-measure these first.
