(function(){
'use strict';
const p=location.pathname.replace(/\/+$/,'')||'/';
let route='';
if(p==='/tools') route='tools';
else if(p.startsWith('/tools/')) route='tool/'+p.slice('/tools/'.length);
else if(p==='/ratgeber') route='guides';
else if(p.startsWith('/ratgeber/')) route='guide/'+p.slice('/ratgeber/'.length);
else if(p==='/ueber-uns') route='about';
else if(p==='/kontakt') route='contact';
else if(p==='/methodik') route='methodik';
else if(p==='/impressum') route='impressum';
else if(p==='/datenschutz') route='datenschutz';
else if(p==='/datenschutz-einstellungen') route='privacy-settings';
if(route && !location.hash){
  window.WR_CLEAN_ROUTE_BOOTSTRAPPED=true;
  location.hash=route;
}
})();
