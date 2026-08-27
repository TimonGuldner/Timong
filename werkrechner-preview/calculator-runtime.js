(function(){
'use strict';

const $=(root,sel)=>root.querySelector(sel);
const $$=(root,sel)=>Array.from(root.querySelectorAll(sel));
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number.isFinite(n)?n:0);
const num=(n,d=2)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:d}).format(Number.isFinite(n)?n:0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const val=(form,id)=>{const el=$(`#${CSS.escape(id)}`,form);if(!el)return 0;const raw=String(el.value||'').trim().replace(',','.');const n=Number(raw);return Number.isFinite(n)?n:0};
const text=(form,id)=>{const el=$(`#${CSS.escape(id)}`,form);return el?String(el.value||'').trim():''};

function resultRows(rows,big){
  return `<div class="result-big">${big}</div><table class="result-table"><tbody>${rows.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${b}</td></tr>`).join('')}</tbody></table>`;
}

function calculate(kind,form){
  let rows=[],big='';
  if(kind==='hourly'){
    const productive=val(form,'productive');
    const annual=val(form,'wage')*val(form,'factor')*productive+val(form,'overhead');
    const base=productive>0?annual/productive:0;
    const rate=base*(1+val(form,'profit')/100);
    rows=[['Jahreskosten',euro(annual)],['Kostensatz je produktiver Stunde',euro(base)],['Verrechnungssatz',euro(rate)]];big=euro(rate)+'/h';
  }else if(kind==='employee'){
    const m=val(form,'gross')*val(form,'factor');rows=[['Arbeitgeberkosten/Monat',euro(m)],['Arbeitgeberkosten/Jahr',euro(m*12)]];big=euro(m)+'/Monat';
  }else if(kind==='material'){
    const net=val(form,'buy')*(1+val(form,'waste')/100)*(1+val(form,'markup')/100);const gross=net*(1+val(form,'vat')/100);rows=[['Verkauf netto',euro(net)],['Verkauf brutto',euro(gross)]];big=euro(gross);
  }else if(kind==='markup'){
    const buy=val(form,'buy'),sell=val(form,'sell');const markup=buy?((sell-buy)/buy*100):0;const margin=sell?((sell-buy)/sell*100):0;rows=[['Aufschlag',num(markup,1)+' %'],['Handelsspanne',num(margin,1)+' %']];big=num(markup,1)+' %';
  }else if(kind==='travel'){
    const vehicle=val(form,'km')*val(form,'cpk'),timeCost=val(form,'time')*val(form,'rate'),total=vehicle+timeCost;rows=[['Fahrzeugkosten',euro(vehicle)],['Fahrzeit',euro(timeCost)],['Gesamt',euro(total)]];big=euro(total);
  }else if(kind==='contribution'){
    const revenue=val(form,'revenue'),db=revenue-val(form,'variable');rows=[['Deckungsbeitrag',euro(db)],['Deckungsbeitragsquote',num(revenue?db/revenue*100:0,1)+' %']];big=euro(db);
  }else if(kind==='quote'){
    const labor=val(form,'hours')*val(form,'rate'),material=val(form,'material')*(1+val(form,'markup')/100),net=labor+material+val(form,'travel'),gross=net*(1+val(form,'vat')/100);rows=[['Arbeitsleistung',euro(labor)],['Material',euro(material)],['Netto',euro(net)],['Brutto',euro(gross)]];big=euro(gross);
  }else if(kind==='project'){
    const costs=val(form,'labor')+val(form,'material')+val(form,'equipment')+val(form,'travel')+val(form,'other');const margin=val(form,'margin')/100;const target=margin>=0&&margin<1?costs/(1-margin):0;rows=[['Gesamtkosten',euro(costs)],['Zielverkauf',euro(target)],['Zielertrag',euro(target-costs)]];big=euro(target);
  }else if(kind==='measure'){
    const area=val(form,'length')*val(form,'width')*Math.max(1,val(form,'qty'));rows=[['Gesamtfläche',num(area)+' m²']];big=num(area)+' m²';
  }else if(kind==='timesheet'){
    const s=text(form,'start').split(':').map(Number),e=text(form,'end').split(':').map(Number);let start=(s[0]||0)*60+(s[1]||0),end=(e[0]||0)*60+(e[1]||0);if(end<start)end+=1440;const mins=Math.max(0,end-start-val(form,'break'));rows=[['Nettoarbeitszeit',num(mins/60)+' h'],['Netto in Minuten',num(mins,0)+' min']];big=num(mins/60)+' h';
  }else if(kind==='tiles'){
    const order=val(form,'area')*(1+val(form,'waste')/100),tileArea=(val(form,'tw')/100)*(val(form,'th')/100),pieces=tileArea>0?Math.ceil(order/tileArea):0;rows=[['Bestellfläche',num(order)+' m²'],['Rechnerische Stückzahl',num(pieces,0)+' Stück']];big=num(order)+' m²';
  }else if(kind==='waste'){
    const order=val(form,'area')*(1+val(form,'waste')/100),extra=order-val(form,'area');rows=[['Nettofläche',num(val(form,'area'))+' m²'],['Reserve',num(extra)+' m²'],['Bestellfläche',num(order)+' m²']];big=num(order)+' m²';
  }else if(kind==='paint'){
    const coverage=val(form,'coverage'),liters=coverage>0?val(form,'area')*val(form,'coats')/coverage:0;rows=[['Gesamt-Anstrichfläche',num(val(form,'area')*val(form,'coats'))+' m²'],['Farbbedarf',num(liters)+' L']];big=num(liters)+' L';
  }else if(kind==='walls'){
    const gross=2*(val(form,'length')+val(form,'width'))*val(form,'height'),net=Math.max(0,gross-val(form,'openings'));rows=[['Brutto-Wandfläche',num(gross)+' m²'],['Netto-Wandfläche',num(net)+' m²']];big=num(net)+' m²';
  }else if(kind==='concrete'){
    const volume=val(form,'length')*val(form,'width')*val(form,'height'),plan=volume*(1+val(form,'reserve')/100);rows=[['Geometrisches Volumen',num(volume,3)+' m³'],['Planmenge inkl. Reserve',num(plan,3)+' m³']];big=num(plan,3)+' m³';
  }else if(kind==='screed'){
    const volume=val(form,'area')*(val(form,'thickness')/1000),mass=volume*val(form,'density');rows=[['Volumen',num(volume,3)+' m³'],['Grobe Masse',num(mass,0)+' kg']];big=num(volume,3)+' m³';
  }else if(kind==='mortar'){
    const volume=val(form,'area')*(val(form,'thickness')/1000);rows=[['Mörtelvolumen',num(volume,3)+' m³'],['Volumen in Litern',num(volume*1000,0)+' L']];big=num(volume,3)+' m³';
  }else if(kind==='grout'){
    const L=val(form,'tilel'),W=val(form,'tilew'),joint=val(form,'joint'),depth=val(form,'depth'),area=val(form,'area');const liters=(L>0&&W>0)?area*(L+W)*joint*depth/(L*W):0;rows=[['Geschätztes Fugenvolumen',num(liters,2)+' L'],['Fläche',num(area)+' m²']];big=num(liters,2)+' L';
  }else if(kind==='wallpaper'){
    const rollWidth=val(form,'rollw')/100,stripLength=val(form,'height')+val(form,'extra')/100,rollLength=val(form,'rolllen');const strips=rollWidth>0?Math.ceil(val(form,'perimeter')/rollWidth):0;const perRoll=stripLength>0?Math.floor(rollLength/stripLength):0;const rolls=perRoll>0?Math.ceil(strips/perRoll):0;rows=[['Benötigte Bahnen',num(strips,0)],['Bahnen pro Rolle',num(perRoll,0)],['Rollenbedarf',num(rolls,0)+' Rollen']];big=num(rolls,0)+' Rollen';
  }else if(kind==='roofarea'){
    const radians=val(form,'pitch')*Math.PI/180,cos=Math.cos(radians),area=Math.abs(cos)>0.000001?val(form,'footprint')/cos:0;rows=[['Geneigte Dachfläche',num(area)+' m²']];big=num(area)+' m²';
  }else if(kind==='roofpitch'){
    const run=val(form,'run'),deg=run>0?Math.atan(val(form,'rise')/run)*180/Math.PI:0,percent=run>0?val(form,'rise')/run*100:0;rows=[['Dachneigung',num(deg,1)+'°'],['Steigung',num(percent,1)+' %']];big=num(deg,1)+'°';
  }else if(kind==='decking'){
    const effective=(val(form,'boardw')+val(form,'gap'))/1000,base=effective>0?val(form,'area')/effective:0,lm=base*(1+val(form,'waste')/100);rows=[['Laufmeter ohne Reserve',num(base,1)+' m'],['Laufmeter inkl. Reserve',num(lm,1)+' m']];big=num(lm,1)+' m';
  }else{
    return null;
  }
  return resultRows(rows,big);
}

function documentPreview(form){
  const entries=$$(form,'[data-wr-field]').map(el=>({label:el.getAttribute('data-label')||el.name||el.id,value:String(el.value||'').trim()})).filter(x=>x.value);
  if(!entries.length)return '<p>Bitte fülle mindestens ein Feld aus.</p>';
  return `<div class="result-big">Vorschau</div><dl class="wr-document-preview">${entries.map(x=>`<div><dt>${esc(x.label)}</dt><dd>${esc(x.value).replace(/\n/g,'<br>')}</dd></div>`).join('')}</dl>`;
}

function storageKey(form){return 'werkrechner:inputs:'+form.dataset.toolSlug;}
function collect(form){const out={};$$(form,'[data-wr-field]').forEach(el=>{if(el.id)out[el.id]=el.value});return out;}
function save(form,status){try{localStorage.setItem(storageKey(form),JSON.stringify({savedAt:new Date().toISOString(),values:collect(form)}));if(status){status.textContent='Werte wurden nur auf diesem Gerät gespeichert.';setTimeout(()=>status.textContent='',2400)}}catch(e){if(status)status.textContent='Speichern ist in diesem Browser gerade nicht möglich.';}}
function load(form,status){try{const raw=localStorage.getItem(storageKey(form));if(!raw){if(status)status.textContent='Für diesen Rechner sind keine Werte gespeichert.';return;}const data=JSON.parse(raw);Object.entries(data.values||{}).forEach(([id,v])=>{const el=$(`#${CSS.escape(id)}`,form);if(el)el.value=v});if(status){status.textContent='Gespeicherte Werte wurden geladen.';setTimeout(()=>status.textContent='',2200)}}catch(e){if(status)status.textContent='Gespeicherte Werte konnten nicht geladen werden.';}}

function initForm(form){
  if(form.dataset.runtimeReady)return;form.dataset.runtimeReady='1';
  const kind=form.dataset.toolKind,slug=form.dataset.toolSlug,result=form.parentElement.querySelector('[data-wr-result]'),status=form.parentElement.querySelector('[data-wr-storage-status]');
  form.addEventListener('submit',e=>{e.preventDefault();const html=kind==='doc'?documentPreview(form):calculate(kind,form);if(!result)return;result.innerHTML=html||'<p>Für diese Eingaben konnte kein Ergebnis berechnet werden.</p>';result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'nearest'});document.dispatchEvent(new CustomEvent('wr:calculated',{detail:{slug,kind}}));});
  const loadBtn=form.parentElement.querySelector('[data-wr-load]');if(loadBtn)loadBtn.addEventListener('click',()=>load(form,status));
  const saveBtn=form.parentElement.querySelector('[data-wr-save]');if(saveBtn)saveBtn.addEventListener('click',()=>save(form,status));
  const printBtn=form.parentElement.querySelector('[data-wr-print]');if(printBtn)printBtn.addEventListener('click',()=>window.print());
}

document.addEventListener('DOMContentLoaded',()=>{$$(document,'[data-wr-tool-form]').forEach(initForm)});
})();
