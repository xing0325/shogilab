import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import {roomApi} from '../backend/http.mjs';import {createRoomStore} from '../backend/rooms.mjs';
test('HTTP protocol: origin, auth, payload limits, and two independent clients',async t=>{const dir=mkdtempSync(path.join(os.tmpdir(),'shogi-http-'));const store=createRoomStore({dir,catalogRows:JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url)))});const api=roomApi(store);const server=http.createServer((req,res)=>api(req,res,new URL(req.url,'http://localhost')));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});});const base='http://127.0.0.1:'+server.address().port;
 const post=(url,body,token,origin=base)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 assert.equal((await post('/api/rooms',{},null,'https://evil.example')).status,403);
 assert.equal((await post('/api/rooms',{pad:'x'.repeat(5000)})).status,413);
 const a=await (await post('/api/rooms',{mode:'versus',side:0,minutes:10,seconds:10,timed:true})).json();assert.ok(a.token);
 assert.equal((await fetch(base+'/api/rooms/'+a.id)).status,401);
 const b=await (await post('/api/rooms/'+a.id+'/join',{name:'Other'})).json();assert.equal(b.side,1);
 const get=async token=>(await fetch(base+'/api/rooms/'+a.id,{headers:{Authorization:'Bearer '+token}})).json();
 for(const token of [a.token,b.token]){const s=await get(token);assert.equal((await post('/api/rooms/'+a.id+'/actions',{id:crypto.randomUUID(),revision:s.revision,action:{type:'ready'}},token)).status,200);}
 const s=await get(a.token);assert.equal(s.started,true);const moved=await (await post('/api/rooms/'+a.id+'/actions',{id:crypto.randomUUID(),revision:s.revision,action:{type:'move',from:54,to:45}},a.token)).json();assert.equal(moved.game.ply,1);assert.equal((await get(b.token)).game.board[45].id,'s-pawn');assert.equal(JSON.stringify(await get(b.token)).includes(a.token),false);
});
