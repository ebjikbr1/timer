const $=id=>document.getElementById(id);
const fresh=()=>({brakeAt:null,auxAt:null,bigOffAt:null,auxOffAt:null,events:[],sound:true,notified:{}});
let state=fresh();
// Opening the page always begins with a clean start screen.
const save=()=>{};
const formatElapsed=s=>{s=Math.max(0,Math.floor(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const elapsed=(at,now)=>at==null?null:Math.max(0,(now-at)/1000);
let voiceQueue=Promise.resolve();
function speak(message){return new Promise(resolve=>{
  try{
    const utterance=new SpeechSynthesisUtterance(message);
    utterance.lang='ru-RU';utterance.rate=1.05;
    const timeout=setTimeout(resolve,20000);
    utterance.onend=utterance.onerror=()=>{clearTimeout(timeout);resolve()};
    speechSynthesis.speak(utterance);
  }catch{resolve()}
})}
function announce(key,message){
  if(state.notified[key])return false;
  state.notified[key]=true;
  save();
  if(state.sound){
    const cue=window.VoiceClips?.cueForKey(key);
    voiceQueue=voiceQueue.then(async()=>{
      if(!state.sound)return;
      const played=cue?await window.VoiceClips.play(cue):false;
      if(!played)await speak(message);
    }).catch(()=>{});
  }
  return true;
}
function flashCard(id){const card=$(id+'-card');card.classList.remove('flash');void card.offsetWidth;card.classList.add('flash');setTimeout(()=>card.classList.remove('flash'),1300)}
function mark(label){window.VoiceClips?.unlock();state.events.unshift({at:Date.now(),label});state.events=state.events.slice(0,40);save();render()}
function renderTimer(id,at,duration,now,waiting,done){const card=$(id+'-card'),value=$(id),note=$(id+'-note');card.classList.remove('active','ready','overdue');if(at==null){value.textContent='—';note.textContent='Ожидание';return}const passed=elapsed(at,now);value.textContent=formatElapsed(passed);if(done){card.classList.add('ready');note.textContent=done;return}if(passed<duration){card.classList.add('active');note.textContent=waiting}else{card.classList.add('overdue');note.textContent='Время вышло'}}
function renderElapsed(id,at,now){const card=$(id+'-card');card.classList.remove('ready','overdue');card.classList.add('active');$(id).textContent=at==null?'—':formatElapsed(elapsed(at,now))}
function render(){const now=Date.now();const braking=state.brakeAt!=null&&state.bigOffAt==null;const auxHeld=state.auxAt!=null&&state.auxOffAt==null;const released=state.bigOffAt!=null;const ten=elapsed(state.brakeAt,now);const thirty=elapsed(state.bigOffAt,now);const minute=elapsed(state.bigOffAt,now);
  const started=state.brakeAt!=null;
  document.querySelector('.app').classList.toggle('idle',!started);
  $('status-card').hidden=!started;
  document.querySelector('.timers').hidden=!started;
  document.querySelector('.log-section').hidden=!started;
  document.querySelector('.footnote').hidden=!started;
  $('sound').hidden=!started;
  if($('voice-setup-link'))$('voice-setup-link').hidden=started;
  $('brake-limit-card').hidden=!braking;
  $('aux-limit-card').hidden=!auxHeld;
  $('aux-thirty-card').hidden=!released||!auxHeld;
  $('traction-card').hidden=!released||minute>=60;
  $('since-release-card').hidden=!released;
  renderTimer('brake-limit',state.brakeAt,150,now,'От начала торможения',!braking?'Торможение завершено':null);
  renderTimer('aux-limit',state.auxAt,150,now,'От зажатия крана',!auxHeld&&state.auxAt!=null?'Кран отпущен':null);
  renderTimer('aux-thirty',state.bigOffAt,30,now,'Держите вспомогательный кран',released&&thirty>=30?'Можно отпускать свой':null);
  renderTimer('traction',state.bigOffAt,60,now,'От отпуска большого крана',released&&minute>=60&&state.auxOffAt!=null?'Можно собирать тягу':null);
  renderElapsed('since-release',state.bigOffAt,now);
  if(braking&&ten>=10){
    if(announce('ten-'+state.brakeAt,'Десять секунд вышло.'))flashCard('brake-limit');
    if(auxHeld)announce('aux-ready-'+state.auxAt,'Вспомогательный кран зажат, можно отпускать тормоза.');
  }
  if(braking&&ten>=150&&announce('brake-limit-'+state.brakeAt,'Две с половиной минуты торможения прошли. Проверьте дальнейшее действие.'))flashCard('brake-limit');
  if(auxHeld&&elapsed(state.auxAt,now)>=150&&announce('aux-limit-'+state.auxAt,'Две с половиной минуты с зажатия вспомогательного крана прошли.'))flashCard('aux-limit');
  if(released&&thirty>=30&&announce('thirty-'+state.bigOffAt,'Тридцать секунд вышло. Можно отпускать свой!'))flashCard('aux-thirty');
  if(released&&minute>=60&&auxHeld&&announce('minute-wait-'+state.bigOffAt,'Минута вышла. Вспомогательный кран ещё зажат.'))flashCard('since-release');
  if(released&&minute>=60&&state.auxOffAt!=null&&announce('minute-'+state.bigOffAt,'Минута вышла, можно собирать тягу.'))flashCard('since-release');
  let title='Готов к началу',hint='Нажмите кнопку в момент начала торможения.';
  if(braking){title=ten<10?'Торможение идёт':ten<150?'10 секунд прошли':'2,5 минуты прошли';hint=ten<10?'Дождитесь первых 10 секунд.':ten<150?'При отпуске сначала зажмите вспомогательный кран.':'Продолжайте торможение или переходите к отпуску.'}
  if(auxHeld&&braking){title='Вспомогательный кран зажат';hint='Отметьте отпуск большого крана, когда он произойдёт.'}
  if(released){
    title=thirty<30?'Удерживайте вспомогательный кран':minute<60?'30 секунд вышло':'Минута вышла';
    hint=thirty<30?'30 секунд считаются с отпуска большого крана.':minute<60?(auxHeld?'Можно отпускать свой; дождитесь минуты до тяги.':'Дождитесь минуты до тяги.'):(auxHeld?'Вспомогательный кран ещё зажат.':'Можно собирать тягу.');
  }
  $('status-title').textContent=title;$('status-hint').textContent=hint;
  $('brake').hidden=started;
  $('aux-on').hidden=!braking||state.auxAt!=null;
  $('big-off').hidden=!braking||!auxHeld;
  $('big-off').disabled=ten<10;
  $('aux-off').hidden=!released||!auxHeld;
  $('aux-off').disabled=thirty<30;
  $('new-cycle').hidden=state.auxOffAt==null||minute<60;
  $('sound').textContent=state.sound?'🔊':'🔇';$('sound').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');
  $('log').innerHTML=state.events.length?state.events.map(e=>`<li><span>${escapeHtml(e.label)}</span><time>${new Date(e.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time></li>`).join(''):'<li class="empty">Событий пока нет</li>';
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function begin(){state.brakeAt=Date.now();state.auxAt=null;state.bigOffAt=null;state.auxOffAt=null;state.notified={};mark('Начато торможение');announce('brake-'+state.brakeAt,'Применили тормоза!')}
$('brake').onclick=begin;$('new-cycle').onclick=begin;
$('aux-on').onclick=()=>{if(!state.brakeAt||state.bigOffAt!=null||state.auxAt!=null)return;state.auxAt=Date.now();mark('Зажат вспомогательный кран');if(elapsed(state.brakeAt,Date.now())>=10)announce('aux-ready-'+state.auxAt,'Вспомогательный кран зажат, можно отпускать тормоза.');else announce('aux-held-'+state.auxAt,'Вспомогательный кран зажат.')};
$('big-off').onclick=()=>{if(!state.auxAt||state.bigOffAt!=null||elapsed(state.brakeAt,Date.now())<10)return;state.bigOffAt=Date.now();mark('Отпущен большой кран');announce('big-off-'+state.bigOffAt,'Дали отпуск.')};
$('aux-off').onclick=()=>{if(!state.bigOffAt||state.auxOffAt!=null||elapsed(state.bigOffAt,Date.now())<30)return;state.auxOffAt=Date.now();announce('aux-off-'+state.auxOffAt,'Вспомогательный кран отпущен.');mark('Отпущен вспомогательный кран');if(elapsed(state.bigOffAt,Date.now())>=60)announce('minute-'+state.bigOffAt,'Минута вышла, можно собирать тягу.')};
$('sound').onclick=()=>{state.sound=!state.sound;save();render()};
$('reset').onclick=()=>{if(!confirm('Сбросить все текущие таймеры и журнал?'))return;state=fresh();save();render()};
render();setInterval(render,250);
