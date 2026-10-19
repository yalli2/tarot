/* 결과 저장소: Firebase Realtime Database(REST) 또는 로컬 폴백 */
(function(){
const CFG=window.ARCANA_CONFIG||{};
const LS_RESULTS='arcana78.results.v1';
const LS_PROFILE='arcana78.profile.v1';
const LS_STUDIED='arcana78.studied.v1';
const LS_MINE='arcana78.mine.v1';
const remoteUrl=(CFG.firebaseUrl||'').replace(/\/+$/,'');
const isRemote=!!remoteUrl;

const safeGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};

let bc=null;try{bc=new BroadcastChannel('arcana78')}catch(e){}

function cleanCode(c){return String(c||'').trim().toLowerCase().replace(/[^a-z0-9가-힣_-]/g,'').slice(0,24)||'open'}

const Profile={
  get(){return safeGet(LS_PROFILE,{nick:'',session:'open'})},
  set(p){const cur=Profile.get();const n={nick:String(p.nick??cur.nick).trim().slice(0,16),session:cleanCode(p.session??cur.session)};safeSet(LS_PROFILE,n);return n}
};

const Studied={
  all(){return safeGet(LS_STUDIED,{})},
  has(id){return !!Studied.all()[id]},
  toggle(id){const a=Studied.all();if(a[id])delete a[id];else a[id]=1;safeSet(LS_STUDIED,a);return !!a[id]}
};

/* 결과 레코드 검증/정리 (원격에서 온 데이터도 반드시 통과) */
function sanitize(r,deckIds){
  if(!r||typeof r!=='object')return null;
  const cards=Array.isArray(r.cards)?r.cards.slice(0,3).map(c=>({id:String(c.id||''),rev:!!c.rev})).filter(c=>deckIds.has(c.id)):[];
  if(!cards.length)return null;
  return {
    id:String(r.id||'').slice(0,40),
    ts:Number(r.ts)||0,
    nick:String(r.nick||'익명').slice(0,16),
    spread:r.spread==='three'?'three':'one',
    cat:Math.max(0,Math.min(7,parseInt(r.cat,10)||0)),
    cards,
    note:String(r.note||'').slice(0,(CFG.maxNoteLength||280)),
    sample:!!r.sample
  };
}

async function add(session,rec){
  session=cleanCode(session);
  const body={ts:Date.now(),nick:rec.nick,spread:rec.spread,cat:rec.cat,cards:rec.cards,note:rec.note};
  if(isRemote){
    const res=await fetch(`${remoteUrl}/sessions/${encodeURIComponent(session)}/results.json`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!res.ok)throw new Error('공유 서버 저장 실패 ('+res.status+')');
    const j=await res.json();
    const mine=safeGet(LS_MINE,[]);mine.push(j.name);safeSet(LS_MINE,mine.slice(-200));
    return {...body,id:j.name};
  }
  const id='l'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const all=safeGet(LS_RESULTS,[]);
  all.push({...body,id,session});
  safeSet(LS_RESULTS,all.slice(-500));
  const mine=safeGet(LS_MINE,[]);mine.push(id);safeSet(LS_MINE,mine.slice(-200));
  try{bc&&bc.postMessage({t:'new',session})}catch(e){}
  return {...body,id};
}

async function list(session,deckIds){
  session=cleanCode(session);
  let raw=[];
  if(isRemote){
    const url=`${remoteUrl}/sessions/${encodeURIComponent(session)}/results.json?orderBy=%22$key%22&limitToLast=300`;
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok)throw new Error('공유 서버 불러오기 실패 ('+res.status+')');
    const j=await res.json()||{};
    raw=Object.keys(j).map(k=>({...j[k],id:k}));
  }else{
    raw=safeGet(LS_RESULTS,[]).filter(r=>r.session===session);
  }
  return raw.map(r=>sanitize(r,deckIds)).filter(Boolean).sort((a,b)=>b.ts-a.ts);
}

function subscribe(session,deckIds,cb,onError){
  let stop=false,timer=null;
  const tick=async()=>{
    if(stop)return;
    try{cb(await list(session,deckIds),null)}catch(e){onError&&onError(e)}
    if(!stop)timer=setTimeout(tick,(CFG.pollSeconds||5)*1000*(isRemote?1:3));
  };
  tick();
  const onMsg=()=>{if(!isRemote)list(session,deckIds).then(r=>!stop&&cb(r)).catch(()=>{})};
  if(bc)bc.addEventListener('message',onMsg);
  window.addEventListener('storage',onMsg);
  return ()=>{stop=true;clearTimeout(timer);if(bc)bc.removeEventListener('message',onMsg);window.removeEventListener('storage',onMsg)};
}

const isMine=id=>safeGet(LS_MINE,[]).includes(id);

/* 교육자용 예시 데이터: 화면 시연에만 쓰이며 저장·전송되지 않음 */
function makeSamples(deck,n){
  const nicks=['민준','서연','도윤','하은','지호','수아','예준','지우','현우','나은','시우','채원'];
  const notes=['이번 주는 우선순위를 두 가지로 줄여 보려 합니다.','팀원에게 먼저 감사 인사를 전하겠습니다.','결정 전에 정보를 한 번 더 확인하기.','쉬는 시간을 일정에 먼저 넣어 두기.','회의에서 내 의견을 한 문장으로 말해 보기.','미뤄 둔 대화를 이번 주 안에 시작하기.'];
  const out=[];let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
  for(let i=0;i<n;i++){
    const spread=rnd()<.45?'three':'one';const k=spread==='three'?3:1;const used=new Set();const cards=[];
    while(cards.length<k){const c=deck[Math.floor(rnd()*deck.length)];if(used.has(c.id))continue;used.add(c.id);cards.push({id:c.id,rev:rnd()<.5})}
    out.push({id:'s'+i,ts:Date.now()-i*180000,nick:nicks[i%nicks.length],spread,cat:Math.floor(rnd()*8),cards,note:notes[i%notes.length],sample:true});
  }
  return out;
}

window.Store={isRemote,Profile,Studied,add,list,subscribe,isMine,cleanCode,makeSamples};
})();
