(function(){
  'use strict';
  const RECENT_KEY='wr_recent_v1';
  try{
    const proto=Storage.prototype;
    const originalGet=proto.getItem;
    const originalSet=proto.setItem;
    const originalRemove=proto.removeItem;
    // Remove any older persistent copy from previous preview versions.
    try{originalRemove.call(localStorage,RECENT_KEY)}catch{}
    proto.getItem=function(key){
      if(this===localStorage && key===RECENT_KEY){return originalGet.call(sessionStorage,key)}
      return originalGet.call(this,key)
    };
    proto.setItem=function(key,value){
      if(this===localStorage && key===RECENT_KEY){return originalSet.call(sessionStorage,key,value)}
      return originalSet.call(this,key,value)
    };
    proto.removeItem=function(key){
      if(this===localStorage && key===RECENT_KEY){return originalRemove.call(sessionStorage,key)}
      return originalRemove.call(this,key)
    };
  }catch(e){}
})();
