const fs=require('fs');
const path=require('path');
const assert=require('assert');

const ROOT=path.join(__dirname,'dist');
const ORIGIN='https://www.werkrechner.de';
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const htmlFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name==='index.html')htmlFiles.push(p);}}
walk(ROOT);

function routeFor(file){const rel=path.relative(ROOT,file).replace(/\\/g,'/');return rel==='index.html'?'/':'/'+path.posix.dirname(rel);}
function one(re,s,label,route){const m=[...s.matchAll(re)];assert.strictEqual(m.length,1,`${route}: expected exactly one ${label}, got ${m.length}`);return m[0];}
function textContent(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();}

const titles=new Map(),descs=new Map(),canons=new Set();
for(const file of htmlFiles){
  const route=routeFor(file),html=fs.readFileSync(file,'utf8');
  const title=one(/<title>([^<]+)<\/title>/gi,html,'title',route)[1].trim();
  const desc=one(/<meta name="description" content="([^"]+)"/gi,html,'meta description',route)[1].trim();
  const canon=one(/<link rel="canonical" href="([^"]+)"/gi,html,'canonical',route)[1];
  const expected=ORIGIN+(route==='/'?'':route);
  assert.strictEqual(canon,expected,`${route}: canonical mismatch`);
  assert(!canons.has(canon),`${route}: duplicate canonical ${canon}`);canons.add(canon);
  assert(!titles.has(title),`${route}: duplicate title with ${titles.get(title)}`);titles.set(title,route);
  assert(!descs.has(desc),`${route}: duplicate description with ${descs.get(desc)}`);descs.set(desc,route);
  assert.strictEqual((html.match(/<h1[ >]/gi)||[]).length,1,`${route}: must contain one H1`);
  assert(/<meta name="viewport" content="width=device-width,initial-scale=1">/i.test(html),`${route}: viewport missing`);
  assert(/<main id="content">[\s\S]{300,}<\/main>/i.test(html),`${route}: insufficient initial HTML content`);
  assert(!/href=["']#(?:tool|guide)\//i.test(html),`${route}: hash tool/guide link remains`);
  assert(!/seo-route-bootstrap\.js|seo-production\.js|cookie-consent-v8\.js|app\.js|enhancements\.js/i.test(html),`${route}: legacy SPA runtime referenced`);
  assert(!/pagead2\.googlesyndication\.com|adsbygoogle|google-analytics\.com|googletagmanager\.com/i.test(html),`${route}: ad/tracking runtime must remain disabled during review`);
  assert(!/data-open-consent|wr_consent_/i.test(html),`${route}: legacy consent mechanism remains`);
  assert(textContent(html).length>250,`${route}: page too thin in initial HTML`);
}

assert.strictEqual(htmlFiles.length,45,`expected 45 generated index routes, got ${htmlFiles.length}`);
const toolFiles=htmlFiles.filter(f=>routeFor(f).startsWith('/tools/') && routeFor(f)!=='/tools');
const guideFiles=htmlFiles.filter(f=>routeFor(f).startsWith('/ratgeber/') && routeFor(f)!=='/ratgeber');
assert.strictEqual(toolFiles.length,28,'expected 28 tool pages');
assert.strictEqual(guideFiles.length,8,'expected 8 guide pages');

for(const file of toolFiles){
  const route=routeFor(file),html=fs.readFileSync(file,'utf8');
  for(const required of ['data-wr-tool-form','Praxiswissen','So entsteht das Ergebnis','Formel bzw. Logik','So liest du das Ergebnis richtig','Typische Fehler vermeiden','Praxis-Tipp:','Häufige Fragen','Passende Werkzeuge und Hintergrundwissen','Redaktioneller Hinweis']){
    assert(html.includes(required),`${route}: missing tool section ${required}`);
  }
}
for(const file of guideFiles){
  const route=routeFor(file),html=fs.readFileSync(file,'utf8');
  for(const required of ['class="lead"','Betreiber: Timon Guldner','zuletzt geprüft: 2026-08-27','Konkretes Praxisbeispiel','Typische Fehler vermeiden','Passendes Tool öffnen']){
    assert(html.includes(required),`${route}: missing guide quality element ${required}`);
  }
  assert(/href="\/tools\/[^"]+"/.test(html),`${route}: missing canonical tool link`);
}

// Resolve all internal href/src assets in generated HTML.
function targetExists(url){
  const clean=url.split('#')[0].split('?')[0];
  if(!clean||clean==='/')return fs.existsSync(path.join(ROOT,'index.html'));
  const rel=clean.replace(/^\//,'');
  const direct=path.join(ROOT,rel);
  if(fs.existsSync(direct)&&fs.statSync(direct).isFile())return true;
  return fs.existsSync(path.join(direct,'index.html'));
}
for(const file of htmlFiles){
  const route=routeFor(file),html=fs.readFileSync(file,'utf8');
  const urls=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
  for(const url of urls){
    if(!url.startsWith('/')||url.startsWith('//'))continue;
    assert(targetExists(url),`${route}: broken internal target ${url}`);
  }
}

const sitemap=read('sitemap.xml');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.strictEqual(new Set(locs).size,locs.length,'sitemap contains duplicate URLs');
assert.strictEqual(locs.length,44,'sitemap should contain 44 indexable routes');
for(const file of htmlFiles){
  const route=routeFor(file);if(route==='/datenschutz-einstellungen')continue;
  const url=ORIGIN+(route==='/'?'':route);assert(locs.includes(url),`sitemap missing ${url}`);
}
assert(!locs.some(x=>x.includes('#')),'sitemap contains hash URL');
assert(read('robots.txt').includes(`Sitemap: ${ORIGIN}/sitemap.xml`),'robots sitemap directive missing');
assert(read('ads.txt').trim()==='google.com, pub-3157675368154523, DIRECT, f08c47fec0942fa0','ads.txt mismatch');
assert(fs.existsSync(path.join(ROOT,'404.html')),'404.html missing');
assert(/noindex,follow/.test(read('404.html')),'404 page must be noindex');

const contact=read('kontakt/index.html'),privacy=read('datenschutz/index.html'),settings=read('datenschutz-einstellungen/index.html');
assert(contact.includes('FormSubmit'),'contact page must disclose FormSubmit');
assert(contact.includes('name="_honey"'),'contact honeypot missing');
assert(privacy.includes('FormSubmit'),'privacy must describe FormSubmit');
assert(privacy.includes('kein AdSense-Werbe- oder Tracking-Script geladen'),'privacy AdSense review status missing');
assert(settings.includes('von Google zertifizierte Consent Management Platform'),'certified CMP future state missing');
assert(/meta name="robots" content="noindex,follow"/.test(settings),'privacy settings utility page should be noindex,follow');

console.log(`Final QA PASS: ${htmlFiles.length} routes, ${toolFiles.length} tools, ${guideFiles.length} guides, ${locs.length} sitemap URLs, all internal links resolvable.`);
