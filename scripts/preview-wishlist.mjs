// Local integration preview only: in-memory SQL database, never production data.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {localDatabase,handler} from '../tests/d1-local.mjs';
const root=fileURLToPath(new URL('../site/',import.meta.url));
const port=Number(process.env.PORT || 4174);
const onRequest=await handler();
const key=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const env={WISHLIST_DB:localDatabase(),WISHLIST_ADMIN_KEY:key};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.webm':'video/webm','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    if(url.pathname.startsWith('/api/wishlist')){
      const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
      const response=await onRequest({request,env});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    const pathname=url.pathname==='/'?'/index.html':url.pathname==='/opvolging'?'/opvolging.html':decodeURIComponent(url.pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
    const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Niet gevonden');}
}).listen(port,'127.0.0.1',()=>{
  console.log('LOKALE DEMO, geen echte stemmen: http://127.0.0.1:'+port);
  console.log('Tijdelijke lokale beheerlink: http://127.0.0.1:'+port+'/opvolging#key='+key);
});
