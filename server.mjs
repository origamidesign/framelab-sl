import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const routes={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/core.mjs':'core.mjs'};
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8'};
http.createServer(async(req,res)=>{const file=routes[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);res.end('Introuvable');return;}try{const data=await readFile(fileURLToPath(new URL(file,import.meta.url)));res.writeHead(200,{'Content-Type':types[file.split('.').pop()]});res.end(data);}catch{res.writeHead(500);res.end('Erreur de lecture');}}).listen(4173,'127.0.0.1',()=>console.log('FrameLab : http://127.0.0.1:4173'));
