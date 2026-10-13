import { LAUNCHED } from './site';

export default function robots(){
  if(!LAUNCHED) return {rules:{userAgent:'*',disallow:'/'}};
  return {rules:{userAgent:'*',allow:'/'},sitemap:'https://thegrowthmachine.co/sitemap.xml'};
}
