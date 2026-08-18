(function(){
'use strict';
window.WR_PAGES=window.WR_PAGES||{};

window.WR_PAGES.about=`<main>
<div class="breadcrumbs"><a href="#home">Start</a> / Über uns</div><span class="eyebrow">Über WerkRechner</span><h1>Ein digitaler Werkzeugkasten für die kleinen Aufgaben zwischen Baustelle und Büro.</h1><p class="lead">WerkRechner richtet sich an Handwerker, kleine Betriebe, Bauleiter, Monteure sowie Menschen, die Renovierungsprojekte selbst planen.</p>
<section class="content-box"><h2>Warum WerkRechner entstanden ist</h2><p>Viele Aufgaben im Handwerksalltag sind zu klein für eine große Softwarelösung, aber zu wichtig, um sie jedes Mal schnell im Kopf zu überschlagen. Wie viel Material muss bestellt werden? Welcher Stundensatz deckt die echten Kosten? Was gehört in den Tagesbericht? Wie lässt sich ein einfacher Rapport sauber drucken?</p><p>WerkRechner bündelt solche wiederkehrenden Aufgaben in eigenständigen Werkzeugen. Die Kernidee lautet: <strong>wenige Eingaben, nachvollziehbarer Rechenweg, direkt nutzbares Ergebnis.</strong></p></section>
<section class="visual-story"><div class="visual-media"><img alt="Handwerker prüft Kalkulation und Projektunterlagen" height="825" loading="lazy" src="./images/kalkulation.webp" width="1100"/></div><div class="visual-copy"><span class="section-kicker">Kein Ersatz für Fachsoftware</span><h2>Bewusst klein statt künstlich kompliziert.</h2><p>WerkRechner will keine vollständige ERP-, Handwerker- oder Projektmanagementsoftware nachbauen. Ein Tool wird nur dann veröffentlicht, wenn eine konkrete Aufgabe in sich verständlich gelöst werden kann. Das hält die Bedienung schnell und reduziert die Gefahr, dass ein einfaches Problem hinter zehn Menüs verschwindet.</p><p>Wenn eine Berechnung von konkreten Herstellerwerten, Verträgen, Normen oder gesetzlichen Vorgaben abhängt, wird diese Grenze benannt. Die Website soll nützlich sein, ohne eine Scheinsicherheit zu erzeugen.</p></div></section>
<section class="content-box"><h2>Wie Inhalte und Rechner entstehen</h2><p>Die Rechenlogik wird vor der Oberfläche definiert. Einheiten, Formel und Kontrollbeispiele werden geprüft. Danach entstehen Erläuterungen, Beispiele, FAQ und passende Folgewerkzeuge. Bei wichtigen Seiten wird ein sichtbares redaktionelles Prüfdatum angegeben.</p><p>KI kann bei Formulierung, Struktur oder Illustration unterstützen. Sie ersetzt nicht die Kontrollrechnung oder die Entscheidung darüber, ob eine Aussage als allgemeiner Richtwert oder als konkrete Vorgabe veröffentlicht werden darf.</p><p><a class="text-link" href="#methodik">Mehr über Methodik und Qualitätsprozess →</a></p></section>
<section class="content-box"><h2>Finanzierung und Werbung</h2><p>WerkRechner soll perspektivisch über Werbung finanziert werden. Ein Rechner muss auch dann vollständig funktionieren, wenn keine Anzeige geladen wird. Werbung darf nicht wie Navigation, ein Berechnen-Button oder ein Download aussehen und darf Ergebnisse nicht beeinflussen.</p></section>
<section class="content-box"><h2>Transparenz statt erfundener Vertrauenssignale</h2><p>WerkRechner verwendet keine erfundenen Kundenbewertungen, keine fiktiven Nutzerzahlen und keine frei erfundenen Expertenprofile. Vertrauen soll aus funktionierenden Tools, nachvollziehbaren Formeln, klaren Grenzen und offenem Fehlerfeedback entstehen.</p></section>
</main>`;

window.WR_PAGES.contact=`<main>
<div class="breadcrumbs"><a href="#home">Start</a> / Kontakt</div><span class="eyebrow">Kontakt &amp; Feedback</span><h1>Fehler gefunden, Tool-Idee oder Frage?</h1><p class="lead">Nutze das Kontaktformular für Fragen, Feedback oder einen reproduzierbaren Fehler in einem Rechner. Deine Nachricht wird direkt an WerkRechner übermittelt.</p>
<div class="contact-grid"><section class="contact-card"><h2>Nachricht senden</h2><form id="wr-contact-form" autocomplete="on"><div style="display:grid;gap:14px"><label><strong>Name</strong><input name="name" autocomplete="name" required maxlength="100" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit"/></label><label><strong>E-Mail</strong><input name="email" type="email" autocomplete="email" required maxlength="180" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit"/></label><label><strong>Betreff</strong><input name="subject" required maxlength="160" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit"/></label><label><strong>Nachricht</strong><textarea name="message" required maxlength="5000" rows="7" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit;resize:vertical"></textarea></label><input name="_honey" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="btn" type="submit">Nachricht senden</button><p id="wr-contact-status" class="muted" role="status" aria-live="polite"></p></div></form><p class="muted">Mit dem Absenden werden die eingegebenen Daten ausschließlich zur Bearbeitung deiner Anfrage verarbeitet. Weitere Informationen findest du in der <a href="#datenschutz">Datenschutzerklärung</a>.</p></section><section class="contact-card"><h2>Technischen Fehler melden</h2><p>Am schnellsten lässt sich ein Rechner prüfen, wenn du vier Angaben mitsendest:</p><ul class="check-list"><li>Name des Tools</li><li>deine Eingabewerte</li><li>angezeigtes Ergebnis</li><li>warum du ein anderes Ergebnis erwartest</li></ul><p>Für individuelle Rechts-, Steuer-, Sicherheits- oder Fachberatung ist WerkRechner nicht der richtige Ansprechpartner.</p></section></div>
</main>`;

function initContactForm(){
  const form=document.getElementById('wr-contact-form');
  if(!form||form.dataset.ready)return;
  form.dataset.ready='1';
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    const status=document.getElementById('wr-contact-status');
    const btn=form.querySelector('button[type="submit"]');
    if(form.elements._honey && form.elements._honey.value)return;
    if(status)status.textContent='Nachricht wird gesendet …';
    if(btn)btn.disabled=true;
    const data=new FormData(form);
    data.append('_subject','Neue Nachricht über WerkRechner');
    data.append('_template','table');
    data.append('_captcha','false');
    try{
      const res=await fetch('https://formsubmit.co/ajax/timonguldner55@gmail.com',{method:'POST',headers:{'Accept':'application/json'},body:data});
      if(!res.ok)throw new Error('send_failed');
      const json=await res.json().catch(()=>({success:true}));
      if(json.success===false)throw new Error('send_failed');
      form.reset();
      if(status)status.textContent='Danke! Deine Nachricht wurde versendet.';
    }catch(err){
      if(status)status.textContent='Die Nachricht konnte gerade nicht versendet werden. Bitte versuche es später erneut.';
    }finally{if(btn)btn.disabled=false;}
  });
}

function scheduleInit(){setTimeout(initContactForm,0);setTimeout(initContactForm,200);}
document.addEventListener('DOMContentLoaded',scheduleInit);
window.addEventListener('hashchange',scheduleInit);
document.addEventListener('click',function(e){if(e.target.closest('a[href="#contact"]'))setTimeout(initContactForm,100);});
})();
