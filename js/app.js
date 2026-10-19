/* 아르카나 78 · HR 인사이트 랩 — 메인 앱 (의존성 없는 순수 JS) */
(function(){
'use strict';
const {SUITS,SUIT_ORDER,CATS,NUMBERS,JOURNEY,ROMAN}=window.META;
const CFG=window.ARCANA_CONFIG||{};
const DECK=window.DECK;
const BY_ID=Object.fromEntries(DECK.map(c=>[c.id,c]));
const DECK_IDS=new Set(DECK.map(c=>c.id));
const THREE_POS=['현재 상황','도전 과제','다음 행동'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const app=$('#app');
let cleanup=null;           // 화면 전환 시 정리할 함수(구독 등)

/* ---------- 공통 조각 ---------- */
function elSvg(suit,sz=22){
  const s=sz,c='currentColor';
  const up='M12 3 L21 20 L3 20 Z',dn='M12 21 L3 4 L21 4 Z';
  const body={
    cups:`<path d="${dn}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`,
    wands:`<path d="${up}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`,
    swords:`<path d="${up}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 14 H17" stroke="${c}" stroke-width="1.8"/>`,
    pents:`<path d="${dn}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 10 H17" stroke="${c}" stroke-width="1.8"/>`,
    major:`<path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>`
  }[suit];
  return `<svg class="elsvg" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${body}</svg>`;
}
function numLabel(c){
  if(c.suit==='major')return ROMAN[c.no];
  return c.no===1?'A':c.no===11?'P':c.no===12?'N':c.no===13?'Q':c.no===14?'K':String(c.no);
}
function cardFace(c,o={}){
  const rev=!!o.rev,cls=['tcard','has-img','suit-'+c.suit,o.size||'',rev?'is-rev':'',o.cls||''].join(' ');
  return `<div class="${cls}" style="--sc:${SUITS[c.suit].color}" ${o.id?`data-id="${c.id}"`:''}>
    <img class="tc-img" src="img/cards/${c.id}.jpg?v=202610200351" alt="${esc(c.ko)} (${esc(c.en)})${rev?' 역방향':''}" loading="lazy" decoding="async" draggable="false">
    <div class="tc-cap"><span class="tc-num">${numLabel(c)}</span>${esc(c.ko)}</div>
    ${rev?'<span class="tc-badge">▼ 역방향</span>':''}
  </div>`;
}
function cardBack(label=''){return `<div class="tcard back"><div class="back-art">${elSvg('major',44)}</div><div class="back-label">${esc(label)}</div></div>`;}
const kwChips=(s,cls)=>String(s).split(/\s*,\s*/).filter(Boolean).map(k=>`<span class="chip ${cls}">${esc(k)}</span>`).join('');
const pct=(a,b)=>b?Math.round(a/b*100):0;

/* ---------- 라우터 ---------- */
const NAV=[['#/','홈'],['#/intro','Ch.0 오리엔테이션'],['#/ch/major','Ch.1 메이저'],['#/ch/cups','Ch.2 컵'],['#/ch/wands','Ch.3 완드'],['#/ch/swords','Ch.4 소드'],['#/ch/pents','Ch.5 펜타클'],['#/charts','도표'],['#/practice','실습'],['#/board','결과 보드']];
function renderNav(route){
  $('#nav').innerHTML=NAV.map(([h,t])=>`<a href="${h}" class="${h===route?'on':''}">${t}</a>`).join('');
}
function route(){
  if(cleanup){try{cleanup()}catch(e){}cleanup=null}
  closeModal(true);
  const h=location.hash||'#/';
  const [path,qs]=h.split('?');
  const parts=path.replace(/^#\/?/,'').split('/');
  let navKey='#/';
  if(parts[0]==='intro'){navKey='#/intro';vIntro()}
  else if(parts[0]==='ch'&&SUITS[parts[1]]){navKey='#/ch/'+parts[1];vChapter(parts[1])}
  else if(parts[0]==='charts'){navKey='#/charts';vCharts()}
  else if(parts[0]==='practice'){navKey='#/practice';vPractice()}
  else if(parts[0]==='board'){navKey='#/board';vBoard(new URLSearchParams(qs||''))}
  else vHome();
  renderNav(navKey);
  window.scrollTo(0,0);
  app.focus({preventScroll:true});
}

/* ---------- 홈 ---------- */
function chapterProgress(suit){
  const cards=DECK.filter(c=>c.suit===suit);
  const done=cards.filter(c=>Store.Studied.has(c.id)).length;
  return {done,total:cards.length};
}
function vHome(){
  const chap=SUIT_ORDER.map((s,i)=>{
    const S=SUITS[s],p=chapterProgress(s);
    return `<a class="chap-card" href="#/ch/${s}" style="--sc:${S.color}">
      <div class="chap-no">Ch.${i+1}</div>
      <div class="chap-ico">${elSvg(s,34)}</div>
      <h3>${S.ko}</h3>
      <p class="muted">${S.el} 원소 · ${p.total}장</p>
      <p class="chap-hr">${esc(S.hr)}</p>
      <div class="bar"><i style="width:${pct(p.done,p.total)}%"></i></div>
      <span class="muted small">학습 ${p.done}/${p.total}</span>
    </a>`}).join('');
  app.innerHTML=`
  <section class="hero">
    <p class="eyebrow">DAIN EDU · HR TAROT PROGRAM</p>
    <h1>아르카나 78<span> · HR 인사이트 랩</span></h1>
    <p class="lead">78장의 카드를 거울 삼아 나의 일과 팀을 읽는, 성인 학습자를 위한 HR 타로 코칭 프로그램.<br>
    카드의 유형과 수트별 의미를 하나씩 익히고, 함께 뽑고, 서로의 결과를 나란히 비교해 보세요.</p>
    <div class="cta">
      <a class="btn primary" href="#/intro">Ch.0 오리엔테이션 시작</a>
      <a class="btn" href="#/practice">바로 카드 뽑기</a>
      <a class="btn ghost" href="#/board">결과 보드 보기</a>
    </div>
    <div class="hero-cards" aria-hidden="true">
      ${['major','cups','wands','swords','pents'].map((s,i)=>{const c=DECK.find(x=>x.suit===s&&(s==='major'?x.no===0:x.no===1));return `<div class="hc hc${i}">${cardFace(c,{size:'sm'})}</div>`}).join('')}
    </div>
  </section>
  <section>
    <h2>프로그램 구성</h2>
    <p class="muted">교재의 구조를 그대로 따라 5개 챕터로 학습합니다. 각 챕터에서 카드를 열어 8가지 영역(시작·커리어·재정·사랑·인간관계·건강·상위 안내·결과)의 정/역방향 의미와 실천 행동을 확인하세요.</p>
    <div class="chap-grid">${chap}</div>
  </section>
  <section class="two">
    <div class="panel">
      <h2>이 프로그램이 다루는 것</h2>
      <ul class="tick">
        <li><b>유형별 학습</b> 메이저 22장 + 마이너 56장(4개 수트)</li>
        <li><b>카드당 8영역 해설</b> 정방향·역방향 각각의 의미와 행동 제안</li>
        <li><b>HR 번역</b> 8영역을 변화·직무·자원·신뢰·팀·웰빙·가치·방향성으로 연결</li>
        <li><b>함께 실습</b> 세션 코드로 모인 수강생의 결과를 한 화면에서 비교</li>
        <li><b>교재 도표</b> 원소표, 숫자표, 바보의 여정, 분포 차트</li>
      </ul>
    </div>
    <div class="panel note">
      <h2>이용 원칙</h2>
      <p>이 도구는 <b>성찰과 대화를 돕는 코칭 도구</b>입니다. 미래를 예측하거나 사람을 진단·평가하는 용도가 아니며, 채용·평가·인사 결정의 근거로 사용하지 않습니다. 결과 공유는 언제나 자발적이어야 하고, 민감한 개인 정보는 적지 않습니다.</p>
    </div>
  </section>`;
}

/* ---------- Ch.0 오리엔테이션 ---------- */
function vIntro(){
  app.innerHTML=`
  <header class="page-h"><p class="eyebrow">Chapter 0</p><h1>오리엔테이션 — 타로 읽기의 기본기</h1>
  <p class="lead">카드 한 장을 읽는 순서를 익히면 78장 모두에 같은 틀을 적용할 수 있습니다.</p></header>
  <section class="two">
    <div class="panel"><h2>① 덱의 구조</h2>
      <table class="tbl"><thead><tr><th>구분</th><th>장수</th><th>역할</th></tr></thead><tbody>
      <tr><td>${elSvg('major',16)} 메이저 아르카나</td><td>22</td><td>인생의 큰 주제·전환점 (바보 0 ~ 세계 XXI)</td></tr>
      <tr><td>${elSvg('cups',16)} 컵 · ${elSvg('wands',16)} 완드<br>${elSvg('swords',16)} 소드 · ${elSvg('pents',16)} 펜타클</td><td>14×4=56</td><td>일상의 구체적 상황 (에이스~10 + 페이지·나이트·퀸·킹)</td></tr>
      </tbody></table>
      <p class="muted small">마이너 아르카나는 4개 원소(물·불·공기·흙)에 대응하며, 같은 숫자는 수트가 달라도 비슷한 "단계"를 말합니다.</p>
    </div>
    <div class="panel"><h2>② 정방향과 역방향</h2>
      <div class="legend">
        <div><span class="mark up">▲ 정방향</span> 에너지가 자연스럽게 드러나는 모습. 카드의 본래 의미를 그대로 읽습니다.</div>
        <div><span class="mark rev">▼ 역방향</span> 에너지가 막히거나 과하거나 내면으로 향한 모습. "나쁜 카드"가 아니라 <b>점검 신호</b>입니다.</div>
        <div><span class="mark act">➶ 행동</span> 교재는 모든 의미 뒤에 실천 제안(Action)을 덧붙입니다. 학습의 핵심은 이 행동입니다.</div>
      </div>
    </div>
  </section>
  <section><h2>③ 8가지 읽기 영역과 HR 번역</h2>
  <p class="muted">같은 카드도 어떤 영역으로 묻느냐에 따라 의미가 달라집니다. 실습에서는 하나의 영역을 골라 읽습니다.</p>
  <div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>영역</th><th>HR 번역</th><th>성찰 질문</th></tr></thead><tbody>
  ${CATS.map(c=>`<tr><td class="ico">${c.icon}</td><td><b>${c.ko}</b><br><span class="muted small">${c.en}</span></td><td>${c.hr}</td><td>${esc(c.q)}</td></tr>`).join('')}
  </tbody></table></div></section>
  <section class="two">
    <div class="panel"><h2>④ 한 장을 읽는 5단계</h2>
      <ol class="steps">
        <li><b>이미지</b> 먼저 눈에 들어오는 것을 말해 봅니다.</li>
        <li><b>키워드</b> 정방향/역방향 키워드를 확인합니다.</li>
        <li><b>영역</b> 지금 묻는 주제(예: 커리어)의 해설을 읽습니다.</li>
        <li><b>행동</b> 제안된 행동을 내 상황에 맞게 바꿔 적습니다.</li>
        <li><b>공유</b> 한 줄로 요약해 동료와 비교합니다.</li>
      </ol>
    </div>
    <div class="panel"><h2>⑤ 시작하기</h2>
      <p>챕터 순서대로 학습해도 좋고, 먼저 실습으로 카드를 뽑은 뒤 해당 카드를 챕터에서 찾아 깊이 읽어도 좋습니다.</p>
      <div class="cta left"><a class="btn primary" href="#/ch/major">Ch.1 메이저 아르카나</a><a class="btn" href="#/practice">실습으로 바로 가기</a></div>
    </div>
  </section>`;
}

/* ---------- 챕터 ---------- */
function vChapter(suit){
  const S=SUITS[suit],cards=DECK.filter(c=>c.suit===suit);
  const idx=SUIT_ORDER.indexOf(suit);
  let q='';
  const render=()=>{
    const p=chapterProgress(suit);
    const list=cards.filter(c=>!q||(c.ko+c.en+c.ku+c.kr).toLowerCase().includes(q.toLowerCase()));
    $('#grid').innerHTML=list.map(c=>`<button class="card-btn ${Store.Studied.has(c.id)?'done':''}" data-open="${c.id}" aria-label="${esc(c.ko)} 카드 열기">
      ${cardFace(c)}<span class="done-mark" aria-hidden="true">✓</span></button>`).join('')||'<p class="muted">검색 결과가 없습니다.</p>';
    $('#prog').innerHTML=`<div class="bar"><i style="width:${pct(p.done,p.total)}%"></i></div><span class="muted small">학습 완료 ${p.done}/${p.total}</span>`;
  };
  const prev=SUIT_ORDER[idx-1],next=SUIT_ORDER[idx+1];
  const strip=suit==='major'?`
    <div class="journey">${JOURNEY.map(j=>`<div class="j-row"><div class="j-h"><b>${j.ko}</b><span class="muted small">${ROMAN[j.range[0]]}–${ROMAN[j.range[1]]} · ${j.desc}</span></div>
      <div class="j-cells">${cards.filter(c=>c.no>=j.range[0]&&c.no<=j.range[1]).map(c=>`<button class="j-cell" data-open="${c.id}" style="--sc:${S.color}"><b>${ROMAN[c.no]}</b><span>${esc(c.ko)}</span></button>`).join('')}</div></div>`).join('')}</div>`:`
    <div class="num-strip">${NUMBERS.map(n=>{const c=cards.find(x=>x.no===n.n);return `<button class="n-cell" data-open="${c.id}" style="--sc:${S.color}"><b>${n.n<=10?(n.n===1?'A':n.n):''}${n.n>10?n.ko:''}</b><span>${n.kw}</span></button>`}).join('')}</div>`;
  app.innerHTML=`
  <header class="page-h ch-h" style="--sc:${S.color}">
    <p class="eyebrow">Chapter ${idx+1} · ${S.el} 원소</p>
    <h1><span class="h-ico">${elSvg(suit,38)}</span>${S.ko}${suit==='major'?'':' 수트'}</h1>
    <p class="lead">${esc(S.theme)}</p>
    <p class="hr-line"><b>HR 연결</b> ${esc(S.hr)}</p>
    <div id="prog" class="prog"></div>
  </header>
  <section><h2>${suit==='major'?'바보의 여정 (3단계)':'숫자별 흐름'}</h2>
  <p class="muted small">${suit==='major'?'22장을 대표적인 세 단계로 나눈 도표입니다. 칸을 눌러 카드를 여세요.':'에이스에서 킹까지 이어지는 성장 단계입니다. 칸을 눌러 카드를 여세요.'}</p>${strip}</section>
  <section><div class="grid-h"><h2>카드 ${cards.length}장</h2><input id="q" type="search" placeholder="카드·키워드 검색 (예: 번아웃, 협업)" aria-label="카드 검색"></div>
  <div id="grid" class="card-grid"></div></section>
  <nav class="pager">${prev?`<a class="btn" href="#/ch/${prev}">← ${SUITS[prev].ko}</a>`:'<span></span>'}${next?`<a class="btn primary" href="#/ch/${next}">${SUITS[next].ko} →</a>`:`<a class="btn primary" href="#/practice">실습으로 →</a>`}</nav>`;
  render();
  $('#q').addEventListener('input',e=>{q=e.target.value.trim();render()});
  const onStudied=()=>render();
  window.addEventListener('studied-changed',onStudied);
  cleanup=()=>window.removeEventListener('studied-changed',onStudied);
}

/* ---------- 카드 모달 ---------- */
let modalState=null,lastFocus=null;
function openCard(id,opts={}){
  const c=BY_ID[id];if(!c)return;
  modalState={id,rev:!!opts.rev,cat:opts.cat??0,siblings:opts.siblings||DECK.filter(x=>x.suit===c.suit).map(x=>x.id)};
  lastFocus=document.activeElement;
  let m=$('#modal');
  if(!m){m=document.createElement('div');m.id='modal';m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');document.body.appendChild(m)}
  renderModal();
  document.body.classList.add('noscroll');
}
function closeModal(silent){
  const m=$('#modal');if(m)m.remove();
  document.body.classList.remove('noscroll');
  modalState=null;
  if(!silent&&lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}
}
function renderModal(){
  const m=$('#modal');if(!m||!modalState)return;
  const c=BY_ID[modalState.id],{rev,cat}=modalState,S=SUITS[c.suit],row=c.s[cat],K=CATS[cat];
  const sib=modalState.siblings,i=sib.indexOf(c.id);
  const studied=Store.Studied.has(c.id);
  m.setAttribute('aria-label',c.ko+' 카드 상세');
  m.innerHTML=`<div class="m-back" data-close></div>
  <div class="m-box" style="--sc:${S.color}">
    <button class="m-x" data-close aria-label="닫기">✕</button>
    <div class="m-grid">
      <aside class="m-side">
        ${cardFace(c,{rev,size:'lg'})}
        <div class="seg" role="group" aria-label="방향 선택">
          <button class="${!rev?'on':''}" data-rev="0">▲ 정방향</button>
          <button class="${rev?'on':''}" data-rev="1">▼ 역방향</button>
        </div>
        <button class="btn ${studied?'primary':''} wide" data-studied>${studied?'✓ 학습 완료':'학습 완료로 표시'}</button>
        <div class="m-nav"><button class="btn" data-step="-1" ${i<=0?'disabled':''}>← 이전</button><button class="btn" data-step="1" ${i>=sib.length-1?'disabled':''}>다음 →</button></div>
      </aside>
      <div class="m-main">
        <p class="eyebrow">${S.ko} · ${S.el} 원소 · ${c.suit==='major'?'No. '+ROMAN[c.no]:numLabel(c)}</p>
        <h2>${esc(c.ko)} <span class="en">${esc(c.en)}</span></h2>
        <h3 class="sub">상징 해설</h3><p>${esc(c.desc)}</p>
        <h3 class="sub">키워드</h3>
        <div class="kw"><div class="${!rev?'hl':''}"><span class="mark up">▲</span>${kwChips(c.ku,'up')}</div>
        <div class="${rev?'hl':''}"><span class="mark rev">▼</span>${kwChips(c.kr,'rev')}</div></div>
        <h3 class="sub">영역별 해설 <span class="muted small">— 영역을 눌러 바꿔 보세요</span></h3>
        <div class="tabs" role="tablist">${CATS.map((x,j)=>`<button role="tab" aria-selected="${j===cat}" class="${j===cat?'on':''}" data-cat="${j}">${x.icon} ${x.ko}</button>`).join('')}</div>
        <div class="reading">
          <p class="r-meta">${K.icon} <b>${K.ko}</b> <span class="muted">· HR: ${K.hr} · ${rev?'역방향':'정방향'}</span></p>
          <p class="r-text">${esc(row[rev?2:0])}</p>
          <p class="r-act"><span class="mark act">➶ 행동</span> ${esc(row[rev?3:1])}</p>
          <p class="r-q"><b>성찰 질문</b> ${esc(K.q)}</p>
        </div>
        <details class="other"><summary>${rev?'정방향':'역방향'} 의미 함께 보기</summary>
          <p class="r-text">${esc(row[rev?0:2])}</p><p class="r-act"><span class="mark act">➶ 행동</span> ${esc(row[rev?1:3])}</p></details>
      </div>
    </div>
  </div>`;
  const first=$('.m-x',m);if(first&&!m.dataset.focused){first.focus();m.dataset.focused='1'}
}
document.addEventListener('click',e=>{
  const t=e.target;
  const open=t.closest('[data-open]');
  if(open){openCard(open.dataset.open,{siblings:open.closest('#grid,.journey,.num-strip')?null:undefined});return}
  if(!modalState)return;
  if(t.closest('[data-close]')){closeModal();return}
  const r=t.closest('[data-rev]');if(r){modalState.rev=r.dataset.rev==='1';renderModal();return}
  const ct=t.closest('[data-cat]');if(ct){modalState.cat=+ct.dataset.cat;renderModal();return}
  if(t.closest('[data-studied]')){Store.Studied.toggle(modalState.id);window.dispatchEvent(new Event('studied-changed'));renderModal();return}
  const st=t.closest('[data-step]');if(st){const sib=modalState.siblings,i=sib.indexOf(modalState.id)+(+st.dataset.step);if(sib[i]){modalState.id=sib[i];renderModal();$('.m-box').scrollTop=0}return}
});
document.addEventListener('keydown',e=>{
  if(!modalState)return;
  if(e.key==='Escape')closeModal();
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const sib=modalState.siblings,i=sib.indexOf(modalState.id)+(e.key==='ArrowRight'?1:-1);if(sib[i]){modalState.id=sib[i];renderModal()}}
});

/* ---------- 도표 컴포넌트 (보드·도표 페이지 공용) ---------- */
function chElementTable(){
  return `<div class="table-wrap"><table class="tbl"><thead><tr><th>수트</th><th>원소</th><th>주제</th><th>HR 적용</th></tr></thead><tbody>
  ${SUIT_ORDER.map(s=>{const S=SUITS[s];return `<tr><td style="color:${S.color}"><b>${elSvg(s,18)} ${S.ko}</b></td><td>${S.el}<br><span class="muted small">${S.elEn}</span></td><td>${esc(S.theme)}</td><td>${esc(S.hr)}</td></tr>`}).join('')}</tbody></table></div>`;
}
function chNumbers(){
  return `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>숫자</th><th>흐름 키워드</th></tr></thead><tbody>
  ${NUMBERS.map(n=>`<tr><td><b>${n.n<=10?(n.n===1?'에이스(1)':n.n):n.ko}</b></td><td>${n.kw}</td></tr>`).join('')}</tbody></table></div>`;
}
function chLadder(counts){
  const max=Math.max(1,...Object.values(counts||{}));
  const major=DECK.filter(c=>c.suit==='major');
  return `<div class="ladder">${JOURNEY.map(j=>`<div class="j-row"><div class="j-h"><b>${j.ko}</b></div><div class="j-cells">
    ${major.filter(c=>c.no>=j.range[0]&&c.no<=j.range[1]).map(c=>{const n=(counts&&counts[c.id])||0;
      return `<button class="j-cell heat" data-open="${c.id}" style="--sc:${SUITS.major.color};--a:${n?(0.18+0.72*n/max).toFixed(2):0}" title="${esc(c.ko)} ${n}회"><b>${ROMAN[c.no]}</b><span>${esc(c.ko)}</span>${n?`<em>${n}</em>`:''}</button>`}).join('')}
  </div></div>`).join('')}</div>`;
}
function chGrid(counts){
  const max=Math.max(1,...Object.values(counts||{}));
  const minors=SUIT_ORDER.slice(1);
  return `<div class="table-wrap"><table class="heat-tbl"><thead><tr><th></th>${NUMBERS.map(n=>`<th title="${n.kw}">${n.n===1?'A':n.n<=10?n.n:n.ko[0]}</th>`).join('')}</tr></thead><tbody>
  ${minors.map(s=>`<tr><th style="color:${SUITS[s].color}">${elSvg(s,16)} ${SUITS[s].short}</th>${NUMBERS.map(n=>{
    const c=DECK.find(x=>x.suit===s&&x.no===n.n);const k=(counts&&counts[c.id])||0;
    return `<td><button data-open="${c.id}" class="hc-cell" style="--sc:${SUITS[s].color};--a:${k?(0.18+0.72*k/max).toFixed(2):0}" title="${esc(c.ko)} ${k}회">${k||''}</button></td>`}).join('')}</tr>`).join('')}
  </tbody></table></div><p class="muted small">열: A=에이스, 2–10, 페(이지)·나(이트)·퀸·킹. 칸이 진할수록 많이 뽑힌 카드입니다.</p>`;
}
function hbars(items,total){
  const max=Math.max(1,...items.map(i=>i.v));
  return `<div class="hbars">${items.map(i=>`<div class="hb"><span class="hb-l">${i.icon||''} ${esc(i.l)}</span><div class="hb-t"><i style="width:${total?pct(i.v,max):0}%;background:${i.color||'var(--gold)'}"></i></div><span class="hb-v">${i.v}${total?` <small>(${pct(i.v,total)}%)</small>`:''}</span></div>`).join('')}</div>`;
}

/* ---------- 도표 페이지 ---------- */
function vCharts(){
  app.innerHTML=`
  <header class="page-h"><p class="eyebrow">Reference</p><h1>교재 도표 모음</h1>
  <p class="lead">원소표, 숫자 흐름, 바보의 여정, 영역 도표를 한곳에 모았습니다. 칸을 누르면 해당 카드가 열립니다.</p></header>
  <section><h2>1. 수트 · 원소표</h2>${chElementTable()}</section>
  <section class="two"><div><h2>2. 숫자 흐름표 (마이너)</h2>${chNumbers()}</div>
  <div><h2>3. 마이너 아르카나 지도</h2><p class="muted small">4개 수트 × 14장. 같은 열은 비슷한 단계입니다.</p>${chGrid(null)}</div></section>
  <section><h2>4. 바보의 여정 (메이저 22장)</h2>${chLadder(null)}</section>
  <section><h2>5. 읽기 영역 8가지</h2><div class="cat-grid">${CATS.map(c=>`<div class="cat-card"><div class="ico">${c.icon}</div><b>${c.ko}</b><span class="muted small">${c.en}</span><span class="hrtag">${c.hr}</span></div>`).join('')}</div></section>
  <section><h2>6. 표식 안내</h2><div class="legend">
    <div><span class="mark up">▲</span> 정방향</div><div><span class="mark rev">▼</span> 역방향</div><div><span class="mark act">➶</span> 실천 행동</div>
    <div>${SUIT_ORDER.map(s=>`<span style="color:${SUITS[s].color};margin-right:12px">${elSvg(s,18)} ${SUITS[s].short}</span>`).join('')}</div></div></section>`;
}

/* ---------- 실습 ---------- */
function shuffleIds(){
  const a=DECK.map(c=>c.id),r=new Uint32Array(a.length);
  (window.crypto||window.msCrypto).getRandomValues(r);
  for(let i=a.length-1;i>0;i--){const j=r[i]%(i+1);[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function vPractice(){
  const prof=Store.Profile.get();
  const st={spread:'one',cat:1,drawn:null,flipped:[],saved:false};
  const rBit=()=>{const r=new Uint8Array(1);crypto.getRandomValues(r);return r[0]&1};
  const k=()=>st.spread==='three'?3:1;
  function draw(){
    const ids=shuffleIds().slice(0,k());
    st.drawn=ids.map(id=>({id,rev:!!rBit()}));st.flipped=ids.map(()=>false);st.saved=false;paint();
  }
  function paint(){
    const done=st.drawn&&st.flipped.every(Boolean);
    app.innerHTML=`
    <header class="page-h"><p class="eyebrow">Hands-on Lab</p><h1>카드 뽑기 실습</h1>
    <p class="lead">주제 영역을 정하고 카드를 뽑아, 해당 영역의 해설과 행동을 읽어 보세요. 마지막에 한 줄 성찰을 적어 함께 공유합니다.</p></header>
    <section class="panel setup">
      <div class="f-row"><label>닉네임<input id="nick" maxlength="16" value="${esc(prof.nick)}" placeholder="예) 민준 (실명 불필요)"></label>
      <label>세션 코드<input id="sess" maxlength="24" value="${esc(prof.session)}" placeholder="강사가 알려준 코드"></label></div>
      <div class="f-row"><div><span class="lbl">스프레드</span><div class="seg" role="group">
        <button data-spread="one" class="${st.spread==='one'?'on':''}">1장 · 오늘의 거울</button>
        <button data-spread="three" class="${st.spread==='three'?'on':''}">3장 · 상황-도전-행동</button></div></div></div>
      <div><span class="lbl">읽을 영역 <span class="muted small">(HR 번역)</span></span>
        <div class="tabs wrap">${CATS.map((c,j)=>`<button class="${j===st.cat?'on':''}" data-pcat="${j}">${c.icon} ${c.ko}<small>${c.hr}</small></button>`).join('')}</div>
        <p class="muted small">성찰 질문 — ${esc(CATS[st.cat].q)}</p></div>
      <div class="cta left"><button class="btn primary" data-draw>${st.drawn?'다시 섞어 뽑기':'카드 섞고 뽑기'}</button></div>
    </section>
    ${st.drawn?`<section><h2>펼쳐진 카드 <span class="muted small">— 카드를 눌러 뒤집으세요</span></h2>
      <div class="spread">${st.drawn.map((d,i)=>`<div class="slot">
        ${st.spread==='three'?`<div class="pos">${i+1}. ${THREE_POS[i]}</div>`:''}
        <button class="flip ${st.flipped[i]?'on':''}" data-flip="${i}" aria-label="${st.flipped[i]?BY_ID[d.id].ko:(i+1)+'번째 카드 뒤집기'}">
          <div class="flip-in"><div class="f-back">${cardBack('눌러서 뒤집기')}</div><div class="f-front">${cardFace(BY_ID[d.id],{rev:d.rev})}</div></div></button></div>`).join('')}</div></section>`:''}
    ${st.drawn?st.drawn.map((d,i)=>{if(!st.flipped[i])return '';const c=BY_ID[d.id],row=c.s[st.cat];
      return `<section class="panel reading-p" style="--sc:${SUITS[c.suit].color}">
        <p class="eyebrow">${st.spread==='three'?THREE_POS[i]+' · ':''}${CATS[st.cat].ko} 영역</p>
        <h3>${esc(c.ko)} <span class="en">${esc(c.en)}</span> <span class="mark ${d.rev?'rev':'up'}">${d.rev?'▼ 역방향':'▲ 정방향'}</span></h3>
        <div class="chips">${kwChips(d.rev?c.kr:c.ku,d.rev?'rev':'up')}</div>
        <p class="r-text">${esc(row[d.rev?2:0])}</p>
        <p class="r-act"><span class="mark act">➶ 행동</span> ${esc(row[d.rev?3:1])}</p>
        <button class="btn small" data-detail="${c.id}" data-drev="${d.rev?1:0}">카드 전체 해설 열기</button></section>`}).join(''):''}
    ${done?`<section class="panel share">
      <h2>한 줄 성찰 & 공유</h2>
      <label>오늘 내 일에 적용할 한 가지 (최대 ${CFG.maxNoteLength||280}자)
      <textarea id="note" maxlength="${CFG.maxNoteLength||280}" rows="3" placeholder="예) 이번 주 회의에서 내 의견을 한 문장으로 먼저 말하기"></textarea></label>
      <p class="muted small">공유하면 같은 세션 코드를 쓰는 모두가 닉네임·카드·성찰을 볼 수 있습니다. 개인정보나 민감한 내용은 적지 마세요.${Store.isRemote?'':' <b>(현재 로컬 모드: 이 브라우저에서만 보입니다)</b>'}</p>
      <div class="cta left"><button class="btn primary" data-save ${st.saved?'disabled':''}>${st.saved?'공유 완료 ✓':'결과 보드에 공유'}</button>
      ${st.saved?'<a class="btn" href="#/board">결과 보드 보기 →</a>':''}</div><p id="msg" class="muted small" role="status"></p></section>`:''}`;
  }
  paint();
  const onClick=async e=>{
    const t=e.target;
    if(t.closest('[data-spread],[data-pcat],[data-flip]'))syncProfile();
    const sp=t.closest('[data-spread]');if(sp){st.spread=sp.dataset.spread;st.drawn=null;paint();return}
    const pc=t.closest('[data-pcat]');if(pc){st.cat=+pc.dataset.pcat;paint();return}
    if(t.closest('[data-draw]')){syncProfile();draw();return}
    const fl=t.closest('[data-flip]');if(fl){const i=+fl.dataset.flip;st.flipped[i]=true;paint();return}
    const dt=t.closest('[data-detail]');if(dt){openCard(dt.dataset.detail,{rev:dt.dataset.drev==='1',cat:st.cat,siblings:[dt.dataset.detail]});return}
    if(t.closest('[data-save]')){
      syncProfile();const p=Store.Profile.get();const msg=$('#msg');
      if(!p.nick){msg.textContent='닉네임을 입력해 주세요.';return}
      try{
        await Store.add(p.session,{nick:p.nick,spread:st.spread,cat:st.cat,cards:st.drawn,note:($('#note')||{}).value||''});
        st.saved=true;paint();
      }catch(err){msg.textContent=err.message||'저장에 실패했습니다.'}
    }
  };
  function syncProfile(){const n=$('#nick'),s=$('#sess');if(n||s)Object.assign(prof,Store.Profile.set({nick:n?n.value:prof.nick,session:s?s.value:prof.session}))}
  app.addEventListener('click',onClick);
  cleanup=()=>app.removeEventListener('click',onClick);
}

/* ---------- 결과 보드 ---------- */
function vBoard(qs){
  const prof=Store.Profile.get();
  let session=Store.cleanCode(qs.get('s')||prof.session),showSample=false,records=[],unsub=null,err='';
  const summary=recs=>{
    const flat=recs.flatMap(r=>r.cards.map(c=>({...c,cat:r.cat,card:BY_ID[c.id]})));
    const counts={};flat.forEach(f=>counts[f.id]=(counts[f.id]||0)+1);
    const bySuit=SUIT_ORDER.map(s=>({l:SUITS[s].ko,v:flat.filter(f=>f.card.suit===s).length,color:SUITS[s].color,icon:elSvg(s,16)}));
    const rev=flat.filter(f=>f.rev).length,up=flat.length-rev;
    const byCat=CATS.map((c,j)=>({l:c.ko+' · '+c.hr,v:recs.filter(r=>r.cat===j).length,icon:c.icon}));
    return {flat,counts,bySuit,rev,up,byCat};
  };
  function paint(){
    const recs=showSample?records.concat(Store.makeSamples(DECK,14)):records;
    const S=summary(recs);
    const feed=recs.slice(0,CFG.maxFeed||60);
    $('#bd').innerHTML=`
    <div class="stat-row"><div class="stat"><b>${recs.length}</b><span>공유된 리딩</span></div><div class="stat"><b>${S.flat.length}</b><span>뽑힌 카드</span></div>
    <div class="stat"><b>${new Set(recs.map(r=>r.nick)).size}</b><span>참여자</span></div><div class="stat"><b>${S.flat.length?pct(S.rev,S.flat.length):0}%</b><span>역방향 비율</span></div></div>
    ${recs.length?`
    <section class="two"><div class="panel"><h3>수트 분포</h3>${hbars(S.bySuit,S.flat.length)}</div>
      <div class="panel"><h3>정방향 ▲ vs 역방향 ▼</h3>
        <div class="stack"><i class="up" style="width:${pct(S.up,S.flat.length)}%">▲ ${S.up}</i><i class="rev" style="width:${pct(S.rev,S.flat.length)}%">▼ ${S.rev}</i></div>
        <p class="muted small">역방향은 부정이 아니라 "다시 점검할 신호"입니다. 비율 자체를 토론 소재로 삼아 보세요.</p>
        <h3>선택한 읽기 영역</h3>${hbars(S.byCat,recs.length)}</div></section>
    <section><h2>메이저 사다리 — 바보의 여정</h2>${chLadder(S.counts)}</section>
    <section><h2>마이너 지도 — 수트 × 숫자</h2>${chGrid(S.counts)}</section>
    <section><h2>최근 결과</h2><div class="feed">${feed.map(r=>`
      <article class="post ${Store.isMine(r.id)?'mine':''} ${r.sample?'sample':''}">
        <header><b>${esc(r.nick)}</b>${Store.isMine(r.id)?'<span class="tag">나</span>':''}${r.sample?'<span class="tag s">예시</span>':''}
        <span class="muted small">${CATS[r.cat].icon} ${CATS[r.cat].ko} · ${r.spread==='three'?'3장':'1장'} · ${new Date(r.ts).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span></header>
        <div class="mini-row">${r.cards.map((c,i)=>{const cd=BY_ID[c.id];return `<button class="mini" data-open="${c.id}" data-orev="${c.rev?1:0}" style="--sc:${SUITS[cd.suit].color}" title="${esc(cd.ko)}">
          ${r.spread==='three'?`<small>${THREE_POS[i]}</small>`:''}${cardFace(cd,{rev:c.rev,size:'sm'})}</button>`}).join('')}</div>
        ${r.note?`<p class="note-t">“${esc(r.note)}”</p>`:''}
      </article>`).join('')}</div></section>`:
    `<div class="empty"><p><b>아직 공유된 결과가 없습니다.</b></p><p class="muted">실습에서 카드를 뽑고 공유하면 이곳에 모입니다.</p>
      <div class="cta"><a class="btn primary" href="#/practice">카드 뽑으러 가기</a></div></div>`}`;
    $('#status').innerHTML=err?`<span class="warn">⚠ ${esc(err)}</span>`:`<span class="live">● ${Store.isRemote?'실시간 공유 중':'로컬 모드'}</span>`;
  }
  app.innerHTML=`
  <header class="page-h"><p class="eyebrow">Shared Board</p><h1>결과 보드</h1>
  <p class="lead">같은 세션 코드를 쓰는 수강생들의 리딩을 모아 도표로 비교합니다.</p></header>
  <section class="panel board-ctl">
    <label>세션 코드<input id="bs" value="${esc(session)}" maxlength="24"></label>
    <button class="btn" id="go">보드 열기</button>
    <label class="chk"><input type="checkbox" id="smp"> 예시 데이터 겹쳐 보기 <span class="muted small">(시연용, 저장 안 됨)</span></label>
    <span id="status" class="status"></span>
  </section>
  ${Store.isRemote?'':`<div class="banner">현재 <b>로컬 모드</b>입니다. 수강생 간 실시간 공유를 하려면 <code>config.js</code>에 Firebase 주소를 넣으세요. (README 참고)</div>`}
  <div id="bd"></div>`;
  function start(){
    if(unsub)unsub();err='';
    unsub=Store.subscribe(session,DECK_IDS,r=>{records=r;err='';paint()},e=>{err=e.message;paint()});
  }
  $('#go').addEventListener('click',()=>{session=Store.cleanCode($('#bs').value);Store.Profile.set({session});history.replaceState(null,'','#/board?s='+encodeURIComponent(session));start()});
  $('#bs').addEventListener('keydown',e=>{if(e.key==='Enter')$('#go').click()});
  $('#smp').addEventListener('change',e=>{showSample=e.target.checked;paint()});
  start();
  cleanup=()=>{if(unsub)unsub()};
}
/* 보드의 미니카드 → 모달(방향 반영) */
document.addEventListener('click',e=>{
  const m=e.target.closest('.mini[data-open]');
  if(m){e.stopImmediatePropagation();openCard(m.dataset.open,{rev:m.dataset.orev==='1',siblings:[m.dataset.open]})}
},true);

window.addEventListener('hashchange',route);
renderNav('#/');
route();
})();
