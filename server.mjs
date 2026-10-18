import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRoomStore} from './backend/rooms.mjs';
import {roomApi} from './backend/http.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const store=createRoomStore({dir:process.env.DATA_DIR||path.join(root,'.server-data'),catalogRows:JSON.parse(await readFile(path.join(root,'data/catalog.json'),'utf8'))});
const api=roomApi(store,{publicOrigin:process.env.PUBLIC_ORIGIN});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.zip':'application/zip','.mp3':'audio/mpeg','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');if(await api(req,res,url))return;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const pathname=decodeURIComponent(url.pathname),name=pathname==='/'?'index.html':pathname.slice(1),file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||name.split('/').some(p=>p.startsWith('.'))||!(/^(src|vendor|assets)\//.test(name)||['index.html','data/catalog.json','SOURCES.md','LICENSE','source.zip'].includes(name))){res.writeHead(403).end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}).end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404).end('Not found');}
});
server.requestTimeout=10000;server.headersTimeout=10000;
const timer=setInterval(()=>{try{store.tick();}catch(e){console.error('Room persistence error:',e.message);}},500);timer.unref();
server.listen(Number(process.env.PORT)||5173,process.env.HOST||'127.0.0.1',()=>console.log('Shogi Lab → http://'+(process.env.HOST||'127.0.0.1')+':'+(process.env.PORT||5173)));
