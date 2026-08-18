(function(){'use strict';
const TIPS={
'abnahmeprotokoll-generator':'Notiere Mängel nie nur als Sammelbegriff. Ort, konkreter Zustand, vereinbarte Nacharbeit und Frist machen das Protokoll später deutlich nachvollziehbarer.',
'anfahrtskosten-rechner':'Rechne einmal mit deinem tatsächlichen Fahrzeugkostensatz und einmal nur mit Kraftstoffkosten. Die Differenz zeigt, wie leicht Versicherung, Verschleiß und Wertverlust unterschätzt werden.',
'angebotskalkulator':'Speichere nach Projektende die tatsächlichen Stunden und Materialkosten neben der ursprünglichen Kalkulation. Diese Nachkalkulation verbessert das nächste Angebot stärker als pauschale Aufschläge.',
'aufmass-rechner':'Teile verwinkelte Flächen in einfache Rechtecke auf und notiere die Einzelmaße. So kannst du die Gesamtsumme später anhand von Plan, Foto oder Baustellennotiz kontrollieren.',
'baustellenbericht-generator':'Schreibe offene Punkte möglichst als Kombination aus Sachverhalt, Verantwortlichem und nächstem Termin. Dadurch wird aus einer Beschreibung ein tatsächlich nutzbares Projektupdate.',
'bautagesbericht-generator':'Erstelle den Bericht möglichst am selben Arbeitstag. Personalstärke, Lieferzeiten und kurze Behinderungen werden nach einigen Tagen besonders häufig ungenau erinnert.',
'betonrechner':'Rechne die reine Geometrie zuerst ohne Reserve. Ergänze die Reserve anschließend bewusst und prüfe danach Mindestmenge, Lieferstaffel und Bestellschritte des Betonwerks.',
'dachflaechen-rechner':'Bei Gauben, Anbauten oder unterschiedlichen Dachseiten solltest du jede Teilfläche separat rechnen. Eine einzige Gesamtformel verschleiert sonst schnell fehlende oder doppelte Flächen.',
'dachneigungs-rechner':'Miss die horizontale Strecke unabhängig von der Sparrenlänge. Schon diese Verwechslung kann den Winkel deutlich verändern und damit nachfolgende Materialentscheidungen verfälschen.',
'deckungsbeitrag-rechner':'Vergleiche nicht nur den absoluten Deckungsbeitrag verschiedener Aufträge, sondern auch benötigte Arbeitszeit und Kapazität. Ein kleinerer Auftrag kann pro gebundener Stunde wirtschaftlicher sein.',
'estrichrechner':'Wenn die Schichtdicke im Raum schwankt, rechne nicht nur mit dem Mindestwert. Mehrere Messpunkte oder eine realistische mittlere Dicke liefern eine belastbarere Mengenplanung.',
'farbverbrauch-rechner':'Übernimm die Ergiebigkeit direkt vom konkreten Produkt und rechne anschließend auf ganze Gebinde auf. Bei stark saugenden Untergründen lohnt zusätzlich eine zweite Bedarfsschätzung.',
'fliesen-verschnitt-rechner':'Plane Verschnitt und spätere Ersatzfliesen getrennt. Was beim Zuschneiden verbraucht wird, erfüllt einen anderen Zweck als eine zurückgelegte Reserve aus derselben Charge.',
'fliesenrechner':'Berechne zunächst die benötigte Fläche und Stückzahl und übertrage das Ergebnis erst danach auf die tatsächliche Packungsgröße. So bleibt sichtbar, wo die Aufrundung entsteht.',
'fugenmasse-rechner':'Prüfe den errechneten Bedarf immer gegen die Verbrauchstabelle des gewählten Produkts. Format, Fugenbreite und Fugentiefe können den Verbrauch stärker verändern als die reine Raumfläche.',
'maengelprotokoll-generator':'Ein Foto ist am hilfreichsten, wenn Text und Bild dieselbe eindeutige Ortsangabe verwenden. Nummeriere Mängel, damit Fristen, Nachweise und spätere Rückfragen sauber zugeordnet bleiben.',
'materialaufschlag-rechner':'Lege vor der Kalkulation fest, ob du mit Aufschlag oder gewünschter Marge arbeitest. Ein Ziel von 30 Prozent Marge lässt sich nicht einfach als 30 Prozent Aufschlag auf den Einkauf rechnen.',
'materialkosten-rechner':'Trenne Verschnitt, kaufmännischen Aufschlag und Umsatzsteuer gedanklich voneinander. So erkennst du sofort, welcher Faktor den Endpreis tatsächlich verändert.',
'mitarbeiterkosten-rechner':'Nutze für interne Entscheidungen lieber einen nachvollziehbaren eigenen Arbeitgeberfaktor als einen pauschalen Internetwert. Sonderzahlungen und betriebliche Zusatzkosten kannst du separat ergänzen.',
'moertelrechner':'Bei unebenem Untergrund ist die mittlere Schichtdicke entscheidender als das Sollmaß an einer einzelnen Stelle. Prüfe deshalb vor der Bestellung mehrere repräsentative Bereiche.',
'projektkosten-rechner':'Erfasse größere Kostenblöcke getrennt statt sie unter Sonstiges zu sammeln. Dadurch siehst du bei der Nachkalkulation sofort, ob Personal, Material, Geräte oder Fahrt die Abweichung verursacht haben.',
'rapportzettel-generator':'Formuliere Leistungen so, dass auch eine nicht anwesende Person versteht, was zusätzlich ausgeführt wurde. Stunden allein erklären noch nicht, welche Regieleistung dahinterstand.',
'regiebericht-generator':'Verbinde Mitarbeiterstunden möglichst mit konkreten Tätigkeiten und Materialeinsatz. Das macht die spätere Prüfung deutlich einfacher als eine reine Summe aller Stunden.',
'stundenverrechnungssatz-rechner':'Teste den Satz zusätzlich mit weniger produktiven Jahresstunden als erwartet. Wenn der Verrechnungssatz dann stark steigt, ist deine Kalkulation besonders empfindlich gegenüber Auslastung.',
'stundenzettel-rechner':'Bei mehreren Arbeitsblöcken am selben Tag solltest du jeden Block separat dokumentieren und erst anschließend summieren. So bleiben Unterbrechungen und Pausen nachvollziehbar.',
'tapetenrechner':'Prüfe bei Mustertapeten vor dem Kauf unbedingt den Rapport. Ein großer Rapport kann die Zahl nutzbarer Bahnen pro Rolle reduzieren, obwohl Raumumfang und Rollenmaß unverändert bleiben.',
'terrassenmaterial-rechner':'Lege die Verlegerichtung vor der Bestellung fest. Sie beeinflusst Zuschnitt und benötigte Dielenlängen und kann deshalb trotz gleicher Terrassenfläche zu anderem realen Bedarf führen.',
'wandflaechen-rechner':'Ziehe Öffnungen nur dann vollständig ab, wenn der nachfolgende Arbeitsschritt tatsächlich nach Nettofläche geplant wird. Laibungen und Anschlüsse können zusätzlichen Aufwand verursachen.'
};
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function apply(){const slug=location.hash.startsWith('#tool/')?location.hash.slice(6):'';if(!slug||!TIPS[slug])return;const box=document.querySelector('.wr-depth-v4 .content-box');if(!box)return;const p=[...box.querySelectorAll('p.muted')].find(x=>x.textContent.includes('Praxis-Tipp:'));if(!p||p.dataset.individualized)return;p.innerHTML='<strong>Praxis-Tipp:</strong> '+esc(TIPS[slug]);p.dataset.individualized='true'}
function schedule(){setTimeout(apply,140);setTimeout(apply,360)}
addEventListener('hashchange',schedule);addEventListener('DOMContentLoaded',schedule);const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});schedule();
})();