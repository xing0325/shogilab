import {compile} from './engine.js';
const rows=[
 ['s-king','王将','OU','K',null],['s-rook','飛車','HI','R','s-dragon'],['s-bishop','角行','KA','B','s-horse'],['s-gold','金将','KI','WfF',null],['s-silver','銀将','GI','FfW','s-promoted-silver'],['s-knight','桂馬','KE','ffN','s-promoted-knight'],['s-lance','香車','KY','fR','s-promoted-lance'],['s-pawn','歩兵','FU','fW','s-tokin'],['s-dragon','龍王','RY','RF',null],['s-horse','龍馬','UM','BW',null],['s-promoted-silver','成銀','NG','WfF',null],['s-promoted-knight','成桂','NK','WfF',null],['s-promoted-lance','成香','NY','WfF',null],['s-tokin','と金','TO','WfF',null],
 ['c-king','王','K','K',null],['c-queen','后','Q','Q',null],['c-rook','车','R','R',null],['c-bishop','象','B','B',null],['c-knight','马','N','N',null],['c-pawn','兵','P','fW','c-queen']];
export const versusCatalog=Object.fromEntries(rows.map(([id,name,asset,notation,promotion],i)=>[id,{id,name,asset,notation,promotion,original:i<8||i>=14,mode:'versus',faction:id.startsWith('c-')?'chess':'shogi',english:({'K':'King','Q':'Queen','R':'Rook','B':'Bishop','N':'Knight','P':'Pawn'})[asset]||name,romaji:'',rules:compile(notation),playable:false}]));
export const hybridName=side=>side===0?'将棋方':'国象方';
const idx=(x,y)=>y*9+x,inside=(x,y)=>x>=0&&x<9&&y>=0&&y<9;
const royal=p=>p&&['s-king','c-king'].includes(p.id);
export function newVersus(seed=''){
 const s={version:3,royalRule:'capture-all',mode:'versus',seed,phase:'play',board:Array(81).fill(null),turn:0,ply:0,log:[],winner:null,lastMove:null,hands:[[],[]],enPassant:null,draft:[],picks:[[],[]],bans:[[],[]],placement:0,pool:[]};
 const put=(id,x,y,side)=>s.board[idx(x,y)]={id,base:id,side,promoted:false,moved:false};
 ['lance','knight','silver','gold','king','gold','silver','knight','lance'].forEach((p,x)=>put('s-'+p,x,8,0));
 put('s-rook',7,7,0);put('s-bishop',1,7,0);for(let x=0;x<9;x++)put('s-pawn',x,6,0);
 ['rook','knight','bishop','king','queen','king','bishop','knight','rook'].forEach((p,x)=>{put('c-'+p,x,0,1);put('c-pawn',x,1,1);});return s;
}
function pseudo(s,from,attacks=false){
 const p=s.board[from];if(!p)return[];const x=from%9,y=Math.floor(from/9),sign=p.side===0?1:-1,d=-sign,out=[];
 const add=(tx,ty)=>{if(!inside(tx,ty))return;const to=idx(tx,ty);if(attacks||s.board[to]?.side!==p.side)out.push(to);};
 if(p.id==='c-pawn'){
  for(const dx of [-1,1]){const tx=x+dx,ty=y+d;if(!inside(tx,ty))continue;const to=idx(tx,ty);if(attacks||s.board[to]?.side===1-p.side||s.enPassant?.to===to)add(tx,ty);}
  if(!attacks&&inside(x,y+d)&&!s.board[idx(x,y+d)]){add(x,y+d);if(!p.moved&&y===(p.side===1?1:7)&&!s.board[idx(x,y+2*d)])add(x,y+2*d);}
 }else for(const r of versusCatalog[p.id].rules)for(let n=1;n<=Math.min(r.range,8);n++){
  const tx=x+r.dx*n*sign,ty=y+r.dy*n*sign;if(!inside(tx,ty))break;add(tx,ty);if(s.board[idx(tx,ty)])break;
 }
 return out;
}
export function attacked(s,to,by){return s.board.some((p,i)=>p?.side===by&&pseudo(s,i,true).includes(to));}
export function inCheck(s,side){const kings=s.board.flatMap((p,i)=>p?.side===side&&royal(p)?[i]:[]);return !kings.length||kings.some(i=>attacked(s,i,1-side));}
function castleOptions(s,from){const y=Math.floor(from/9),x=from%9;if(s.royalRule==='capture-all')return x===3?[[0,1,[1,2],[2,1]]]:x===5?[[8,7,[6,7],[6,7]]]:[];return x===4?[[0,2,[1,2,3],[3,2]],[7,6,[5,6],[5,6]]]:[];}
function castles(s,from){const p=s.board[from];if(p?.id!=='c-king'||p.moved||inCheck(s,p.side))return[];const y=Math.floor(from/9);return castleOptions(s,from).filter(([r,to,empty,safe])=>{const rook=s.board[idx(r,y)];return rook?.id==='c-rook'&&rook.side===p.side&&!rook.moved&&empty.every(x=>!s.board[idx(x,y)])&&safe.every(x=>{const t=structuredClone(s);t.board[idx(x,y)]=t.board[from];t.board[from]=null;return !inCheck(t,p.side);});}).map(([,to])=>idx(to,y));}
function apply(s,from,to,promotion){
 const t=structuredClone(s),p=t.board[from],captured=t.board[to];t.enPassant=null;
 if(p.id==='c-pawn'&&s.enPassant?.to===to&&!captured){const victim=t.board[s.enPassant.victim];if(p.side===0&&victim)t.hands[0].push(victim.base);t.board[s.enPassant.victim]=null;}
 if(captured&&p.side===0&&!royal(captured))t.hands[0].push(captured.base);
 if(p.id==='c-king'&&Math.abs(to-from)===2){const y=Math.floor(from/9),r=idx(s.royalRule==='capture-all'?(to>from?8:0):(to>from?7:0),y),dest=to>from?to-1:to+1;t.board[dest]=t.board[r];t.board[r]=null;t.board[dest].moved=true;}
 if(p.id==='c-pawn'&&Math.abs(to-from)===18)t.enPassant={to:(to+from)/2,victim:to};
 t.board[to]=p;t.board[from]=null;p.moved=true;if(promotion){p.id=promotion;p.promoted=true;}
 t.lastMove=[from,to];return t;
}
export function legalMoves(s,from){const p=s.board[from];if(!p||s.phase!=='play'||p.side!==s.turn)return[];return [...pseudo(s,from),...castles(s,from)].filter(to=>s.royalRule==='capture-all'||(!royal(s.board[to])&&!inCheck(apply(s,from,to),p.side)));}
export function promotionChoices(s,from,to){const p=s.board[from],y=Math.floor(to/9),fy=Math.floor(from/9);if(p.id==='c-pawn'&&y===(p.side===0?0:8))return['c-queen','c-rook','c-bishop','c-knight'];const promo=versusCatalog[p.id].promotion;if(!promo||p.id.startsWith('c-'))return[];const zone=r=>p.side===0?r<=2:r>=6;if(!zone(y)&&!zone(fy))return[];const last=p.side===0?y:y===8?0:8-y;const force=['s-pawn','s-lance'].includes(p.id)&&last===0||p.id==='s-knight'&&last<2;return force?[promo]:[null,promo];}
export function legalDrops(s,id,skipMate=false){
 if(s.phase!=='play'||s.turn!==0||!s.hands[0].includes(id))return[];const out=[];
 for(let to=0;to<81;to++){if(s.board[to])continue;const y=Math.floor(to/9),x=to%9;if((['s-pawn','s-lance','c-pawn'].includes(id)&&y===0)||(id==='s-knight'&&y<2))continue;
 if(id==='s-pawn'&&s.board.some((p,i)=>p?.side===0&&p.id==='s-pawn'&&i%9===x))continue;
 const t=structuredClone(s);t.board[to]={id,base:id,side:0,moved:true,promoted:false};if(s.royalRule!=='capture-all'&&inCheck(t,0))continue;
 if(s.royalRule!=='capture-all'&&id==='s-pawn'&&!skipMate){t.turn=1;if(inCheck(t,1)&&!hasAction(t,true))continue;}out.push(to);
 }return out;
}
function hasAction(s,skipMate=false){return s.board.some((p,i)=>p?.side===s.turn&&legalMoves(s,i).length)||(s.turn===0&&[...new Set(s.hands[0])].some(id=>legalDrops(s,id,skipMate).length));}
function finish(t){t.ply++;t.turn=1-t.turn;if(t.royalRule==='capture-all'&&!t.board.some(p=>p?.side===t.turn&&royal(p))){t.phase='over';t.winner=1-t.turn;t.log.push(hybridName(t.winner)+'吃掉全部王获胜');return t;}if(!hasAction(t)){t.phase='over';t.winner=t.royalRule==='capture-all'||inCheck(t,t.turn)?1-t.turn:null;t.log.push(t.winner===null?'无合法走法 · 和棋':hybridName(t.winner)+(t.royalRule==='capture-all'?'获胜 · 对方无合法走法':'将死获胜'));}return t;}
export function versusMove(s,from,to,promotion){if(!legalMoves(s,from).includes(to))throw Error('这步会让王受攻击，或不符合走法');const options=promotionChoices(s,from,to);if(options.length&&!options.includes(promotion))throw Error('请选择升变形态');if(!options.length&&promotion)throw Error('此处不能升变');const t=apply(s,from,to,promotion);t.log.push(`${hybridName(s.turn)} ${versusCatalog[s.board[from].id].name} ${vCoord(from)}→${vCoord(to)}${promotion?' · 升变为'+versusCatalog[promotion].name:''}`);return finish(t);}
export function versusDrop(s,id,to){if(!legalDrops(s,id).includes(to))throw Error('此处不能打入');const t=structuredClone(s);t.hands[0].splice(t.hands[0].indexOf(id),1);t.board[to]={id,base:id,side:0,moved:true,promoted:false};t.enPassant=null;t.lastMove=[to];t.log.push(`将棋方打入 ${versusCatalog[id].name} ${vCoord(to)}`);return finish(t);}
export const vCoord=i=>'ABCDEFGHI'[i%9]+(9-Math.floor(i/9));
