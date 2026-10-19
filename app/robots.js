// Built once at deploy time, so it can be served as a static file.
export const dynamic = 'force-static';

import { LAUNCHED } from './site';

export default function robots(){
  if(!LAUNCHED) return {rules:{userAgent:'*',disallow:'/'}};
  return {rules:{userAgent:'*',allow:'/'},sitemap:'https://thegrowthmachine.co/sitemap.xml'};
}
