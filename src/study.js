import {moves, describe} from './engine.js';

// Demonstrations use exactly the same legal destinations as the game engine.
export function demoPosition(piece, catalog) {
  if(piece.id==='c-pawn')return {from:17,targets:[12,7,11,13],captureTargets:[11,13]};
  const fromSquare=from=>{const board=Array(25).fill(null);board[from]={id:piece.id,side:0};return moves(board,from,catalog);};
  let from=12,targets=fromSquare(from);
  if(!targets.length&&piece.rules){for(let i=0;i<25;i++){const possible=fromSquare(i);if(possible.length>targets.length){from=i;targets=possible;}}}
  return {from,targets};
}
export const demoTargets=(piece,catalog)=>demoPosition(piece,catalog).targets;
export function studyMarkup(id, catalog, token, esc, compact=false) {
  const p=catalog[id], promotion=p.promotion&&catalog[p.promotion];
  const boardFor=(q,promoted=false)=>{
    const {from,targets,captureTargets=[]}=demoPosition(q,catalog);
    return `<div class="motion-board ${q.faction==='chess'?'chess-study':''}" data-motion-piece="${q.id}" aria-label="${esc(q.name)}空棋盘走法演示"><div class="motion-grid">${Array.from({length:25},(_,i)=>`<span class="${targets.includes(i)?'reachable':''} ${i===from?'origin':''} ${captureTargets.includes(i)?'capture-target':''}">${targets.includes(i)?'•':''}</span>`).join('')}</div><div class="motion-token" style="left:${from%5*20}%;top:${Math.floor(from/5)*20}%">${token(q.id,0,promoted)}</div></div><p class="motion-description">${esc(q.id==='c-pawn'?'绿点为前进，红点为吃子。初始可走两格，可吃过路兵。':describe(q))}</p>${!q.rules?'<p class="motion-unavailable">尚无可执行走法，不播放推测动画。</p>':''}`;
  };
  return `<section class="animated-study ${compact?'compact':''}" data-study="${id}"><div class="study-heading"><div><h2>${esc(p.name)}</h2><p>${esc(p.romaji||p.english)}</p></div><button class="motion-toggle" data-motion-control="pause" aria-label="暂停动画">Ⅱ</button></div><div class="study-boards"><section><h3>本体走法 <span>↑ 先手向前</span></h3>${boardFor(p)}</section>${!compact&&promotion?`<section><h3>升变后 · ${esc(promotion.name)}</h3>${boardFor(promotion,true)}</section>`:''}</div><div class="promotion-demo"><div class="flip-stage" ><div class="flip-piece ${promotion?'can-promote':''}"><div class="flip-face">${token(id)}</div>${promotion?`<div class="flip-face flip-back">${token(promotion.id,0,true)}</div>`:''}</div></div><div><small>${promotion?(p.mode==='versus'?(p.faction==='chess'?'底线升变 · 以升后为例':'敌阵三排 · 可选升变'):'首次吃子 · 翻面升变'):'保持本体'}</small><strong>${esc(p.name)}${promotion?` <span>→</span> ${esc(promotion.name)}`:' · 不升变'}</strong><p>${promotion?'循环展示本体与升变形态':'这枚棋子没有升变形态'}</p></div></div><p class="study-note">空盘逐步演示；每次从标记起点重新出发。绿点为可达格，远行范围以文字为准。</p><div class="study-controls">${promotion?'<button class="flip-pill" data-motion-control="flip">翻面</button>':''}<button data-motion-control="replay">↻ 重播动画</button>${compact?`<a href="#piece/${id}">查看完整详情 →</a>`:''}</div></section>`;
}
export function startStudyAnimations(root,catalog) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const el of root.querySelectorAll('[data-motion-piece]')){
    const p=catalog[el.dataset.motionPiece], {from,targets}=demoPosition(p,catalog);
    if(!targets.length)continue;
    const frames=[];
    targets.forEach((to,i)=>{
      const dx=to%5-from%5,dy=Math.floor(to/5)-Math.floor(from/5),n=targets.length;
      const leap=p.rules.some(r=>r.leap&&r.dx===dx&&r.dy===dy);
      const at=t=>(i+t)/n, origin='translate(0%, 0%)',dest=`translate(${dx*100}%, ${dy*100}%)`;
      frames.push({offset:at(0),transform:origin,opacity:1},{offset:at(.16),transform:origin,opacity:1});
      if(leap)frames.push({offset:at(.38),transform:`translate(${dx*50}%, calc(${dy*50}% - 18px))`,opacity:1});
      frames.push({offset:at(.62),transform:dest,opacity:1},{offset:at(.84),transform:dest,opacity:1},{offset:at(.92),transform:dest,opacity:0},{offset:at(.94),transform:origin,opacity:0},{offset:at(1),transform:origin,opacity:1});
    });
    const a=el.querySelector('.motion-token').animate(frames,{duration:targets.length*1800,iterations:Infinity});
    if(reduced)a.pause();
  }
  for(const el of root.querySelectorAll('.flip-piece.can-promote')){
    const a=el.animate([{transform:'rotateY(0deg)',offset:0},{transform:'rotateY(0deg)',offset:.35},{transform:'rotateY(180deg)',offset:.48},{transform:'rotateY(180deg)',offset:.82},{transform:'rotateY(360deg)',offset:.95},{transform:'rotateY(360deg)',offset:1}],{duration:6000,iterations:Infinity,easing:'ease-in-out'});
    if(reduced)a.pause();
  }
  for(const study of root.querySelectorAll('.animated-study')){
    study.dataset.paused=String(reduced);
    const button=study.querySelector('[data-motion-control="pause"]');button.textContent=reduced?'▶':'Ⅱ';button.setAttribute('aria-label',reduced?'播放动画':'暂停动画');
  }
}
export function controlStudy(e){
  const button=e.target.closest('[data-motion-control]');if(!button)return false;
  if(button.dataset.motionControl==='flip'){flipStudy(button.closest('.animated-study').querySelector('.flip-stage'));return true;}
  const study=button.closest('.animated-study'),animations=study.getAnimations({subtree:true});
  const replay=button.dataset.motionControl==='replay',play=replay||study.dataset.paused==='true';
  for(const a of animations){if(replay)a.currentTime=0;play?a.play():a.pause();}
  study.dataset.paused=String(!play);
  const toggle=study.querySelector('[data-motion-control="pause"]');toggle.textContent=play?'Ⅱ':'▶';toggle.setAttribute('aria-label',play?'暂停动画':'播放动画');
  return true;
}

export function flipStudy(stage){
 const piece=stage?.querySelector('.can-promote');if(!piece)return;
 const loop=piece.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity);if(!loop)return;
 const from=getComputedStyle(piece).transform,t=(Number(loop.currentTime)||0)%6000,back=t<2880||t>=4920;
 loop.pause();loop.currentTime=back?3600:0;
 piece.animate([{transform:from},{transform:`rotateY(${back?180:0}deg)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:480,easing:'ease-in-out'});
 stage.dataset.side=back?'promoted':'base';
}
