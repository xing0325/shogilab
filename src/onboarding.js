const key=mode=>'shogilab-intro-v1-'+mode;
export function needsIntro(mode){try{return localStorage.getItem(key(mode))!=='seen';}catch{return false;}}
export function introOpen(){return Boolean(document.querySelector('.intro-dialog[open]'));}
const lessons={
 versus:[
  ['两套规则，正面撞上。','上方国象双王，下方将棋单王。将棋先走。','field'],
  ['吃掉的，还能再上场。','只有将棋方能打入：从持驹里拿一枚，放进空格。','drop'],
  ['越过这条线，就能变身。','将棋进入敌阵三排可升变；国象兵到对侧底线升变。','promote'],
  ['能放下，不代表能打入。','同列已有未升变将棋步，不能再打步；也不能打到无路可走的位置。','illegal'],
  ['两个王，一个都别留。','国象双王全被吃才输；将棋王被吃即输。将军可以不应。','royal']
 ],
 draft:[
  ['开战之前，先抢阵容。','16 枚随机棋子，双方轮流各选五枚。点击直接选取，按住查看走法。','pick'],
  ['你的阵，你来摆。','加上一枚固定王，双方轮流放进己方两排。','deploy'],
  ['吃第一口，就变身。','有升变形态的棋子，首次吃子自动升变一次。','capture'],
  ['别只盯着一个王。','吃掉敌方全部王族才赢。王将与太子都算；没有打入。','royal']
 ]
};
function piece(id,cls='',style=''){return `<i class="intro-token ${cls}" style="${style}" aria-hidden="true">${(id.startsWith('c-')||id.startsWith('w-'))?`<img src="/vendor/lichess/piece/cburnett/${id.startsWith('w-')?'w':'b'}${id.slice(2)}.svg" alt="">`:`<img src="/vendor/lishogi/pieces/0${id}.svg" alt="">`}</i>`;}
function scene(mode,type){const n=mode==='versus'?9:5;let art='';
 if(type==='pick')return `<div class="intro-pool">${Array.from({length:16},(_,i)=>`<span class="intro-pick ${i<10?'draft-selected owner-'+[0,1,1,0,0,1,1,0,0,1][i]:''}" style="--delay:${i*.12}">${piece(['HI','KA','GI','KE'][i%4])}</span>`).join('')}</div><div class="intro-team-dots"><span>● 先手</span><span>● 后手</span></div>`;
 if(mode==='versus'){
  if(['field','royal'].includes(type))art=piece('c-K','king-left','--x:3;--y:0')+piece('c-Q','','--x:4;--y:0')+piece('c-K','king-right','--x:5;--y:0')+piece('OU','shogi-king','--x:4;--y:8')+piece('HI','','--x:7;--y:7')+piece('KA','','--x:1;--y:7');
  if(type==='field'){
   art=['R','N','B','K','Q','K','B','N','R'].map((id,x)=>piece('c-'+id,id==='K'?'field-focus':'',`--x:${x};--y:0`)).join('')+Array.from({length:9},(_,x)=>piece('c-P','',`--x:${x};--y:1`)).join('')+['KY','KE','GI','KI','OU','KI','GI','KE','KY'].map((id,x)=>piece(id,id==='OU'?'field-focus':'',`--x:${x};--y:8`)).join('')+Array.from({length:9},(_,x)=>piece('FU','',`--x:${x};--y:6`)).join('')+piece('HI','','--x:7;--y:7')+piece('KA','','--x:1;--y:7');
  }
  if(type==='drop')art=piece('w-N','drop-actor','--x:4;--y:4')+'<span class="intro-landing" style="--x:4;--y:4"></span><div class="intro-pocket">持驹 '+piece('w-N')+'</div>';
  if(type==='promote')art='<div class="intro-zone">升变区</div>'+piece('KA','promote-before','--x:4;--y:2')+piece('UM','promote-after','--x:4;--y:2');
  if(type==='illegal')art='<div class="intro-file"></div>'+piece('FU','','--x:4;--y:6')+piece('FU','illegal-actor','--x:4;--y:3')+'<b class="intro-cross" style="--x:4;--y:3">×</b><div class="intro-dead-rank">底线不能打步、香、国象兵</div>';
 }else{
  if(type==='deploy')art='<div class="intro-home-zone"></div>'+piece('OU','deploy-actor','--x:2;--y:4')+piece('HI','','--x:0;--y:3')+piece('KA','','--x:4;--y:3');
  if(type==='capture')art=piece('FU','capture-victim','--x:2;--y:1')+piece('HI','capture-before','--x:2;--y:1')+piece('RY','capture-after','--x:2;--y:1');
  if(type==='royal')art=piece('OU','king-left','--x:1;--y:1')+'<span class="intro-prince king-right" style="--x:3;--y:1">太<br>子</span>'+piece('HI','','--x:2;--y:4');
 }
 return `<div class="intro-board ${mode} scene-${type}" style="--n:${n}">${Array.from({length:n*n},()=>'<span class="intro-cell"></span>').join('')}${art}</div>`;
}
export function showIntro(mode,onClose=()=>{}){if(introOpen())return;let step=0;const steps=lessons[mode],el=document.createElement('dialog');el.className='intro-dialog';el.setAttribute('aria-labelledby','intro-title');document.body.append(el);
 function paint(){const [title,copy,type]=steps[step];el.innerHTML=`<header><span>${mode==='versus'?'CHESS × SHOGI':'BP 大将棋'} · ${step+1}/${steps.length}</span><button data-intro="skip">跳过</button></header><div class="intro-stage" aria-label="${title}动画示意">${scene(mode,type)}</div><div class="intro-caption" aria-live="polite"><h2 id="intro-title">${title}</h2><p>${copy}</p></div><footer><button data-intro="back" ${step===0?'disabled':''}>上一步</button><div class="intro-progress">${steps.map((_,i)=>`<i class="${i===step?'active':''}"></i>`).join('')}</div><button data-intro="next">${step===steps.length-1?'上棋盘 →':'下一步 →'}</button></footer>`;el.querySelector('[data-intro="next"]').focus({preventScroll:true});}
 function close(){try{localStorage.setItem(key(mode),'seen');}catch{}el.close();el.remove();onClose();}
 el.addEventListener('click',e=>{const action=e.target.closest('[data-intro]')?.dataset.intro;if(action==='skip'||action==='next'&&step===steps.length-1){close();return;}if(action==='next'){step++;paint();}if(action==='back'&&step){step--;paint();}});el.addEventListener('cancel',e=>{e.preventDefault();close();});paint();el.showModal();el.querySelector('[data-intro="next"]').focus();
}
