import {randomBytes,createHash} from 'node:crypto';
import {mkdirSync,readdirSync,readFileSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {makeCatalog,newGame,draftSteps,draftChoice,deploy,move} from '../src/engine.js';
import {newVersus,versusMove,versusDrop} from '../src/versus.js';
import {createClock,advanceClock,clockReading} from '../src/clock.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function createRoomStore({dir,catalogRows,now=Date.now,maxRooms=500}){
 mkdirSync(dir,{recursive:true,mode:0o700});const rooms=new Map(),catalog=makeCatalog(catalogRows);
 for(const file of readdirSync(dir).filter(f=>/^[a-f0-9]{16}\.json$/.test(f))){const r=JSON.parse(readFileSync(path.join(dir,file),'utf8'));if(r.expiresAt>now())rooms.set(r.id,r);else unlinkSync(path.join(dir,file));}
 const persist=r=>{const f=path.join(dir,r.id+'.json');writeFileSync(f+'.tmp',JSON.stringify(r),{mode:0o600});renameSync(f+'.tmp',f);rooms.set(r.id,r);};
 const get=id=>{const r=rooms.get(id);if(!r||r.expiresAt<=now())fail('房间不存在或已过期',404);return r;};
 const auth=(r,token)=>{if(typeof token!=='string'||token.length!==48)fail('请使用本机保存的座位凭证重新加入',401);const side=r.seats.findIndex(s=>s?.hash===hash(token));if(side<0)fail('座位凭证无效',401);return side;};
 const current=g=>g.phase==='draft'?draftSteps(g)[g.draft.length].side:g.phase==='placement'?g.placement%2:g.turn;
 function finish(r,winner,reason){r.history.push(structuredClone(r.game));advanceClock(r.game,r.game,now());r.game.phase='over';r.game.winner=winner;if(r.game.clock)r.game.clock.since=null;r.game.log.push(reason);r.revision++;r.offer=null;r.undoOffer=null;persist(r);}
 function tick(r){if(r.started&&r.game.phase==='play'&&clockReading(r.game,r.game.turn,now()).expired)finish(r,1-r.game.turn,(r.game.turn===0?'先手':'后手')+'超时');}
 function snapshot(r,side){return {id:r.id,revision:r.revision,side,started:r.started,ready:r.ready,players:r.seats.map(s=>s?{name:s.name}:null),game:r.game,history:r.history,offer:r.offer,undoOffer:r.undoOffer??null,createdAt:r.createdAt,serverNow:now(),expiresAt:r.expiresAt};}
 function seat(name){const token=randomBytes(24).toString('hex');return {token,record:{hash:hash(token),name:String(name||'Anonymous').trim().slice(0,24)||'Anonymous'}};}
 return {
 create(input){for(const [id,r] of rooms)if(r.expiresAt<=now()){rooms.delete(id);unlinkSync(path.join(dir,id+'.json'));}if(rooms.size>=maxRooms)fail('房间已满，请稍后再试',503);
  if(!['draft','versus'].includes(input.mode))fail('未知模式');const minutes=Number(input.minutes),seconds=Number(input.seconds);if(!Number.isInteger(minutes)||minutes<1||minutes>180||!Number.isInteger(seconds)||seconds<0||seconds>60)fail('时间设置无效');
  const side=input.side===1?1:0,s=seat(input.name),game=input.mode==='versus'?newVersus(randomBytes(4).toString('hex')):newGame(catalog,String(input.seed||randomBytes(4).toString('hex')).slice(0,40));if(input.timed)game.clock=createClock(minutes,seconds,false,now());
  const r={id:randomBytes(8).toString('hex'),revision:0,seats:[null,null],ready:[false,false],started:false,createdAt:new Date(now()).toISOString(),expiresAt:now()+7*86400000,game,history:[],offer:null,commands:[]};r.seats[side]=s.record;persist(r);return {...snapshot(r,side),token:s.token};
 },
 join(id,input){const r=structuredClone(get(id));const side=r.seats.findIndex(s=>!s);if(side<0)fail('房间已满；原玩家请用原浏览器重连',409);const s=seat(input.name);r.seats[side]=s.record;r.revision++;persist(r);return {...snapshot(r,side),token:s.token};},
 read(id,token){const r=get(id),side=auth(r,token);tick(r);return snapshot(r,side);},
 action(id,token,input){let r=structuredClone(get(id));const side=auth(r,token);tick(r);r=structuredClone(get(id));if(typeof input.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(input.id))fail('操作编号无效');if(r.commands.includes(input.id))return snapshot(r,side);if(input.revision!==r.revision)fail('局面已更新，请重试',409);const a=input.action||{};
  if(a.type==='ready'){if(r.started)fail('对局已经开始');r.ready[side]=true;if(r.seats.every(Boolean)&&r.ready.every(Boolean)){r.started=true;if(r.game.phase==='play'&&r.game.clock)r.game.clock.since=now();}}
  else {if(!r.started)fail('等待双方准备');if(r.game.phase==='over')fail('对局已经结束');
   if(a.type==='offer-undo'){if(!r.history.length)fail('没有可撤销的步骤');if(r.undoOffer!=null)fail('已有悔棋申请');r.undoOffer=side;}
   else if(a.type==='decline-undo'){if(r.undoOffer==null||r.undoOffer===side)fail('没有对方的悔棋申请');r.undoOffer=null;}
   else if(a.type==='accept-undo'){if(r.undoOffer==null||r.undoOffer===side)fail('没有对方的悔棋申请');const previous=r.history.pop();if(!previous)fail('没有可撤销的步骤');const clock=r.game.clock;if(clock){previous.clock=structuredClone(clock);if(r.game.phase==='play'&&clock.since!==null)previous.clock.remaining[r.game.turn]-=Math.max(0,now()-clock.since);previous.clock.since=previous.phase==='play'?now():null;}r.game=previous;r.undoOffer=null;r.offer=null;}
   else if(a.type==='offer-draw'){if(r.offer!==null)fail('已有和棋提议');r.offer=side;}
   else if(a.type==='decline-draw'){if(r.offer===null||r.offer===side)fail('没有对方的和棋提议');r.offer=null;}
   else if(a.type==='accept-draw'){if(r.offer===null||r.offer===side)fail('没有对方的和棋提议');finish(r,null,'双方协议和棋');r=structuredClone(get(id));}
   else if(a.type==='resign'){finish(r,1-side,(side===0?'先手':'后手')+'认输');r=structuredClone(get(id));}
   else {if(current(r.game)!==side)fail('尚未轮到你',403);const g=r.game;let next;
    const index=x=>{if(!Number.isInteger(x)||x<0||x>=g.board.length)fail('棋盘坐标无效');return x;};
    if(a.type==='pick'&&g.phase==='draft')next=draftChoice(g,a.piece);
    else if(a.type==='deploy'&&g.phase==='placement')next=deploy(g,a.piece,index(a.to));
    else if(a.type==='move'&&g.phase==='play')next=g.mode==='versus'?versusMove(g,index(a.from),index(a.to),a.promotion??null):move(g,index(a.from),index(a.to),catalog);
    else if(a.type==='drop'&&g.phase==='play'&&g.mode==='versus')next=versusDrop(g,a.piece,index(a.to));
    else fail('当前阶段不能执行此操作');
    advanceClock(g,next,now());r.history.push(g);r.game=next;r.offer=null;r.undoOffer=null;
    if(r.history.length>=1500&&next.phase!=='over'){next.phase='over';next.winner=null;next.log.push('达到 1500 步上限，和棋');if(next.clock)next.clock.since=null;}
   }
  }
  r.commands.push(input.id);r.commands=r.commands.slice(-128);r.revision++;persist(r);return snapshot(r,side);
 },
 tick(){for(const r of rooms.values())tick(r);},
 size(){return rooms.size;}
 };
}
