import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeCatalog,compile,randomPool,newGame,DRAFT,LEGACY_DRAFT,draftChoice,deploy,moves,move} from '../src/engine.js';
const c=makeCatalog(JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url))));
const piece=(id,side=0)=>({id,base:id,side,promoted:false});
const board=()=>Array(25).fill(null);
const battle=()=>({...newGame(c,'test'),phase:'play',board:board()});

test('catalogue has a large fully executable pool and fails closed on advanced syntax',()=>{
  assert(Object.values(c).filter(p=>p.playable).length>150);
  for(const p of Object.values(c).filter(p=>p.playable)){assert(p.rules.length);if(p.promotion)assert(c[p.promotion]?.rules?.length);}
  assert.equal(c.lion.playable,false);assert.equal(c['great-general'].playable,false);
  assert.equal(compile('KDAN(cK-bK)'),null);
});
test('seed reproduces 16 unique eligible nonroyal pieces',()=>{
  const a=randomPool(c,'2026');assert.equal(a.length,16);assert.equal(new Set(a).size,16);
  assert.deepEqual(a,randomPool(c,'2026'));assert.notDeepEqual(a,randomPool(c,'2027'));
  assert(!a.includes('king'));assert(!a.includes('crown-prince'));
});
test('pick-only sequence, exclusivity and transition',()=>{
  assert.equal(DRAFT.map(s=>s.side?'B':'A').join(''),'ABBAABBAAB');
  let s=newGame(c,'draft');const first=s.pool[0];s=draftChoice(s,first);
  assert.throws(()=>draftChoice(s,first));assert.throws(()=>draftChoice(s,'unknown'));
  for(let i=1;i<10;i++)s=draftChoice(s,s.pool[i]);
  assert.equal(s.phase,'placement');assert.deepEqual(s.picks.map(p=>p.length),[5,5]);assert.deepEqual(s.bans.map(p=>p.length),[0,0]);
  assert.throws(()=>draftChoice(s,s.pool[20]));
});
test('placement alternates and enforces owner, home rows and uniqueness',()=>{
  let s=newGame(c,'deploy');for(let i=0;i<10;i++)s=draftChoice(s,s.pool[i]);
  assert.throws(()=>deploy(s,'king',0));s=deploy(s,'king',22);
  assert.throws(()=>deploy(s,'king',22));s=deploy(s,'king',2);
  assert.throws(()=>deploy(s,'king',23));assert.throws(()=>deploy(s,'fictitious',20));
  for(let i=0;i<5;i++){s=deploy(s,s.picks[0][i],15+i);s=deploy(s,s.picks[1][i],5+i);}
  assert.equal(s.phase,'play');assert.equal(s.turn,0);assert.equal(s.board.filter(Boolean).length,12);
});
test('range blockers, capture stopping and own pieces',()=>{
  const b=board();b[22]=piece('flying-chariot');b[12]=piece('pawn');b[20]=piece('pawn',1);
  const m=moves(b,22,c);assert(m.includes(17));assert(!m.includes(12));assert(!m.includes(7));assert(m.includes(20));assert(!m.includes(19));
});
test('BP king moves one square in eight directions and respects occupancy',()=>{
  const b=board();b[12]=piece('king');assert.equal(moves(b,12,c).length,8);
  assert(!moves(b,12,c).includes(2));b[7]=piece('pawn');assert(!moves(b,12,c).includes(2));assert(!moves(b,12,c).includes(7));
});
test('knight and flying dragon leap over occupied squares; heavenly horse only vertical knights',()=>{
  const b=board();b[22]=piece('cassia-horse');b[17]=piece('pawn');b[16]=piece('pawn');
  assert.deepEqual(moves(b,22,c).sort((a,b)=>a-b),[11,13]);
  b[22]=piece('flying-dragon');assert(moves(b,22,c).includes(10));
  assert.equal(c['heavenly-horse'].rules.filter(r=>r.leap).length,4);
});
test('every supported movement mirrors 180 degrees for White, even with blockers',()=>{
  for(const p of Object.values(c).filter(p=>p.rules)){
    const b=board();b[16]=piece(p.id);b[11]=piece('pawn');b[8]=piece('pawn',1);b[18]=piece('pawn',1);
    const mirror=b.slice().reverse().map(p=>p?{...p,side:1-p.side}:null);
    assert.deepEqual(moves(b,16,c).map(i=>24-i).sort((a,b)=>a-b),moves(mirror,8,c).sort((a,b)=>a-b),p.id);
  }
});
test('capture promotes once, never chains through the target piece promotion',()=>{
  let s=battle();s.board[24]=piece('king');s.board[0]=piece('king',1);s.board[17]=piece('gold-general');s.board[12]=piece('pawn',1);
  s=move(s,17,12,c);assert.equal(s.board[12].id,'flying-chariot');assert(s.board[12].promoted);assert.equal(s.turn,1);
  s.turn=0;s.board[7]=piece('pawn',1);s=move(s,12,7,c);assert.equal(s.board[7].id,'flying-chariot');
});
test('promoted elephant prince preserves the game after its king is captured',()=>{
  let s=battle();s.board[24]=piece('king');s.board[0]=piece('king',1);s.board[12]=piece('drunken-elephant',1);s.board[17]=piece('pawn');s.turn=1;
  s=move(s,12,17,c);assert.equal(s.board[17].id,'crown-prince');assert.equal(s.phase,'play');
  s.board[5]=piece('flying-chariot');s=move(s,5,0,c);assert.equal(s.phase,'play');
  s.turn=0;s.board[22]=piece('flying-chariot');s=move(s,22,17,c);assert.equal(s.phase,'over');assert.equal(s.winner,0);
});
test('turn enforcement, no drops, and source state remains immutable',()=>{
  const s=battle();s.board[24]=piece('king');s.board[0]=piece('king',1);s.board[20]=piece('pawn');
  assert.throws(()=>move(s,0,5,c));assert.throws(()=>move(s,20,10,c));
  const next=move(s,20,15,c);assert(s.board[20]);assert.equal(s.board[15],null);assert.equal(next.board[20],null);
});

test('old version-1 saves retain twenty-step ban/pick sequence',()=>{
 let s={...newGame(c,'legacy'),version:1,pool:randomPool(c,'legacy',32)};
 for(let i=0;i<20;i++)s=draftChoice(s,s.pool[i]);
 assert.equal(LEGACY_DRAFT.length,20);assert.equal(s.phase,'placement');assert.deepEqual(s.bans.map(x=>x.length),[5,5]);
});
