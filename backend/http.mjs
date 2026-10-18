export function roomApi(store,{publicOrigin}={}){const buckets=new Map();return async(req,res,url)=>{
 if(!url.pathname.startsWith('/api/'))return false;
 const send=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
 try{
  const ip=req.socket.remoteAddress,now=Date.now(),key=ip+(req.method==='POST'&&url.pathname==='/api/rooms'?':create':':all'),limit=key.endsWith(':create')?10:300;
  if(buckets.size>5000)for(const [k,b] of buckets)if(now-b.start>60000)buckets.delete(k);
  let b=buckets.get(key);if(!b||now-b.start>60000){b={start:now,count:0};buckets.set(key,b);}if(++b.count>limit)throw Object.assign(Error('请求太频繁，请稍后再试'),{status:429});
  if(req.headers.origin&&req.headers.origin!==(publicOrigin||'http://'+req.headers.host))throw Object.assign(Error('来源不允许'),{status:403});
  if(url.pathname==='/api/health'&&req.method==='GET'){send(200,{ok:true,protocol:1});return true;}
  const m=url.pathname.match(/^\/api\/rooms(?:\/([a-f0-9]{16})(?:\/(join|actions))?)?$/);if(!m)throw Object.assign(Error('接口不存在'),{status:404});
  let body={};if(req.method==='POST'){if(!req.headers['content-type']?.startsWith('application/json'))throw Error('需要 JSON 请求');let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>4096)throw Object.assign(Error('请求过大'),{status:413});}body=JSON.parse(data||'{}');if(!body||typeof body!=='object'||Array.isArray(body))throw Error('请求格式无效');}
  const token=req.headers.authorization?.replace(/^Bearer /,'');let result;
  if(req.method==='POST'&&!m[1])result=store.create(body);
  else if(req.method==='POST'&&m[2]==='join')result=store.join(m[1],body);
  else if(req.method==='POST'&&m[2]==='actions')result=store.action(m[1],token,body);
  else if(req.method==='GET'&&m[1]&&!m[2])result=store.read(m[1],token);
  else throw Object.assign(Error('方法不允许'),{status:405});
  send(200,result);
 }catch(e){send(e.status||400,{error:e.message});}return true;
 };}
