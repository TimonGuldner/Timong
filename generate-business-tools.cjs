const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map(x => { const [k, ...r] = x.replace(/^--/, '').split('='); return [k, r.join('=') || true]; }));
const TARGET = path.resolve(__dirname, String(args.target || 'dist'));
const BASE = String(args.base || 'https://www.werkrechner.de/business-tools').replace(/\/$/, '');
const ORGANIC = 'https://lzqybaxpgwkqyysluivg.supabase.co/functions/v1/hh-organic';
const VALIDATION = 'https://lzqybaxpgwkqyysluivg.supabase.co/functions/v1/hh-validation-site';
const INDEX_KEY = '14dd4411f35e5cc8dd31450cddcb122a';
const organicSlugs = [
  'ausschreibungen-maler-nrw','oeffentliche-ausschreibungen-bau-nrw','ausschreibungen-elektriker-nrw','ausschreibungen-dachdecker-nrw','ausschreibungen-handwerk-nrw','ausschreibung-go-no-go-check',
  'xrechnung-oder-zugferd','pdf-keine-e-rechnung','e-rechnung-pflicht-2028','e-rechnung-empfangen','e-rechnung-handwerk','e-rechnung-pflicht-2027',
  'foerdermittel-kmu-deutschland','foerdermittel-vor-projektstart','foerdermittel-digitalisierung-nrw','foerderung-ki-kmu-nrw','mid-digitale-prozesse-nrw','nrw-bank-impuls-ki'
];
const toolSlugs = ['e-rechnung-readiness','grantradar-de','tenderradar-handwerk'];

function mkdir(p){ fs.mkdirSync(p,{recursive:true}); }
function writeRoute(slug, html){ const dir = slug ? path.join(TARGET,'business-tools',slug) : path.join(TARGET,'business-tools'); mkdir(dir); fs.writeFileSync(path.join(dir,'index.html'),html); }
async function get(url){ const r=await fetch(url,{headers:{'user-agent':'WerkRechner-BusinessTools-Build/1.0'}}); if(!r.ok) throw new Error(`${r.status} ${url}`); return r.text(); }
function transform(html, canonical){
  let s=String(html);
  s=s.split(ORGANIC).join(BASE).split(VALIDATION).join(BASE);
  s=s.split(`${BASE}/datenschutz/`).join('https://www.werkrechner.de/datenschutz');
  s=s.split(`${BASE}/impressum/`).join('https://www.werkrechner.de/impressum');
  s=s.replace(/<meta name="robots"[^>]*>/i,'<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">');
  if(/<link rel="canonical" href="[^"]+"/i.test(s)) s=s.replace(/<link rel="canonical" href="[^"]+"/i,`<link rel="canonical" href="${canonical}"`);
  else s=s.replace('</head>',`<link rel="canonical" href="${canonical}"></head>`);
  s=s.replace('<main class="wrap">','<main id="content" class="wrap">');
  return s;
}
async function main(){
  mkdir(path.join(TARGET,'business-tools'));
  writeRoute('', transform(await get(`${ORGANIC}/`), BASE));
  for(const slug of organicSlugs) writeRoute(slug, transform(await get(`${ORGANIC}/${slug}/`), `${BASE}/${slug}`));
  for(const slug of toolSlugs) writeRoute(slug, transform(await get(`${VALIDATION}/${slug}/`), `${BASE}/${slug}`));
  fs.writeFileSync(path.join(TARGET,'business-tools',`${INDEX_KEY}.txt`),INDEX_KEY+'\n');
  const urls=['',...toolSlugs,...organicSlugs].map(slug=>`${BASE}${slug?'/'+slug:''}`);
  const sm=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc><lastmod>2026-09-15</lastmod></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(TARGET,'business-tools','sitemap.xml'),sm);
  const rootSitemap=path.join(TARGET,'sitemap.xml');
  if(fs.existsSync(rootSitemap) && BASE.startsWith('https://www.werkrechner.de')){
    let root=fs.readFileSync(rootSitemap,'utf8');
    const additions=urls.filter(u=>!root.includes(`<loc>${u}</loc>`)).map(u=>`  <url><loc>${u}</loc><lastmod>2026-09-15</lastmod></url>`).join('\n');
    if(additions) root=root.replace('</urlset>',`${additions}\n</urlset>`);
    fs.writeFileSync(rootSitemap,root);
  }
  for(const slug of [...organicSlugs,...toolSlugs]){ const f=path.join(TARGET,'business-tools',slug,'index.html'); const h=fs.readFileSync(f,'utf8'); if(!/<title>[^<]+<\/title>/i.test(h)||!/<h1[^>]*>/i.test(h)||!/<link rel="canonical" href="[^"]+"/i.test(h)) throw new Error(`QA failed: ${slug}`); }
  console.log(`Business Tools build complete: ${1+organicSlugs.length+toolSlugs.length} routes at ${BASE}`);
}
main().catch(e=>{console.error(e);process.exit(1)});
