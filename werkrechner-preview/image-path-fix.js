(function(){
'use strict';
const BASE='/images/';
function fix(){
  document.querySelectorAll('img').forEach(img=>{
    const raw=img.getAttribute('src')||'';
    if(raw.includes('/images/')||raw.startsWith('./images/')||raw.startsWith('images/')){
      const file=raw.split('/').pop();
      if(file) img.src=BASE+file;
    }
  });
}
addEventListener('DOMContentLoaded',fix);
addEventListener('hashchange',()=>setTimeout(fix,30));
const app=document.getElementById('app');
if(app)new MutationObserver(fix).observe(app,{childList:true,subtree:true});
fix();
})();
