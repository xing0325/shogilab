import test from 'node:test';
import assert from 'node:assert/strict';
import {recordMatch,matchFrames} from '../src/matches.js';
const game=()=>({seed:'SAME',phase:'draft',draft:[{id:'pawn'}],placement:0,ply:0,board:Array(25).fill(null),picks:[[],[]],bans:[[],[]],log:[]});
test('rematches with identical seeds remain separate records',()=>{
 let records=recordMatch([],'a',null,game(),[],'2026-10-15T00:00:00Z');
 records=recordMatch(records,'b',null,game(),[],'2026-10-15T01:00:00Z');
 assert.equal(records.length,2);assert.deepEqual(records.map(m=>m.id),['b','a']);
});
test('recording snapshots does not retain mutable live-game references',()=>{
 const g=game(),past=[structuredClone(g)],records=recordMatch([],'a',null,g,past);
 g.board[0]={id:'king'};past[0].draft.length=0;
 assert.equal(records[0].game.board[0],null);assert.equal(records[0].history[0].draft.length,1);
});
test('updating the same game preserves completion time and undo clears completion',()=>{
 const g={...game(),phase:'over',winner:0};
 let records=recordMatch([],'a',null,g,[],'2026-10-15T00:00:00Z');
 records=recordMatch(records,'a',null,g,[],'2026-10-15T01:00:00Z');
 assert.equal(records.length,1);assert.equal(records[0].endedAt,'2026-10-15T00:00:00Z');
 records=recordMatch(records,'a',null,game(),[]);assert.equal(records[0].endedAt,null);
});
test('empty games are not archived; replay includes the terminal board after undo states',()=>{
 const g={...game(),draft:[]};assert.equal(recordMatch([],'empty',null,g,[]).length,0);
 const final={...game(),phase:'over'};const m=recordMatch([],'a',null,final,[g])[0];
 assert.equal(matchFrames(m).length,2);assert.equal(matchFrames(m)[1].phase,'over');assert.equal(m.startedAt,null);
});
