import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
try{process.loadEnvFile(path.join(import.meta.dirname,'.env.local'));}catch{}
const root=path.resolve(import.meta.dirname,'dist');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.ttf':'font/ttf'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://'+req.headers.host),pathname=decodeURIComponent(url.pathname);
 if(pathname==='/api/wallpaper'){
  const handler=await import('./api/wallpaper.js'),method=handler[req.method];if(!method){res.writeHead(405);res.end();return;}
  const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:req,duplex:'half'})});
  const response=await method(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'0.0.0.0',()=>console.log('IRONFORM is ready at http://localhost:4173'));
