window.WR_PAGES=window.WR_PAGES||{};
(function(){
'use strict';
const enrich={
  'stundenverrechnungssatz-handwerk':{
    tool:'stundenverrechnungssatz-rechner',
    example:'22 € Bruttostundenlohn × 1,28 Arbeitgeberfaktor × 1.350 produktive Stunden plus 42.000 € Gemeinkosten ergeben 80.016 € Jahreskosten. Geteilt durch 1.350 produktive Stunden sind das rund 59,27 € Kostensatz. Mit 12 % Gewinnaufschlag ergibt sich rechnerisch ein Verrechnungssatz von rund 66,38 € je Stunde.',
    errors:['bezahlte Anwesenheitszeit mit produktiver Kundenzeit gleichsetzen','Gemeinkosten auslassen oder doppelt berücksichtigen','einen Wettbewerber-Stundensatz ohne eigene Kostenbasis übernehmen']
  },
  'produktive-arbeitsstunden':{
    tool:'stundenverrechnungssatz-rechner',
    example:'Ein Betrieb startet für seine interne Planung mit den bezahlten Jahresstunden und zieht dokumentierte Abwesenheiten sowie nicht verrechenbare Tätigkeiten ab. Ergibt die Auswertung beispielsweise 1.400 produktive statt zuvor geschätzter 1.600 Stunden, müssen dieselben Fixkosten auf weniger abrechenbare Stunden verteilt werden.',
    errors:['eine pauschale Branchenzahl ungeprüft übernehmen','interne Tätigkeiten und Rüstzeiten unsichtbar lassen','nur mit einem optimistischen Auslastungsszenario kalkulieren']
  },
  'materialaufschlag-handwerk':{
    tool:'materialaufschlag-rechner',
    example:'Einkauf 100 €, Verkauf 130 €: Der Aufschlag auf den Einkauf beträgt 30 %. Die Handelsspanne bezogen auf den Verkaufspreis beträgt dagegen rund 23,1 %. Genau deshalb dürfen Aufschlag und Marge nicht gleichgesetzt werden.',
    errors:['Aufschlag und Handelsspanne als identische Prozentzahl behandeln','Netto- und Bruttopreise in derselben Rechnung mischen','Beschaffungs- oder Nebenkosten doppelt einrechnen']
  },
  'materialkosten-angebot':{
    tool:'materialkosten-rechner',
    example:'800 € Materialeinkauf, 10 % Reserve und 20 % Materialaufschlag ergeben 1.056 € Netto-Materialverkaufspreis. Bei 19 % Umsatzsteuer wären das rechnerisch 1.256,64 € brutto. Die Prozentstufen wirken nacheinander und sollten deshalb getrennt sichtbar bleiben.',
    errors:['Reserve als Gewinnaufschlag behandeln','Umsatzsteuer mit betrieblichem Materialaufschlag vermischen','Bestell- oder Verpackungseinheiten nach der Kalkulation nicht prüfen']
  },
  'fliesenbedarf-verschnitt':{
    tool:'fliesenrechner',
    example:'25 m² Nettofläche mit 10 % frei gewählter Reserve ergeben 27,5 m² Bestellfläche. Bei 60 × 60 cm großen Fliesen entspricht eine Fliese 0,36 m²; rechnerisch werden damit 77 ganze Fliesen benötigt. Für den Einkauf muss anschließend auf die reale Packungsgröße aufgerundet werden.',
    errors:['Fliesenmaße in Zentimetern ohne Umrechnung verwenden','Verschnitt pauschal festlegen, obwohl Raumform und Verlegebild abweichen','Stückzahl mit Packungsanzahl gleichsetzen']
  },
  'betonmenge-berechnen':{
    tool:'betonrechner',
    example:'5,0 m × 3,0 m × 0,20 m ergeben 3,0 m³ geometrisches Volumen. Mit einer frei gewählten Reserve von 5 % ergibt sich eine Planmenge von 3,15 m³. Lieferbedingungen und Mindestmengen des konkreten Anbieters bleiben separat zu prüfen.',
    errors:['Bauteildicke in Zentimetern statt Metern einsetzen','komplexe Bauteile nicht in Teilkörper zerlegen','die geometrische Menge automatisch mit der endgültigen Bestellung gleichsetzen']
  },
  'bautagesbericht-inhalt':{
    tool:'bautagesbericht-generator',
    example:'Statt „Installationsarbeiten durchgeführt“ ist „3 Monteure, 07:30–16:00 Uhr; Leitungsführung im Technikraum fertiggestellt; Dämmmaterial um 11:20 Uhr geliefert; 45 Minuten Stillstand wegen fehlender Freigabe“ später deutlich besser nachvollziehbar.',
    errors:['nur Sammelbegriffe statt konkreter Bereiche und Tätigkeiten verwenden','Behinderungen erst Tage später aus dem Gedächtnis rekonstruieren','Beobachtung und Schuldzuweisung miteinander vermischen']
  },
  'rapportzettel-richtig-ausfuellen':{
    tool:'rapportzettel-generator',
    example:'Statt „2 Monteure, 6 Stunden, Arbeiten Heizung“ ist „Heizkörper Raum 1.12 demontiert, Leitungsführung angepasst und neuen Heizkörper montiert; 2 Monteure je 3 Stunden; 4 m Rohr und 6 Pressfittings eingesetzt“ wesentlich prüfbarer.',
    errors:['Leistung nur als „diverse Arbeiten“ beschreiben','Stunden und Material ohne Bezug zur konkreten Tätigkeit erfassen','aus dem Generator automatisch eine bestimmte vertragliche Rechtswirkung ableiten']
  }
};
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
for(const [slug,data] of Object.entries(enrich)){
  const key='guide/'+slug;
  if(!window.WR_PAGES[key])continue;
  window.WR_PAGES[key]+=`<section class="content-box wr-guide-enrichment"><h2>Konkretes Praxisbeispiel</h2><p>${esc(data.example)}</p><h2>Typische Fehler vermeiden</h2><ul class="check-list">${data.errors.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h2>Direkt weiterarbeiten</h2><p>Übertrage deine eigenen Werte anschließend in das passende Werkzeug und prüfe das Ergebnis gegen die Bedingungen deines Projekts.</p><p><a class="btn" href="#tool/${data.tool}">Passendes Tool öffnen</a> <a class="btn secondary" href="#methodik">Methodik &amp; Qualität</a></p></section>`;
}
})();
