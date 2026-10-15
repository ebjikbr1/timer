(function(){
  let manifestPromise;
  let audioContext;
  const cache=new Map();
  const downloads=new Map();
  function manifest(){
    if(!manifestPromise)manifestPromise=fetch('audio/manifest.json').then(response=>response.ok?response.json():{}).catch(()=>({}));
    return manifestPromise;
  }
  async function preload(){
    const clips=await manifest();
    await Promise.all(Object.entries(clips).map(async([id,filename])=>{
      if(!downloads.has(id))downloads.set(id,fetch(`audio/${encodeURIComponent(filename)}`).then(response=>{
        if(!response.ok)throw new Error('Audio unavailable');
        return response.arrayBuffer();
      }));
      try{await downloads.get(id)}catch{downloads.delete(id)}
    }));
  }
  function unlock(){
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return Promise.resolve(false);
    try{audioContext=audioContext||new Context();return audioContext.resume().then(()=>true).catch(()=>false)}catch{return Promise.resolve(false)}
  }
  async function play(id){
    try{
      const clips=await manifest();
      const filename=clips[id];
      if(!filename)return false;
      await unlock();
      if(!audioContext||audioContext.state!=='running')return false;
      let buffer=cache.get(id);
      if(!buffer){
        if(!downloads.has(id))downloads.set(id,fetch(`audio/${encodeURIComponent(filename)}`).then(response=>{
          if(!response.ok)throw new Error('Audio unavailable');
          return response.arrayBuffer();
        }));
        buffer=await audioContext.decodeAudioData((await downloads.get(id)).slice(0));
        cache.set(id,buffer);
      }
      const source=audioContext.createBufferSource();source.buffer=buffer;source.connect(audioContext.destination);
      return await new Promise(resolve=>{source.onended=()=>resolve(true);source.start()});
    }catch{return false}
  }
  function cueForKey(key){
    if(key.startsWith('brake-limit-'))return 'brake-limit';
    if(key.startsWith('aux-limit-'))return 'aux-limit';
    if(key.startsWith('aux-ready-'))return 'aux-ready';
    if(key.startsWith('aux-held-'))return 'aux-held';
    if(key.startsWith('aux-off-'))return 'aux-off';
    if(key.startsWith('big-off-'))return 'big-off';
    if(key.startsWith('minute-wait-'))return 'minute-wait';
    if(key.startsWith('minute-'))return 'minute';
    if(key.startsWith('thirty-'))return 'thirty';
    if(key.startsWith('ten-'))return 'ten';
    if(key.startsWith('brake-'))return 'brake';
    return null;
  }
  window.VoiceClips={unlock,play,cueForKey};
  preload();
})();
