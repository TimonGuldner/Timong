const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const code=fs.readFileSync('dist/site-runtime.js','utf8');

async function contactScenario({honey='',mode='success'}={}){
  let submitHandler=null;
  let fetchCalls=[];
  let resetCount=0;
  const status={textContent:''};
  const button={disabled:false,textContent:'Nachricht senden'};
  const honeyField={value:honey};
  const form={
    addEventListener(type,cb){if(type==='submit')submitHandler=cb;},
    querySelector(sel){if(sel==='[name="_honey"]')return honeyField;if(sel==='button[type="submit"]')return button;return null;},
    reportValidity(){return true;},
    reset(){resetCount++;}
  };
  const document={
    querySelector(sel){
      if(sel==='#wr-contact-form')return form;
      if(sel==='#wr-contact-status')return status;
      return null;
    },
    querySelectorAll(){return [];},
    addEventListener(type,cb){if(type==='DOMContentLoaded')cb();}
  };
  class FormDataMock{constructor(){this.values=[];}append(k,v){this.values.push([k,v]);}}
  const fetch=async(url,opts)=>{
    fetchCalls.push({url,opts});
    if(mode==='error')throw new Error('network');
    return {ok:true,json:async()=>({success:true})};
  };
  const sandbox={document,window:{},navigator:{},location:{href:'https://www.werkrechner.de/kontakt'},FormData:FormDataMock,fetch,setTimeout,clearTimeout,console};
  vm.runInNewContext(code,sandbox,{filename:'site-runtime.js'});
  assert(submitHandler,'contact submit handler was not registered');
  await submitHandler({preventDefault(){}});
  await new Promise(r=>setImmediate(r));
  return {status:status.textContent,button,fetchCalls,resetCount};
}

(async()=>{
  const success=await contactScenario({mode:'success'});
  assert.strictEqual(success.fetchCalls.length,1,'success path must submit once');
  assert.strictEqual(success.fetchCalls[0].url,'https://formsubmit.co/ajax/timonguldner55@gmail.com');
  assert.strictEqual(success.fetchCalls[0].opts.method,'POST');
  assert(success.status.includes('erfolgreich versendet'),'success message missing');
  assert.strictEqual(success.resetCount,1,'form should reset after success');
  assert.strictEqual(success.button.disabled,false,'button should be re-enabled');

  const failure=await contactScenario({mode:'error'});
  assert.strictEqual(failure.fetchCalls.length,1,'error path must attempt one submit');
  assert(failure.status.includes('konnte gerade nicht versendet werden'),'error message missing');
  assert.strictEqual(failure.button.disabled,false,'button should be re-enabled after error');

  const spam=await contactScenario({honey:'bot-value',mode:'success'});
  assert.strictEqual(spam.fetchCalls.length,0,'honeypot submission must not call FormSubmit');

  const contact=fs.readFileSync('dist/kontakt/index.html','utf8');
  const privacy=fs.readFileSync('dist/datenschutz/index.html','utf8');
  const css=['dist/styles.css','dist/desktop-v6.css','dist/ux.css'].filter(fs.existsSync).map(f=>fs.readFileSync(f,'utf8')).join('\n');
  assert(contact.includes('name="viewport"'),'contact page must include mobile viewport');
  assert(contact.includes('name="_honey"'),'contact honeypot missing');
  assert(contact.includes('type="email"'),'email input type missing');
  assert(privacy.includes('FormSubmit'),'privacy page must disclose FormSubmit');
  assert(privacy.includes('lokalen Speicher')||privacy.includes('lokal im Browser'),'privacy page must disclose local browser storage');
  assert(/@media/i.test(css),'responsive media rules missing');

  console.log('Runtime QA PASS: contact success, error, honeypot, privacy disclosure and mobile baseline.');
})().catch(err=>{console.error(err);process.exit(1);});
