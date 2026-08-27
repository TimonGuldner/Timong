(function(){
'use strict';

function initMenu(){
  const header=document.querySelector('.site-header');
  const button=document.querySelector('.menu-btn');
  const nav=document.querySelector('#main-nav');
  if(!header||!button||!nav)return;
  const close=()=>{header.classList.remove('open');document.body.classList.remove('menu-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Menü öffnen');button.textContent='☰';};
  button.addEventListener('click',()=>{const open=header.classList.toggle('open');document.body.classList.toggle('menu-open',open);button.setAttribute('aria-expanded',open?'true':'false');button.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');button.textContent=open?'✕':'☰';});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('click',e=>{if(header.classList.contains('open')&&!header.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}

function initContact(){
  const form=document.querySelector('#wr-contact-form');
  if(!form)return;
  const status=document.querySelector('#wr-contact-status');
  const button=form.querySelector('button[type="submit"]');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const honey=form.querySelector('[name="_honey"]');
    if(honey&&honey.value)return;
    if(!form.reportValidity())return;
    if(status)status.textContent='Nachricht wird gesendet …';
    if(button)button.disabled=true;
    const data=new FormData(form);
    data.append('_subject','Neue Nachricht über WerkRechner');
    data.append('_template','table');
    data.append('_captcha','false');
    try{
      const res=await fetch('https://formsubmit.co/ajax/timonguldner55@gmail.com',{method:'POST',headers:{Accept:'application/json'},body:data});
      if(!res.ok)throw new Error('send_failed');
      const body=await res.json().catch(()=>({success:true}));
      if(body&&body.success===false)throw new Error('send_failed');
      form.reset();
      if(status)status.textContent='Danke. Deine Nachricht wurde erfolgreich versendet.';
    }catch(err){
      if(status)status.textContent='Die Nachricht konnte gerade nicht versendet werden. Bitte versuche es später erneut oder nutze die angegebene E-Mail-Adresse.';
    }finally{
      if(button)button.disabled=false;
    }
  });
}

function clearLocalSettings(){
  const button=document.querySelector('[data-clear-wr-settings]');
  const status=document.querySelector('[data-clear-wr-status]');
  if(!button)return;
  button.addEventListener('click',()=>{
    let removed=0;
    try{
      const keys=[];
      for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
      keys.filter(Boolean).filter(k=>k.startsWith('werkrechner:')||k.startsWith('wr_')).forEach(k=>{localStorage.removeItem(k);removed++;});
      if(status)status.textContent=removed?`${removed} lokale WerkRechner-Einstellung(en) wurden gelöscht.`:'Es waren keine lokalen WerkRechner-Einstellungen gespeichert.';
    }catch(err){
      if(status)status.textContent='Lokale Einstellungen konnten in diesem Browser nicht gelöscht werden.';
    }
  });
}

function initShare(){
  document.querySelectorAll('[data-wr-share]').forEach(button=>button.addEventListener('click',async()=>{
    const data={title:document.title,text:'WerkRechner – kostenlose Rechner für Handwerk und Baustelle',url:location.href};
    if(navigator.share){try{await navigator.share(data);return;}catch(e){}}
    try{await navigator.clipboard.writeText(location.href);const old=button.textContent;button.textContent='Link kopiert ✓';setTimeout(()=>button.textContent=old,1600);}catch(e){}
  }));
}

document.addEventListener('DOMContentLoaded',()=>{initMenu();initContact();clearLocalSettings();initShare();});
})();
