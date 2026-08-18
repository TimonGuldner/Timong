(function(){
'use strict';
const ORIGIN='https://www.werkrechner.de';
function cleanPathFromRoute(route){
  if(route==='home')return '/';
  if(route==='tools')return '/tools';
  if(route.startsWith('tool/'))return '/tools/'+route.slice(5);
  if(route==='guides')return '/ratgeber';
  if(route.startsWith('guide/'))return '/ratgeber/'+route.slice(6);
  return ({about:'/ueber-uns',contact:'/kontakt',methodik:'/methodik',impressum:'/impressum',datenschutz:'/datenschutz','privacy-settings':'/datenschutz-einstellungen'})[route]||'/';
}
function apply(){
  const route=(location.hash.slice(1)||'home');
  const path=cleanPathFromRoute(route);
  let canonical=document.querySelector('link[rel="canonical"]');
  if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}
  canonical.href=ORIGIN+path;
  let robots=document.querySelector('meta[name="robots"]');
  if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots)}
  robots.content='index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const h1=document.querySelector('h1');
  if(h1&&h1.textContent.trim()) document.title=h1.textContent.trim()+' | WerkRechner';
  let desc=document.querySelector('meta[name="description"]');
  const lead=document.querySelector('.lead')||document.querySelector('main p');
  if(desc&&lead&&lead.textContent.trim()) desc.content=lead.textContent.trim().slice(0,155);
  if(window.WR_CLEAN_ROUTE_BOOTSTRAPPED){
    setTimeout(()=>{history.replaceState(null,'',path)},1200);
  }
}
addEventListener('DOMContentLoaded',()=>setTimeout(apply,450));
addEventListener('hashchange',()=>setTimeout(apply,450));
})();
