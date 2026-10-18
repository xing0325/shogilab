// Coordinates are from Black's perspective. White rotates BOTH axes by 180°.
const W=[[0,-1],[1,0],[0,1],[-1,0]], F=[[-1,-1],[1,-1],[1,1],[-1,1]], K=[...W,...F];
const scale=(vs,n)=>vs.map(([x,y])=>[x*n,y*n]);
const atoms={W,F,K,R:W,B:F,Q:K,D:scale(W,2),A:scale(F,2),H:scale(W,3),G:scale(F,3),N:[[-1,-2],[1,-2],[-2,-1],[2,-1],[-2,1],[2,1],[-1,2],[1,2]]};
function direction(mod,x,y){
  if(!mod)return true;
  if(mod==='ff')return y<0&&Math.abs(y)>Math.abs(x);
  if(mod==='bb')return y>0&&Math.abs(y)>Math.abs(x);
  if(/^[fb][lr]$/.test(mod))return (mod[0]==='f'?y<0:y>0)&&(mod[1]==='l'?x<0:x>0);
  return [...mod].some(c=>({f:y<0,b:y>0,l:x<0,r:x>0,v:y!==0,s:x!==0})[c]);
}
export function compile(notation){
  if(!notation || !/^(?:[fblrvs]*[WFKRBQDAHGN][1-9]?)+$/.test(notation))return null;
  // These two published strings contain an ambiguous doubled W; don't infer a rule.
  if(notation.includes('WW'))return null;
  const result=[];
  for(const [,mod,atom,count] of notation.matchAll(/([fblrvs]*)([WFKRBQDAHGN])([1-9]?)/g)){
    const leap='DAHGN'.includes(atom);
    if(leap&&count)return null;
    for(const [dx,dy] of atoms[atom])if(atom==='N'&&mod==='v'?Math.abs(dy)>Math.abs(dx):direction(mod,dx,dy))result.push({dx,dy,range:count?Number(count):('RBQ'.includes(atom)?99:1),leap});
  }
  return result;
}
export function makeCatalog(rows){
  // BP uses a standard one-step king. Other corrections follow source prose/diagrams.
  const corrections={'king':'K','cloud-eagle':'sWfB3vR','goose-wing':'FsR3vR'};
  const catalog=Object.fromEntries(rows.map(p=>[p.id,{...p,notation:corrections[p.id]||p.notation,rules:compile(corrections[p.id]||p.notation)}]));
  for(const p of Object.values(catalog))p.playable=Boolean(p.original&&p.rules&&(!p.promotion||catalog[p.promotion]?.rules));
  return catalog;
}
export const LEGACY_DRAFT=[...sequence('ban','ABABAB',1),...sequence('pick','ABBAAB',1),...sequence('ban','BABA',2),...sequence('pick','BAAB',2)];
export const DRAFT=sequence('pick','ABBAABBAAB',1);
export const draftSteps=s=>s.version===1?LEGACY_DRAFT:DRAFT;
function sequence(type,s,round){return [...s].map(c=>({type,side:c==='A'?0:1,round}));}
export function randomPool(catalog,seed,size=16){
  const list=Object.values(catalog).filter(p=>p.playable&&p.id!=='king'&&p.id!=='crown-prince').map(p=>p.id);
  let hash=2166136261;for(const c of String(seed))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  const random=()=>{hash=(hash+0x6D2B79F5)|0;let t=Math.imul(hash^(hash>>>15),1|hash);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
  for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  if(list.length<size)throw Error('可用棋子不足');return list.slice(0,size);
}
export function newGame(catalog,seed){return {version:2,mode:'draft',seed,pool:randomPool(catalog,seed),phase:'draft',draft:[],picks:[[],[]],bans:[[],[]],board:Array(25).fill(null),placement:0,turn:0,ply:0,log:[],winner:null,lastMove:null};}
export function draftChoice(state,id){
  const steps=draftSteps(state),step=steps[state.draft.length];
  if(state.phase!=='draft'||!step||!state.pool.includes(id)||state.draft.some(d=>d.id===id))throw Error('这枚棋子已被选择或禁用');
  const s=structuredClone(state);s.draft.push({...step,id});s[step.type==='pick'?'picks':'bans'][step.side].push(id);
  s.log.push(`${sideName(step.side)}${step.type==='pick'?'选取':'禁用'} ${id}`);
  if(s.draft.length===steps.length)s.phase='placement';return s;
}
export function sideName(side){return side===0?'先手':'后手';}
export function roster(s,side){return ['king',...s.picks[side]];}
export function deploy(s,id,to){
  const side=s.placement%2;
  if(s.phase!=='placement'||!Number.isInteger(to)||to<0||to>24||s.board[to]||!roster(s,side).includes(id)||s.board.some(p=>p?.side===side&&p.base===id))throw Error('请选择尚未布阵的棋子与空格');
  if(side===0?to<15:to>=10)throw Error('只能放在己方两排');
  const next=structuredClone(s);next.board[to]={id,base:id,side,promoted:false};next.placement++;
  if(next.placement===12){next.phase='play';next.log.push('布阵完成 · 先手行棋');}return next;
}
export function moves(board,from,catalog){
  const piece=board[from];if(!piece)return [];
  const rules=catalog[piece.id]?.rules;if(!rules)return [];
  const x=from%5,y=Math.floor(from/5),sign=piece.side===0?1:-1,targets=new Set();
  for(const {dx,dy,range} of rules){
    for(let n=1;n<=Math.min(range,4);n++){
      const tx=x+dx*n*sign,ty=y+dy*n*sign;if(tx<0||tx>4||ty<0||ty>4)break;
      const to=ty*5+tx,target=board[to];
      if(target?.side===piece.side)break;
      targets.add(to);if(target)break;
    }
  }return [...targets];
}
export function isRoyal(p){return p&&['king','crown-prince'].includes(p.id);}
export function move(s,from,to,catalog){
  if(s.phase!=='play'||s.board[from]?.side!==s.turn||!moves(s.board,from,catalog).includes(to))throw Error('不能这样走');
  const next=structuredClone(s),p=next.board[from],captured=next.board[to],before=p.id;
  next.board[to]=p;next.board[from]=null;
  if(captured&&!p.promoted&&catalog[p.id].promotion){p.id=catalog[p.id].promotion;p.promoted=true;}
  next.ply++;next.lastMove=[from,to];next.log.push(`${sideName(p.side)} ${catalog[before].name} ${coord(from)}→${coord(to)}${captured?' 吃 '+catalog[captured.id].name:''}${before!==p.id?' · 升变 '+catalog[p.id].name:''}`);
  next.turn=1-next.turn;
  if(!next.board.some(q=>q?.side===next.turn&&isRoyal(q))){next.phase='over';next.winner=p.side;}
  // No legal moves: loss, documented as the prototype's adjudication convention.
  else if(!next.board.some((q,i)=>q?.side===next.turn&&moves(next.board,i,catalog).length)){next.phase='over';next.winner=p.side;next.log.push('无可行棋步，判负');}
  return next;
}
export function coord(i){return `${'ABCDE'[i%5]}${5-Math.floor(i/5)}`;}
export function describe(p){
  if(!p.rules)return '特殊走法尚未实现，本版不进入随机池。';
  const dirs={'0,-1':'前','0,1':'后','-1,0':'左','1,0':'右','-1,-1':'左前','1,-1':'右前','-1,1':'左后','1,1':'右后'};
  const groups=new Map();
  for(const r of p.rules){
    const range=r.leap?'跳跃':r.range===99?'不限格':r.range===1?'一格':`最多${r.range}格`;
    const name=dirs[`${Math.sign(r.dx)},${Math.sign(r.dy)}`]+(r.leap?`(${Math.abs(r.dx)},${Math.abs(r.dy)})`:'');
    if(!groups.has(range))groups.set(range,[]);groups.get(range).push(name);
  }
  return [...groups].map(([r,d])=>`${[...new Set(d)].join('、')}：${r}`).join('；')+'。';
}
