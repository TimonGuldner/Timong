const fs=require('fs');
const path=require('path');
const vm=require('vm');

const ROOT=__dirname;
const SRC=path.join(ROOT,'werkrechner-preview');
const OUT=path.join(ROOT,'dist');
const ORIGIN='https://www.werkrechner.de';
const TODAY='2026-08-27';

function read(file){return fs.readFileSync(path.join(SRC,file),'utf8');}
function exists(file){return fs.existsSync(path.join(SRC,file));}
function mkdir(p){fs.mkdirSync(p,{recursive:true});}
function copyDir(src,dst){mkdir(dst);for(const e of fs.readdirSync(src,{withFileTypes:true})){const s=path.join(src,e.name),d=path.join(dst,e.name);if(e.isDirectory())copyDir(s,d);else fs.copyFileSync(s,d);}}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stripTags(v){return String(v||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function metaDescription(v){const s=stripTags(v);return s.length>157?s.slice(0,154).replace(/\s+\S*$/,'')+'…':s;}

function balancedLiteral(text,start){
  const open=text[start],close=open==='{'?'}':open==='['?']':null;
  if(!close)throw new Error('Unsupported literal opener');
  let depth=0,quote=null,esc=false,lineComment=false,blockComment=false;
  for(let i=start;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(lineComment){if(c==='\n')lineComment=false;continue;}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote){quote=null;}continue;}
    if(c==='/'&&n==='/'){lineComment=true;i++;continue;}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c===open)depth++;
    if(c===close){depth--;if(depth===0)return text.slice(start,i+1);}
  }
  throw new Error('Unbalanced literal');
}
function extractLiteral(file,varName,opener){
  const text=read(file);const marker=`const ${varName}=`;const p=text.indexOf(marker);if(p<0)throw new Error(`${varName} missing in ${file}`);const start=text.indexOf(opener,p+marker.length);return balancedLiteral(text,start);
}
function evaluateLiteral(lit){return vm.runInNewContext(`(${lit})`,Object.create(null));}

const TOOLS=evaluateLiteral(extractLiteral('app.js','TOOLS','['));
const DATA=evaluateLiteral(extractLiteral('lowvalue-v3.js','DATA','{'));
const GUIDE=evaluateLiteral(extractLiteral('depth-v4.js','GUIDE','{'));
const TIPS=evaluateLiteral(extractLiteral('individual-tips-v5.js','TIPS','{'));
const INSIGHTS=evaluateLiteral(extractLiteral('enhancements.js','WR_TOOL_INSIGHTS','{'));
const CAT_COPY=evaluateLiteral(extractLiteral('enhancements.js','WR_CAT_COPY','{'));

const ctx={WR_PAGES:{}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['pages-home.js','pages-legal.js','pages-guides-1.js','pages-guides-2.js','pages-guides-3.js']){
  if(!exists(f))continue;
  try{vm.runInContext(`(function(){\n${read(f)}\n})();`,ctx,{filename:f});}catch(err){console.warn(`Could not evaluate ${f}: ${err.message}`);}
}
const LEGACY_PAGES=ctx.WR_PAGES||{};

function cleanLinks(html){
  return String(html||'')
    .replace(/href=(['"])#home\1/g,'href="/"')
    .replace(/href=(['"])#tools\1/g,'href="/tools"')
    .replace(/href=(['"])#guides\1/g,'href="/ratgeber"')
    .replace(/href=(['"])#about\1/g,'href="/ueber-uns"')
    .replace(/href=(['"])#contact\1/g,'href="/kontakt"')
    .replace(/href=(['"])#methodik\1/g,'href="/methodik"')
    .replace(/href=(['"])#impressum\1/g,'href="/impressum"')
    .replace(/href=(['"])#datenschutz\1/g,'href="/datenschutz"')
    .replace(/href=(['"])#privacy-settings\1/g,'href="/datenschutz-einstellungen"')
    .replace(/href=(['"])#tool\/([^'"#]+)\1/g,'href="/tools/$2"')
    .replace(/href=(['"])#guide\/([^'"#]+)\1/g,'href="/ratgeber/$2"')
    .replace(/src=(['"])\.\/images\//g,'src=$1/images/')
    .replace(/href=(['"])\.\/images\//g,'href=$1/images/');
}
function unwrapMain(html){const s=String(html||'').trim();const m=s.match(/^<main(?:\s[^>]*)?>([\s\S]*)<\/main>$/i);return m?m[1]:s;}
function field(id,label,type='number',placeholder=''){const step=type==='number'?' step="any" min="0"':'';return `<div class="field"><label for="${id}">${escapeHtml(label)}</label><input data-wr-field data-label="${escapeHtml(label)}" id="${id}" name="${id}" type="${type}"${step} placeholder="${escapeHtml(placeholder)}" autocomplete="off"></div>`;}
function textarea(id,label,placeholder=''){return `<div class="field" style="grid-column:1/-1"><label for="${id}">${escapeHtml(label)}</label><textarea data-wr-field data-label="${escapeHtml(label)}" id="${id}" name="${id}" placeholder="${escapeHtml(placeholder)}"></textarea></div>`;}
function select(id,label,items){return `<div class="field"><label for="${id}">${escapeHtml(label)}</label><select data-wr-field data-label="${escapeHtml(label)}" id="${id}" name="${id}"><option value="">Bitte auswählen</option>${items.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('')}</select></div>`;}

function calcFields(kind){
  const f=field;
  const map={
    hourly:()=>f('wage','Bruttolohn pro Stunde (€)','number','z. B. 22')+f('factor','Arbeitgeberfaktor','number','z. B. 1,28')+f('productive','Produktive Stunden pro Jahr','number','z. B. 1.350')+f('overhead','Gemeinkosten pro Jahr (€)','number','z. B. 42.000')+f('profit','Gewinnaufschlag (%)','number','z. B. 12'),
    employee:()=>f('gross','Monatsbrutto (€)','number','z. B. 3.500')+f('factor','Arbeitgeberfaktor','number','z. B. 1,25'),
    material:()=>f('buy','Einkaufspreis (€)','number','z. B. 800')+f('waste','Verschnitt / Reserve (%)','number','z. B. 10')+f('markup','Materialaufschlag (%)','number','z. B. 20')+f('vat','MwSt. (%)','number','z. B. 19'),
    markup:()=>f('buy','Einkaufspreis (€)','number','z. B. 100')+f('sell','Verkaufspreis (€)','number','z. B. 140'),
    travel:()=>f('km','Strecke gesamt (km)','number','z. B. 40')+f('cpk','Fahrzeugkosten je km (€)','number','z. B. 0,55')+f('time','Bezahlte Fahrzeit (Stunden)','number','z. B. 1')+f('rate','Satz für Fahrzeit (€)','number','z. B. 55'),
    contribution:()=>f('revenue','Umsatz (€)','number','z. B. 5.000')+f('variable','Variable Kosten (€)','number','z. B. 3.200'),
    quote:()=>f('hours','Arbeitsstunden','number','z. B. 16')+f('rate','Stundensatz (€)','number','z. B. 72')+f('material','Material EK (€)','number','z. B. 900')+f('markup','Materialaufschlag (%)','number','z. B. 20')+f('travel','Anfahrt (€)','number','z. B. 80')+f('vat','MwSt. (%)','number','z. B. 19'),
    project:()=>f('labor','Personal (€)','number','z. B. 3.000')+f('material','Material (€)','number','z. B. 2.500')+f('equipment','Geräte (€)','number','z. B. 400')+f('travel','Fahrt (€)','number','z. B. 150')+f('other','Sonstiges (€)','number','z. B. 250')+f('margin','Zielmarge (%)','number','z. B. 15'),
    measure:()=>f('length','Länge (m)','number','z. B. 5')+f('width','Breite (m)','number','z. B. 3')+f('qty','Anzahl','number','z. B. 1'),
    timesheet:()=>f('start','Beginn','time')+f('end','Ende','time')+f('break','Pause (Minuten)','number','z. B. 30'),
    tiles:()=>f('area','Nettofläche (m²)','number','z. B. 25')+f('tw','Fliesenbreite (cm)','number','z. B. 60')+f('th','Fliesenhöhe (cm)','number','z. B. 60')+f('waste','Reserve / Verschnitt (%)','number','z. B. 10'),
    waste:()=>f('area','Nettofläche (m²)','number','z. B. 25')+f('waste','Reserve / Verschnitt (%)','number','z. B. 10'),
    paint:()=>f('area','Fläche (m²)','number','z. B. 60')+f('coats','Anstriche','number','z. B. 2')+f('coverage','Ergiebigkeit (m²/L)','number','z. B. 8'),
    walls:()=>f('length','Raumlänge (m)','number','z. B. 5')+f('width','Raumbreite (m)','number','z. B. 4')+f('height','Raumhöhe (m)','number','z. B. 2,5')+f('openings','Fenster / Türen (m²)','number','z. B. 5'),
    concrete:()=>f('length','Länge (m)','number','z. B. 5')+f('width','Breite (m)','number','z. B. 3')+f('height','Höhe / Dicke (m)','number','z. B. 0,20')+f('reserve','Reserve (%)','number','z. B. 5'),
    screed:()=>f('area','Fläche (m²)','number','z. B. 40')+f('thickness','Dicke (mm)','number','z. B. 55')+f('density','Dichte (kg/m³)','number','z. B. 2.000'),
    mortar:()=>f('area','Fläche (m²)','number','z. B. 30')+f('thickness','Mittlere Schichtdicke (mm)','number','z. B. 12'),
    grout:()=>f('area','Fläche (m²)','number','z. B. 25')+f('tilel','Fliesenlänge (mm)','number','z. B. 600')+f('tilew','Fliesenbreite (mm)','number','z. B. 600')+f('joint','Fugenbreite (mm)','number','z. B. 3')+f('depth','Fugentiefe (mm)','number','z. B. 8'),
    wallpaper:()=>f('perimeter','Raumumfang (m)','number','z. B. 18')+f('height','Raumhöhe (m)','number','z. B. 2,5')+f('rollw','Rollenbreite (cm)','number','z. B. 53')+f('rolllen','Rollenlänge (m)','number','z. B. 10,05')+f('extra','Zugabe je Bahn (cm)','number','z. B. 10'),
    roofarea:()=>f('footprint','Horizontale Grundfläche (m²)','number','z. B. 100')+f('pitch','Dachneigung (°)','number','z. B. 35'),
    roofpitch:()=>f('rise','Höhenunterschied (m)','number','z. B. 3')+f('run','Horizontale Strecke (m)','number','z. B. 5'),
    decking:()=>f('area','Terrassenfläche (m²)','number','z. B. 25')+f('boardw','Dielenbreite (mm)','number','z. B. 145')+f('gap','Fugenbreite (mm)','number','z. B. 5')+f('waste','Reserve (%)','number','z. B. 8')
  };
  return map[kind]?map[kind]():'';
}
function docFields(slug){
  const sets={
    'abnahmeprotokoll-generator':()=>field('project','Projekt / Baustelle','text','z. B. Umbau Büro 2. OG')+field('date','Datum','date')+field('participants','Beteiligte','text','Auftraggeber, Bauleitung, Auftragnehmer')+textarea('scope','Geprüfter Leistungsumfang','Welche Leistungen oder Bereiche wurden gemeinsam angesehen?')+select('status','Abnahmestatus',['abgenommen','abgenommen mit Vorbehalten','nicht abgenommen'])+textarea('defects','Festgestellte Mängel','Ort und Mangel möglichst konkret beschreiben')+textarea('remaining','Restarbeiten','Welche Leistungen fehlen noch?')+textarea('reservations','Vorbehalte / Bemerkungen','Nur tatsächlich erklärte Vorbehalte dokumentieren'),
    'baustellenbericht-generator':()=>field('project','Projekt / Baustelle','text','z. B. Sanierung Musterstraße')+field('date','Datum','date')+field('area','Bereich / Bauabschnitt','text','z. B. EG, Achse A–D')+field('personnel','Personal / Gewerke','text','Wer war vor Ort?')+textarea('progress','Baufortschritt','Was ist seit dem letzten Bericht weitergegangen?')+textarea('works','Ausgeführte Arbeiten','Konkrete Tätigkeiten und Bereiche')+textarea('coordination','Abstimmungen','Welche Absprachen waren wichtig?')+textarea('issues','Probleme / offene Punkte','Was blockiert oder braucht Entscheidung?')+textarea('next','Nächste Schritte','Was steht als Nächstes an?'),
    'bautagesbericht-generator':()=>field('project','Projekt / Baustelle','text','z. B. Neubau Halle Süd')+field('date','Datum','date')+field('weather','Wetter','text','z. B. trocken, bewölkt')+field('temperature','Temperatur','text','z. B. 12–18 °C')+field('personnel','Personal','text','Anzahl / Teams')+field('trades','Gewerke vor Ort','text','z. B. Rohbau, Elektro')+textarea('works','Ausgeführte Arbeiten','Was wurde wo ausgeführt?')+textarea('deliveries','Lieferungen / Geräte','Wichtige Anlieferungen oder Geräteeinsatz')+textarea('obstructions','Behinderungen / Stillstand','Konkrete beobachtete Umstände')+textarea('events','Besondere Vorkommnisse','Besprechungen, Prüfungen, Abweichungen'),
    'maengelprotokoll-generator':()=>field('project','Projekt / Baustelle','text','z. B. Wohnung 3.2')+field('date','Festgestellt am','date')+field('location','Ort / Bauteil','text','z. B. Bad, Türzarge rechts')+textarea('defect','Mangelbeschreibung','Was genau ist sichtbar oder funktioniert nicht?')+select('priority','Priorität',['niedrig','normal','hoch','dringend'])+field('responsible','Zuständig','text','Firma / Gewerk')+field('due','Frist','date')+select('status','Status',['offen','in Bearbeitung','zur Prüfung','erledigt']),
    'rapportzettel-generator':()=>field('customer','Kunde','text','Name / Firma')+field('project','Baustelle / Auftrag','text','Projektbezeichnung')+field('date','Datum','date')+field('employee','Mitarbeiter','text','Name oder Team')+field('start','Beginn','time')+field('end','Ende','time')+field('hours','Abrechenbare Stunden','number','z. B. 6,5')+textarea('work','Ausgeführte Leistungen','Ort, Tätigkeit und Umfang möglichst konkret')+textarea('material','Material / Geräte','Mengen und Bezeichnungen')+textarea('note','Bemerkungen','Zusatzauftrag, Wartezeit, Besonderheiten'),
    'regiebericht-generator':()=>field('customer','Auftraggeber','text','Name / Firma')+field('project','Baustelle / Auftrag','text','Projektbezeichnung')+field('date','Datum','date')+textarea('reason','Grund der Regiearbeit','Warum wurde die Leistung außerhalb des geplanten Umfangs ausgeführt?')+field('employees','Mitarbeiter','text','Namen / Anzahl')+field('hours','Gesamtstunden','number','z. B. 5,5')+textarea('equipment','Geräte','Gerät und Einsatzdauer')+textarea('material','Material','Menge und Bezeichnung')+textarea('work','Ausgeführte Regiearbeiten','Ort, Tätigkeit, Umfang')+textarea('note','Hinweise / Abstimmung','Wer hat was wann abgestimmt?')
  };
  return sets[slug]?sets[slug]():textarea('description','Beschreibung / Leistungen','Sachverhalt möglichst konkret dokumentieren.');
}

const GUIDE_FOR_TOOL={
  'stundenverrechnungssatz-rechner':'stundenverrechnungssatz-handwerk','materialaufschlag-rechner':'materialaufschlag-handwerk','materialkosten-rechner':'materialkosten-angebot','fliesenrechner':'fliesenbedarf-verschnitt','fliesen-verschnitt-rechner':'fliesenbedarf-verschnitt','betonrechner':'betonmenge-berechnen','bautagesbericht-generator':'bautagesbericht-inhalt','rapportzettel-generator':'rapportzettel-richtig-ausfuellen'
};
function titleForTool(t){const base=t.title.replace(/-Rechner|-Generator/g,'');if(t.slug==='betonrechner')return 'Betonrechner: Betonmenge in m³ berechnen | WerkRechner';if(t.slug==='fliesenrechner')return 'Fliesenrechner: Fliesenbedarf & Verschnitt berechnen | WerkRechner';if(t.slug==='stundenverrechnungssatz-rechner')return 'Stundenverrechnungssatz im Handwerk berechnen | WerkRechner';return `${base} online nutzen | WerkRechner`;}
function toolBody(t){
  const d=DATA[t.slug]||{};const g=GUIDE[t.kind]||GUIDE.doc||{};const tip=TIPS[t.slug]||'';const insight=INSIGHTS[t.slug]||t.desc;const cat=CAT_COPY[t.cat]||[];const fields=t.kind==='doc'?docFields(t.slug):calcFields(t.kind);const related=TOOLS.filter(x=>x.slug!==t.slug&&x.cat===t.cat).slice(0,4);const guide=GUIDE_FOR_TOOL[t.slug];
  return `<div class="breadcrumbs"><a href="/tools">Tools</a> / ${escapeHtml(t.title)}</div>
<span class="pill">${escapeHtml(t.cat)}</span>
<div class="tool-header"><h1>${escapeHtml(t.title)}</h1><p class="lead">${escapeHtml(t.desc)}</p><p class="tool-value-intro">${escapeHtml(insight)}</p></div>
<section class="tool-box"><h2>Jetzt ${t.kind==='doc'?'erstellen':'berechnen'}</h2><form data-wr-tool-form data-tool-kind="${escapeHtml(t.kind)}" data-tool-slug="${escapeHtml(t.slug)}"><div class="form-grid">${fields}</div><div class="btn-row"><button class="btn" type="submit">${t.kind==='doc'?'Vorschau erstellen':'Berechnen'}</button><button class="btn secondary" type="button" data-wr-print>Drucken / PDF</button>${t.kind!=='doc'?'<button class="btn secondary" type="button" data-wr-load>Gespeicherte Werte laden</button><button class="btn secondary" type="button" data-wr-save>Werte auf diesem Gerät speichern</button>':''}</div><p class="muted" data-wr-storage-status aria-live="polite"></p></form><div class="result-card" data-wr-result hidden></div></section>
<section class="section"><div class="content-box"><span class="section-kicker">Praxiswissen</span><h2>${escapeHtml(d.h||`So nutzt du ${t.title} sinnvoll`)}</h2><p>${escapeHtml(d.f||cat[0]||'Prüfe Eingaben und Einheiten sorgfältig und gleiche das Ergebnis mit den Bedingungen deines Projekts ab.')}</p>${d.e?`<h3>Konkretes Beispiel</h3><p>${escapeHtml(d.e)}</p>`:''}${Array.isArray(d.c)&&d.c.length?`<h3>Praxis-Checkliste</h3><ul class="check-list">${d.c.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:''}</div></section>
<section class="section"><div class="content-box"><span class="section-kicker">Rechenweg & Einordnung</span><h2>So entsteht das Ergebnis</h2><h3>Formel bzw. Logik</h3><p>${escapeHtml(g.formula||'Die Ausgabe wird aus den von dir eingegebenen Werten nach der beschriebenen Werkzeuglogik erzeugt.')}</p><h3>So liest du das Ergebnis richtig</h3><p>${escapeHtml(g.read||'Nutze das Ergebnis als nachvollziehbare Ausgangsbasis und prüfe projektspezifische Vorgaben separat.')}</p>${Array.isArray(g.errors)?`<h3>Typische Fehler vermeiden</h3><ul>${g.errors.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:''}${tip?`<p class="muted"><strong>Praxis-Tipp:</strong> ${escapeHtml(tip)}</p>`:''}<h3>Was das Tool bewusst nicht entscheidet</h3><p>${escapeHtml(cat[1]||'Herstellerangaben, Verträge, Normen und individuelle Fachvorgaben haben Vorrang, wenn sie für dein Projekt relevant sind.')}</p></div></section>
${Array.isArray(d.q)&&d.q.length?`<section class="section faq"><h2>Häufige Fragen zu ${escapeHtml(t.title)}</h2>${d.q.map(([q,a])=>`<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}<details><summary>Ist das Werkzeug kostenlos nutzbar?</summary><p>Ja. Die Kernfunktion ist ohne Benutzerkonto direkt im Browser nutzbar.</p></details></section>`:''}
<section class="section"><div class="section-head"><div><span class="section-kicker">Nächste Schritte</span><h2>Passende Werkzeuge und Hintergrundwissen</h2></div></div><div class="grid">${related.map(x=>`<a class="card" href="/tools/${x.slug}"><h3>${escapeHtml(x.title)}</h3><p class="muted">${escapeHtml(x.desc)}</p><strong>Weiterarbeiten →</strong></a>`).join('')}</div>${guide?`<p style="margin-top:18px"><a class="btn secondary" href="/ratgeber/${guide}">Passenden Ratgeber lesen</a></p>`:''}</section>
<section class="content-box"><h2>Redaktioneller Hinweis</h2><p>WerkRechner stellt Rechen- und Dokumentationshilfen bereit. Der Rechenweg und die Grenzen des Werkzeugs werden offen beschrieben. Herstellerdaten, Verträge, Normen, Steuer- oder Rechtsvorgaben können im konkreten Fall zusätzliche Anforderungen stellen.</p><p class="muted">Inhalt zuletzt geprüft: ${TODAY}</p></section>`;
}

function toolsDirectory(){return `<div class="breadcrumbs"><a href="/">Start</a> / Tools</div><span class="eyebrow">28 kostenlose Werkzeuge</span><h1>Rechner und Dokumentgeneratoren für Handwerk, Baustelle und Renovierung</h1><p class="lead">Wähle die konkrete Aufgabe. Jeder Rechner erklärt nicht nur das Ergebnis, sondern auch Formel, Annahmen, typische Fehler und sinnvolle nächste Schritte.</p><div class="grid">${TOOLS.map(t=>`<a class="card" href="/tools/${t.slug}"><span class="pill">${escapeHtml(t.cat)}</span><h2>${escapeHtml(t.title)}</h2><p class="muted">${escapeHtml(t.desc)}</p><strong>Werkzeug öffnen →</strong></a>`).join('')}</div>`;}

function contactBody(){return `<div class="breadcrumbs"><a href="/">Start</a> / Kontakt</div><span class="eyebrow">Kontakt & Feedback</span><h1>Fehler gefunden, Tool-Idee oder Frage?</h1><p class="lead">Bei reproduzierbaren Fehlern helfen Tool-Name, Eingabewerte, angezeigtes Ergebnis und das erwartete Ergebnis.</p><div class="contact-grid"><section class="contact-card"><h2>Nachricht senden</h2><form id="wr-contact-form" autocomplete="on"><div class="form-grid"><div class="field"><label for="contact-name">Name</label><input id="contact-name" name="name" autocomplete="name" maxlength="100" required></div><div class="field"><label for="contact-email">E-Mail</label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="180" required></div><div class="field" style="grid-column:1/-1"><label for="contact-subject">Betreff</label><input id="contact-subject" name="subject" maxlength="160" required></div><div class="field" style="grid-column:1/-1"><label for="contact-message">Nachricht</label><textarea id="contact-message" name="message" rows="7" maxlength="5000" required></textarea></div><input name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><div><button class="btn" type="submit">Nachricht senden</button></div></div><p id="wr-contact-status" class="muted" role="status" aria-live="polite"></p></form><p class="muted">Die Formularübermittlung erfolgt über FormSubmit. Details zur Verarbeitung stehen in der <a href="/datenschutz">Datenschutzerklärung</a>.</p></section><section class="contact-card"><h2>Direkter Kontakt</h2><p><strong>Timon Guldner</strong><br>Flughafenstraße 51<br>53842 Troisdorf<br>Deutschland</p><p><a href="mailto:timonguldner55@gmail.com">timonguldner55@gmail.com</a></p><h3>Technischen Fehler melden</h3><ul class="check-list"><li>Name des Tools</li><li>Eingabewerte</li><li>angezeigtes Ergebnis</li><li>erwartetes Ergebnis und Begründung</li></ul></section></div>`;}
function privacyBody(){return `<div class="legal-main"><div class="breadcrumbs"><a href="/">Start</a> / Datenschutz</div><span class="eyebrow">Datenschutz</span><h1>Datenschutzerklärung</h1><div class="legal-meta"><span>Stand: ${TODAY}</span></div><section class="content-box"><h2>1. Verantwortlicher</h2><p><strong>Timon Guldner</strong><br>Flughafenstraße 51, 53842 Troisdorf<br>Deutschland<br>E-Mail: <a href="mailto:timonguldner55@gmail.com">timonguldner55@gmail.com</a></p></section><section class="content-box"><h2>2. Hosting</h2><p>WerkRechner wird über Vercel bereitgestellt. Beim Abruf können technisch erforderliche Verbindungs- und Serverprotokolldaten verarbeitet werden, um die Website auszuliefern, Fehler zu erkennen und die Sicherheit zu gewährleisten.</p></section><section class="content-box"><h2>3. Nutzung der Rechner</h2><p>Die Berechnungen werden im Browser ausgeführt. Für die Kernfunktionen ist kein Benutzerkonto erforderlich. Wenn du bei einem Rechner ausdrücklich „Werte auf diesem Gerät speichern“ auswählst, werden diese Eingaben ausschließlich im lokalen Speicher deines Browsers abgelegt.</p></section><section class="content-box"><h2>4. Kontaktformular / FormSubmit</h2><p>Das Kontaktformular übermittelt die von dir eingegebenen Daten über den Dienst FormSubmit an die angegebene WerkRechner-E-Mail-Adresse. Übermittle nur Angaben, die für die Bearbeitung deiner Anfrage erforderlich sind. Alternativ kannst du direkt per E-Mail Kontakt aufnehmen.</p></section><section class="content-box"><h2>5. Google AdSense – aktueller Prüfstatus</h2><p>WerkRechner enthält die AdSense-Publisher-Kennung zur Website-Verifizierung und eine öffentlich erreichbare ads.txt. Während dieses Prüf-Builds wird über die Website selbst kein AdSense-Werbe- oder Tracking-Script geladen. Vor einer späteren regulären Anzeigenaktivierung in Regionen, in denen Google eine zertifizierte Consent Management Platform verlangt, wird eine von Google zertifizierte CMP beziehungsweise Google Consent Management eingesetzt und diese Datenschutzerklärung an die tatsächliche Verarbeitung angepasst.</p></section><section class="content-box"><h2>6. Lokale Einstellungen</h2><p>Explizit gespeicherte Rechnerwerte werden lokal im Browser gespeichert und nicht von WerkRechner in eine eigene Nutzerdatenbank übertragen. Sie können über die <a href="/datenschutz-einstellungen">Datenschutz-Einstellungen</a> gelöscht werden.</p></section><section class="content-box"><h2>7. Betroffenenrechte</h2><p>Nach Maßgabe der anwendbaren Datenschutzvorschriften können insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch bestehen. Außerdem besteht grundsätzlich ein Beschwerderecht bei einer zuständigen Datenschutzaufsichtsbehörde.</p></section><section class="content-box"><h2>8. Änderungen</h2><p>Diese Erklärung wird angepasst, wenn sich eingesetzte Dienste oder die tatsächliche Datenverarbeitung ändern.</p></section></div>`;}
function privacySettingsBody(){return `<div class="legal-main"><div class="breadcrumbs"><a href="/">Start</a> / Datenschutz-Einstellungen</div><span class="eyebrow">Privatsphäre</span><h1>Datenschutz- & lokale Einstellungen</h1><p class="lead">Im aktuellen AdSense-Prüf-Build lädt WerkRechner keine AdSense-Werbe- oder Tracking-Scripte. Deshalb wird kein eigener Werbe-Cookie-Banner als Ersatz für eine zertifizierte CMP eingesetzt.</p><section class="content-box"><h2>Lokale WerkRechner-Einstellungen</h2><p>Wenn du Rechnerwerte ausdrücklich auf deinem Gerät gespeichert hast, kannst du sie hier gesammelt entfernen.</p><button class="btn secondary" type="button" data-clear-wr-settings>Lokale Einstellungen löschen</button><p class="muted" data-clear-wr-status aria-live="polite"></p></section><section class="content-box"><h2>Spätere Werbeeinwilligung</h2><p>Vor einer zukünftigen AdSense-Aktivierung im EWR, Vereinigten Königreich oder der Schweiz wird eine von Google zertifizierte Consent Management Platform beziehungsweise Google Consent Management eingerichtet. Die Auswahl soll anschließend über eine klar erreichbare Einstellmöglichkeit erneut geändert werden können.</p></section></div>`;}

function shell({route,title,description,body,robots='index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',type='website',jsonLd=''}){
  const canonical=ORIGIN+(route==='/'?'':route);
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${escapeHtml(robots)}"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(metaDescription(description))}"><link rel="canonical" href="${canonical}"><meta name="google-adsense-account" content="ca-pub-3157675368154523"><meta property="og:type" content="${escapeHtml(type)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(metaDescription(description))}"><meta property="og:url" content="${canonical}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/preview-extra.css"><link rel="stylesheet" href="/ux.css"><link rel="stylesheet" href="/quality-v2.css"><link rel="stylesheet" href="/lowvalue-v3.css"><link rel="stylesheet" href="/desktop-v6.css">${jsonLd?`<script type="application/ld+json">${jsonLd}</script>`:''}</head><body data-static-page="1"><header class="site-header"><a class="brand" href="/">Werk<span>Rechner</span></a><nav id="main-nav" class="main-nav"><a href="/tools">Tools</a><a href="/ratgeber">Ratgeber</a><a href="/ueber-uns">Über uns</a><a href="/kontakt">Kontakt</a><a href="/methodik">Methodik</a></nav><button type="button" aria-controls="main-nav" aria-expanded="false" aria-label="Menü öffnen" class="menu-btn">☰</button></header><main id="content">${cleanLinks(unwrapMain(body))}</main><footer class="site-footer"><div class="footer-grid"><div class="footer-brand"><a class="brand" href="/">Werk<span>Rechner</span></a><p>Kostenlose Rechner und Dokumentgeneratoren für Handwerk, Baustelle und Renovierung – direkt im Browser und ohne Anmeldung.</p><a class="footer-cta" href="/tools">Alle 28 Tools ansehen →</a></div><div class="footer-col"><h3>WerkRechner</h3><a href="/tools">Alle Tools</a><a href="/ratgeber">Ratgeber</a><a href="/methodik">Methodik & Qualität</a></div><div class="footer-col"><h3>Über uns</h3><a href="/ueber-uns">Über WerkRechner</a><a href="/kontakt">Kontakt</a></div><div class="footer-col"><h3>Rechtliches</h3><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/datenschutz-einstellungen">Datenschutz-Einstellungen</a></div></div><div class="footer-bottom"><span>© 2026 WerkRechner</span><button class="wr-consent-link" type="button" data-wr-share>Seite teilen</button></div></footer><script defer src="/site-runtime.js"></script><script defer src="/calculator-runtime.js"></script></body></html>`;
}

function articleEnhance(html){let out=cleanLinks(unwrapMain(html));if(!/Betreiber:\s*Timon Guldner/i.test(out)){out=out.replace(/(<p class="lead">[\s\S]*?<\/p>)/i,`$1<div class="guide-meta"><span>Praxisratgeber</span><span>Betreiber: Timon Guldner</span><span>zuletzt geprüft: ${TODAY}</span></div>`);}return out;}
function homeBody(){return LEGACY_PAGES.home||`<h1>WerkRechner – kostenlose Rechner für Handwerk & Baustelle</h1><p class="lead">28 Rechner und Dokumentgeneratoren ohne Anmeldung direkt im Browser.</p>${toolsDirectory()}`;}
function guidesDirectory(){return LEGACY_PAGES.guides||`<h1>Ratgeber für Handwerk und Baustelle</h1><p class="lead">Rechenwege, Praxisbeispiele und typische Fehler hinter den WerkRechner-Tools.</p>`;}
function aboutBody(){return LEGACY_PAGES.about||`<h1>Über WerkRechner</h1><p class="lead">WerkRechner bündelt kleine Rechen- und Dokumentationsaufgaben für Handwerk, Baustelle und Renovierung.</p>`;}
function methodikBody(){return LEGACY_PAGES.methodik||`<h1>Methodik & Qualität</h1><p class="lead">Rechenwege, Annahmen und Grenzen werden transparent beschrieben und anhand nachvollziehbarer Kontrollbeispiele geprüft.</p>`;}
function impressumBody(){return LEGACY_PAGES.impressum||`<div class="legal-main"><h1>Impressum</h1><p><strong>Timon Guldner</strong><br>Flughafenstraße 51, 53842 Troisdorf<br>Deutschland<br>E-Mail: <a href="mailto:timonguldner55@gmail.com">timonguldner55@gmail.com</a></p></div>`;}

function writeRoute(route,html){let dir=route==='/'?OUT:path.join(OUT,route.replace(/^\//,''));mkdir(dir);fs.writeFileSync(path.join(dir,'index.html'),html);}
function articleJsonLd(route,title,description){return JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:title,description:metaDescription(description),dateModified:TODAY,mainEntityOfPage:ORIGIN+route,author:{'@type':'Person',name:'Timon Guldner'},publisher:{'@type':'Organization',name:'WerkRechner'}}).replace(/</g,'\\u003c');}

fs.rmSync(OUT,{recursive:true,force:true});mkdir(OUT);
for(const css of ['styles.css','preview-extra.css','ux.css','quality-v2.css','lowvalue-v3.css','desktop-v6.css'])if(exists(css))fs.copyFileSync(path.join(SRC,css),path.join(OUT,css));
for(const js of ['site-runtime.js','calculator-runtime.js'])fs.copyFileSync(path.join(SRC,js),path.join(OUT,js));
if(fs.existsSync(path.join(SRC,'images')))copyDir(path.join(SRC,'images'),path.join(OUT,'images'));

const routes=[];
function emit(route,title,description,body,opts={}){const html=shell({route,title,description,body,...opts});writeRoute(route,html);routes.push({route,title,html,index:!(opts.robots||'').startsWith('noindex')});}

emit('/','WerkRechner – kostenlose Rechner für Handwerk & Baustelle','28 kostenlose Rechner und Dokumentgeneratoren für Handwerk, Baustelle, Kalkulation, Material und Renovierung – ohne Anmeldung direkt im Browser.',homeBody());
emit('/tools','28 kostenlose Handwerker-Rechner & Generatoren | WerkRechner','Kostenlose Rechner und Dokumentgeneratoren für Kalkulation, Baustelle, Material, Dokumentation und Renovierung.',toolsDirectory());
for(const t of TOOLS)emit(`/tools/${t.slug}`,titleForTool(t),`${t.desc} Mit Rechenweg, Praxisbeispiel, typischen Fehlern und Hinweisen zur richtigen Einordnung.`,toolBody(t));
emit('/ratgeber','Ratgeber für Handwerk, Kalkulation & Baustelle | WerkRechner','Praxisratgeber zu Stundensatz, Material, Fliesen, Beton, Bautagesbericht und weiteren Rechenwegen im Handwerk.',guidesDirectory());
const guideKeys=Object.keys(LEGACY_PAGES).filter(k=>k.startsWith('guide/')).sort();
for(const key of guideKeys){const slug=key.slice(6),raw=articleEnhance(LEGACY_PAGES[key]),h1=(raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||slug,lead=(raw.match(/<p class="lead">([\s\S]*?)<\/p>/i)||[])[1]||raw;const title=`${stripTags(h1)} | WerkRechner`;const desc=metaDescription(lead);emit(`/ratgeber/${slug}`,title,desc,raw,{type:'article',jsonLd:articleJsonLd(`/ratgeber/${slug}`,stripTags(h1),desc)});}
emit('/methodik','Methodik & Qualität der WerkRechner-Tools | WerkRechner','So entstehen und prüfen wir Rechenwege, Annahmen, Beispiele, Praxisgrenzen und redaktionelle Inhalte bei WerkRechner.',methodikBody());
emit('/ueber-uns','Über WerkRechner | Rechner für Handwerk & Baustelle','Warum WerkRechner entstanden ist, wie Rechner und Inhalte geprüft werden und welche Grenzen die kostenlosen Werkzeuge bewusst haben.',aboutBody());
emit('/kontakt','Kontakt & Fehler melden | WerkRechner','Kontaktiere WerkRechner, melde reproduzierbare Rechenfehler oder schlage ein neues Werkzeug für Handwerk und Baustelle vor.',contactBody());
emit('/impressum','Impressum | WerkRechner','Anbieterkennzeichnung und verantwortlicher Betreiber von WerkRechner.',impressumBody());
emit('/datenschutz','Datenschutzerklärung | WerkRechner','Informationen zur Datenverarbeitung bei Hosting, Rechnern, lokal gespeicherten Werten, Kontaktformular und dem aktuellen AdSense-Prüfstatus.',privacyBody());
emit('/datenschutz-einstellungen','Datenschutz-Einstellungen | WerkRechner','Lokale WerkRechner-Einstellungen verwalten und Informationen zum aktuellen Werbe- und Consent-Status ansehen.',privacySettingsBody(),{robots:'noindex,follow'});

const sitemapRoutes=routes.filter(r=>r.index&&r.route!=='/datenschutz-einstellungen').map(r=>r.route);
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map(route=>`  <url><loc>${ORIGIN}${route==='/'?'':route}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(OUT,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
const adsSource=fs.existsSync(path.join(ROOT,'ads.txt'))?fs.readFileSync(path.join(ROOT,'ads.txt'),'utf8'):(exists('ads.txt')?read('ads.txt'):'google.com, pub-3157675368154523, DIRECT, f08c47fec0942fa0\n');
fs.writeFileSync(path.join(OUT,'ads.txt'),adsSource.trim()+'\n');
fs.writeFileSync(path.join(OUT,'404.html'),`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Seite nicht gefunden | WerkRechner</title><link rel="stylesheet" href="/styles.css"></head><body><main style="max-width:760px;margin:80px auto;padding:24px"><h1>Seite nicht gefunden</h1><p>Die angeforderte Seite existiert nicht.</p><p><a class="btn" href="/tools">Zu den Werkzeugen</a></p></main></body></html>`);

const errors=[];
if(TOOLS.length!==28)errors.push(`Expected 28 tools, found ${TOOLS.length}`);
if(guideKeys.length<8)errors.push(`Expected at least 8 guides, found ${guideKeys.length}`);
for(const r of routes){
  const html=r.html;
  const canon=(html.match(/<link rel="canonical"/g)||[]).length;
  const h1=(html.match(/<h1[ >]/gi)||[]).length;
  if(canon!==1)errors.push(`${r.route}: canonical count ${canon}`);
  if(h1<1)errors.push(`${r.route}: missing H1`);
  if(!/<title>[^<]+<\/title>/i.test(html))errors.push(`${r.route}: missing title`);
  if(!/<meta name="description" content="[^"]+"/i.test(html))errors.push(`${r.route}: missing description`);
  if(/href=["']#(?:tool|guide)\//i.test(html))errors.push(`${r.route}: hash tool/guide link remains`);
  if(/seo-production\.js|seo-route-bootstrap\.js|cookie-consent-v8\.js|app\.js/.test(html))errors.push(`${r.route}: legacy SPA/SEO/consent runtime referenced`);
  if(!/<main id="content">[\s\S]{300,}<\/main>/i.test(html))errors.push(`${r.route}: insufficient initial HTML body`);
}
if(!sitemap.includes('/tools/betonrechner')||!sitemap.includes('/ratgeber'))errors.push('Sitemap missing required canonical routes');
if(!fs.readFileSync(path.join(OUT,'robots.txt'),'utf8').includes('/sitemap.xml'))errors.push('robots.txt missing sitemap');
if(!fs.readFileSync(path.join(OUT,'ads.txt'),'utf8').includes('pub-3157675368154523'))errors.push('ads.txt publisher id mismatch');
if(errors.length){console.error('\nSTATIC QA FAILED\n'+errors.map(e=>' - '+e).join('\n'));process.exit(1);}
console.log(`Static build complete: ${routes.length} HTML routes (${TOOLS.length} tools, ${guideKeys.length} guides).`);
console.log('QA PASS: unique canonical, title, description, H1, crawlable links, initial HTML content, sitemap, robots.txt, ads.txt.');
