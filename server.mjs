import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'site');
const port=Number(process.env.PORT)||3000;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.mp3':'audio/mpeg','.m4a':'audio/mp4','.mp4':'audio/mp4','.webm':'audio/webm','.ogg':'audio/ogg','.wav':'audio/wav'};

http.createServer((request,response)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname)}catch{response.writeHead(400).end();return}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
  fs.readFile(file,(error,content)=>{
    if(error){response.writeHead(error.code==='ENOENT'?404:500).end();return}
    response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    response.end(content);
  });
}).listen(port,'0.0.0.0',()=>console.log(`Listening on ${port}`));
