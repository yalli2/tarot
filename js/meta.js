/* 수트·카테고리·숫자 등 교재 도표용 메타데이터 */
(function(){
const SUITS={
  major:{key:'major',ko:'메이저 아르카나',short:'메이저',el:'영혼',elEn:'Spirit',color:'#8a5cc2',
    theme:'인생의 큰 전환점과 원형(Archetype). 22장이 "바보의 여정"을 이룹니다.',
    hr:'커리어 전환, 가치관, 리더십 정체성처럼 방향을 바꾸는 큰 주제'},
  cups:{key:'cups',ko:'컵',short:'컵',el:'물',elEn:'Water',color:'#2f7fb8',
    theme:'감정·관계·직관·창의성. 마음이 흐르는 방식을 다룹니다.',
    hr:'팀 정서, 공감, 갈등 속 감정 다루기, 동기와 몰입'},
  wands:{key:'wands',ko:'완드',short:'완드',el:'불',elEn:'Fire',color:'#d9622b',
    theme:'열정·행동·야망·에너지. 불꽃이 어디로 향하는지를 보여줍니다.',
    hr:'추진력, 도전과제, 리더십 에너지, 번아웃의 신호'},
  swords:{key:'swords',ko:'소드',short:'소드',el:'공기',elEn:'Air',color:'#5b7a96',
    theme:'생각·소통·진실·갈등. 명료함과 날카로움을 함께 지닌 수트입니다.',
    hr:'의사결정, 커뮤니케이션, 피드백, 갈등과 스트레스'},
  pents:{key:'pents',ko:'펜타클',short:'펜타클',el:'흙',elEn:'Earth',color:'#4f8a4b',
    theme:'돈·일·건강·현실. 손에 잡히는 기반과 결과를 다룹니다.',
    hr:'보상, 직무 숙련, 자원 관리, 일과 삶의 균형'}
};
const SUIT_ORDER=['major','cups','wands','swords','pents'];

/* 교재의 8개 리딩 카테고리 → HR 현장 언어로 번역 */
const CATS=[
  {key:'begin',ko:'시작',en:'Beginnings',hr:'변화·온보딩',icon:'✺',
   q:'지금 시작하거나 마무리해야 할 변화는 무엇이고, 나는 어떤 준비 상태인가요?'},
  {key:'career',ko:'커리어',en:'Career',hr:'직무·성장',icon:'⚑',
   q:'지금 내 일에서 가장 먼저 다뤄야 할 한 가지는 무엇인가요?'},
  {key:'money',ko:'재정',en:'Money',hr:'보상·자원',icon:'◈',
   q:'시간·에너지·예산 같은 자원을 나는 어디에 쓰고 있나요?'},
  {key:'love',ko:'사랑',en:'Love',hr:'신뢰·파트너십',icon:'♡',
   q:'가장 가까운 협력 관계에서 신뢰를 높이려면 무엇이 필요한가요?'},
  {key:'social',ko:'인간관계',en:'Friends & Family',hr:'팀·동료',icon:'⚇',
   q:'동료와 팀 안에서 나는 어떤 역할이며, 무엇이 달라지면 좋을까요?'},
  {key:'health',ko:'건강',en:'Health',hr:'웰빙·번아웃',icon:'✚',
   q:'몸과 마음의 에너지를 지키기 위해 오늘 할 수 있는 작은 행동은 무엇인가요?'},
  {key:'guide',ko:'상위 안내',en:'Higher Guidance',hr:'가치·코칭',icon:'☼',
   q:'내가 중요하게 여기는 가치는 지금 내 선택과 일치하나요?'},
  {key:'outcome',ko:'결과',en:'Outcome',hr:'방향성',icon:'➶',
   q:'지금의 방식을 이어가면 어디에 닿을까요? 바꾸고 싶은 방향이 있나요?'}
];

/* 숫자(1~10)와 궁정 카드의 의미 도표 — 마이너 아르카나 읽기용 */
const NUMBERS=[
  {n:1,ko:'에이스',kw:'씨앗·시작·잠재력'},
  {n:2,ko:'2',kw:'균형·선택·파트너십'},
  {n:3,ko:'3',kw:'성장·협력·표현'},
  {n:4,ko:'4',kw:'안정·구조·정체'},
  {n:5,ko:'5',kw:'갈등·시련·변화'},
  {n:6,ko:'6',kw:'조화·이동·회복'},
  {n:7,ko:'7',kw:'평가·성찰·인내'},
  {n:8,ko:'8',kw:'숙련·움직임·집중'},
  {n:9,ko:'9',kw:'완성 직전·자립'},
  {n:10,ko:'10',kw:'완결·과잉·다음 주기'},
  {n:11,ko:'페이지',kw:'학습자·메신저·호기심'},
  {n:12,ko:'나이트',kw:'추구자·행동·돌진'},
  {n:13,ko:'퀸',kw:'성숙·내면 돌봄·깊이'},
  {n:14,ko:'킹',kw:'통달·책임·리더십'}
];

/* 바보의 여정 — 메이저 22장을 세 단계로 나눈 대표적 구분 */
const JOURNEY=[
  {ko:'1단계 · 세상을 배우다',range:[0,7],desc:'자아가 형성되고 외부 세계의 규칙·관계·책임을 배우는 시기'},
  {ko:'2단계 · 내면과 마주하다',range:[8,14],desc:'균형·시련·전환을 겪으며 내면의 힘과 그림자를 다루는 시기'},
  {ko:'3단계 · 통합하고 완성하다',range:[15,21],desc:'붕괴와 재생을 거쳐 희망·통찰·완성으로 나아가는 시기'}
];

const ROMAN=['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

window.META={SUITS,SUIT_ORDER,CATS,NUMBERS,JOURNEY,ROMAN};
})();
