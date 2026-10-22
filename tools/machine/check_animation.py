"""Cleanliness check for the hero machine's animation.

With a local server on :3123 (npx next start -p 3123), freezes the animation
at moments through the gear turn on desktop and phone and compares each with
the machine at rest. Prints, per frame:
  new-red-outside-red-gear  red that appears anywhere but the turning red gear
                            (stains); should stay near 0
  new-black                 pixels gone near-black inside the gear rings
                            (holes); moving tooth gaps account for some
Writes full.png: rest and two moments mid-turn, desktop and phone, to look at.
Run after every change to tools/machine or the machine's CSS.

    python3 tools/machine/check_animation.py
"""
import json
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
m=json.load(open('/home/user/thegrowthmachine_v2/components/growth-machine/manifest.json'))
B={'desktop':((105,142),(63,90)),'mobile':((126,170),(76,108))}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    crops=[]
    for kind,vp,scroll in [('desktop',(1440,1300),0),('mobile',(390,844),300)]:
        pg=b.new_page(viewport={'width':vp[0],'height':vp[1]},device_scale_factor=2); pg.goto('http://localhost:3123/'); pg.wait_for_timeout(2500)
        pg.evaluate(f"scrollTo(0,{scroll})"); pg.wait_for_timeout(1200)
        pg.add_style_tag(content="figure svg[class*=flow], figure [class*=card], figure img[src*=innard]{visibility:hidden!important}")
        bb=pg.locator('figure [class*=stage]').locator('visible=true').first.locator('[class*=canvas]').first.bounding_box()
        fr={}
        for t in [99999,1950,2100,2300,2500,2700,2900,3150,3400]:
            pg.evaluate(f"document.getAnimations().forEach(a=>{{a.pause(); a.currentTime={t};}})"); pg.wait_for_timeout(120)
            pg.screenshot(path=f'cr-{t}.png',clip=bb); fr[t]=np.array(Image.open(f'cr-{t}.png').convert('RGB')).astype(int)
        pg.close()
        rest=fr[99999]; H,W,_=rest.shape; k=W/m[kind]['size'][0]; yy,xx=np.mgrid[:H,:W]
        allz=np.zeros((H,W),bool); redz=np.zeros((H,W),bool)
        for g in m[kind]['gears']:
            d=np.hypot(xx-g['c'][0]*k,yy-g['c'][1]*k)/k
            band=B[kind][0] if g['id']=='red' else B[kind][1]
            z=(d>band[0]-4)&(d<band[1]+4); allz|=z
            if g['id']=='red': redz|=z
        greyz=allz&~redz
        red=lambda a:a[...,0]-np.maximum(a[...,1],a[...,2])
        lum=lambda a:a.mean(-1)
        for t in [1950,2100,2300,2500,2700,2900,3150,3400]:
            f=fr[t]
            newred=int(((red(f)>70)&(red(rest)<40)&~redz).sum())  # red appearing anywhere but the red gear ring
            dark=int(((lum(f)<35)&(lum(rest)>70)&allz).sum())     # holes / black patches in the gear rings
            print(f'{kind} t={t} new-red-outside-red-gear={newred} new-black={dark}')
        rg=[g for g in m[kind]['gears'] if g['id']=='red'][0]; cx,cy=rg['c'][0]*k,rg['c'][1]*k; R=B[kind][0][1]*k*1.9
        for t in [99999,2300,2700]:
            crops.append(Image.fromarray(fr[t].astype(np.uint8)).crop((int(cx-R),int(cy-R),int(cx+R),int(cy+R))).resize((600,600)))
    b.close()
o=Image.new('RGB',(1820,1210),'white')
for i,c in enumerate(crops): o.paste(c,((i%3)*610,(i//3)*610))
o.save('full.png')
