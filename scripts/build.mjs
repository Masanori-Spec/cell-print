import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/build-schemas.mjs'],{stdio:'inherit'});
fs.mkdirSync('dist',{recursive:true});fs.mkdirSync('evidence',{recursive:true});fs.mkdirSync('.build',{recursive:true});
const worker=await build({entryPoints:['src/worker.mjs'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',metafile:true,minify:true,legalComments:'inline'});
const workerText=worker.outputFiles[0].text;
fs.writeFileSync('.build/worker.js',workerText);
const app=await build({entryPoints:['public/app.mjs'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,define:{WORKER_SOURCE:JSON.stringify(workerText),DEMO_TEXT:JSON.stringify(fs.readFileSync('fixtures/synthetic.ipynb','utf8'))}});
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const packageNames=new Set();for(const name of Object.keys(worker.metafile.inputs)){if(name.includes('node_modules/')){const suffix=name.split('node_modules/').at(-1);packageNames.add(suffix.startsWith('@')?suffix.split('/').slice(0,2).join('/'):suffix.split('/')[0]);}}
const notices=[];const components=[];
for(const name of [...packageNames].sort()){const root=path.join('node_modules',name);const info=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));const licenseFile=['LICENSE','LICENSE.md','LICENSE.txt','LICENSE-MIT'].map(n=>path.join(root,n)).find(fs.existsSync);if(!licenseFile)throw Error('Missing bundled license '+name);const license=fs.readFileSync(licenseFile,'utf8');notices.push(`${name} ${info.version}\n${license}`);components.push({name,version:info.version,license:info.license,license_sha256:crypto.createHash('sha256').update(license).digest('hex')});}
notices.push('nbformat 5.11.1 official schemas (and generated validators)\n'+fs.readFileSync('vendor/nbformat/LICENSE','utf8'));
notices.push('ajv-draft-04 1.0.0 build-time generated-validator contributor\n'+fs.readFileSync('node_modules/ajv-draft-04/LICENSE','utf8'));
// Standalone Ajv-generated validation code is derived from Ajv; retain its full notice.
if(!packageNames.has('ajv'))notices.push('Ajv 8.17.1 generated validation code\n'+fs.readFileSync('node_modules/ajv/LICENSE','utf8'));
const noticeText='Original CellPrint code has no license grant. The following notices apply only to the identified third-party components.\n\n'+notices.join('\n\n-----\n\n');
fs.writeFileSync('THIRD_PARTY_NOTICES.txt',noticeText+'\n');
let html=fs.readFileSync('public/index.html','utf8').replace('/*APP_CSS*/',fs.readFileSync('public/style.css','utf8')).replace('/*THIRD_PARTY_NOTICES*/',escape(noticeText)).replace('/*APP_SCRIPT*/',app.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
fs.writeFileSync('dist/cellprint.html',html);fs.writeFileSync('evidence/worker-metafile.json',JSON.stringify(worker.metafile,null,2)+'\n');fs.writeFileSync('evidence/bundled-components.json',JSON.stringify(components,null,2)+'\n');
console.log(`Single offline HTML: ${Buffer.byteLength(html)} bytes; runtime packages: ${[...packageNames].join(', ')}`);
