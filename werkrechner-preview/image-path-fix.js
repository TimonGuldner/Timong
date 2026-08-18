(function(){
'use strict';
const MAP={
  'hero.webp':'https://images.unsplash.com/photo-1778074762022-c33cc42f79ae?auto=format&fit=crop&w=1600&q=82',
  'kalkulation.webp':'https://images.unsplash.com/photo-1779729686198-117c1307894d?auto=format&fit=crop&w=1400&q=82',
  'material.webp':'https://images.unsplash.com/photo-1746221331496-a87689fc8eb9?auto=format&fit=crop&w=1400&q=82',
  'baustelle.webp':'https://images.unsplash.com/photo-1778074762022-c33cc42f79ae?auto=format&fit=crop&w=1400&q=82',
  'renovierung.webp':'https://images.unsplash.com/photo-1768321911908-01c691fcc5a0?auto=format&fit=crop&w=1400&q=82'
};
function fix(){
  document.querySelectorAll('img').forEach(img=>{
    const raw=img.getAttribute('src')||'';
    const file=raw.split('/').pop()?.split('?')[0];
    if(file&&MAP[file]&&img.src!==MAP[file]){
      img.src=MAP[file];
      img.removeAttribute('srcset');
    }
  });
}
addEventListener('DOMContentLoaded',fix);
addEventListener('hashchange',()=>setTimeout(fix,30));
const app=document.getElementById('app');
if(app)new MutationObserver(fix).observe(app,{childList:true,subtree:true});
fix();
})();
