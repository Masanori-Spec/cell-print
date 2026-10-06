import './prism-flags.mjs';
import Prism from 'prismjs/components/prism-core.js';
import 'prismjs/components/prism-python.js';
import validate0 from './generated/schema-0.cjs';
import validate1 from './generated/schema-1.cjs';
import validate2 from './generated/schema-2.cjs';
import validate3 from './generated/schema-3.cjs';
import validate4 from './generated/schema-4.cjs';
import validate5 from './generated/schema-5.cjs';
Prism.manual = true;

export const LIMITS = Object.freeze({bytes:20*1024*1024,cells:1000,selected:32,characters:200000,depth:40,nodes:150000});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=x=>x!==null && typeof x==='object' && !Array.isArray(x);
function fail(code){throw new Error(code);}
export const escapeHTML=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\r/g,'&#13;');
function renderTokens(value){
  if(typeof value==='string')return escapeHTML(value);
  if(Array.isArray(value))return value.map(renderTokens).join('');
  return `<span class="token ${escapeHTML(value.type)}">${renderTokens(value.content)}</span>`;
}
function checkTree(value){
  let n=0;const pending=[[value,0]];
  while(pending.length){const [v,d]=pending.pop();if(++n>LIMITS.nodes || d>LIMITS.depth)fail('structure-limit');
    if(v && typeof v==='object')for(const child of Object.values(v)){if(n+pending.length>=LIMITS.nodes)fail('structure-limit');pending.push([child,d+1]);}
  }
}
function sourceText(v){
  if(!(typeof v==='string'||(Array.isArray(v)&&v.every(s=>typeof s==='string'))))fail('invalid-source');
  const s=Array.isArray(v)?v.join(''):v;
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(s)||!s.isWellFormed())fail('unsupported-source-character');
  return s;
}
/** Only normalized source and stable identifiers survive this import boundary. */
export function parseNotebook(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>LIMITS.bytes)fail('file-limit');
  let nb;try{nb=JSON.parse(text);}catch{fail('invalid-json');}
  checkTree(nb);
  if(!object(nb)||nb.nbformat!==4||!Number.isInteger(nb.nbformat_minor)||nb.nbformat_minor<0||nb.nbformat_minor>5||!object(nb.metadata)||!Array.isArray(nb.cells))fail('unsupported-notebook');
  if(nb.cells.length>LIMITS.cells)fail('cell-limit');
  if(![validate0,validate1,validate2,validate3,validate4,validate5][nb.nbformat_minor](nb))fail('invalid-notebook-schema');
  const ids=new Set();
  for(const cell of nb.cells){
    if(!object(cell)||!['code','markdown','raw'].includes(cell.cell_type)||!object(cell.metadata))fail('invalid-cell');
    if(own(cell,'id')){if(typeof cell.id!=='string'||!/^[-_a-zA-Z0-9]{1,64}$/.test(cell.id)||ids.has(cell.id))fail('invalid-or-duplicate-id');ids.add(cell.id);}
    else if(nb.nbformat_minor>=5)fail('missing-id');
    sourceText(cell.source);
    if(cell.cell_type==='code' && (!Array.isArray(cell.outputs)||!(cell.execution_count===null||(Number.isInteger(cell.execution_count)&&cell.execution_count>=0))))fail('invalid-code-cell');
  }
  const candidate=nb.metadata.language_info?.name??nb.metadata.kernelspec?.language??'';
  // Preserve only the recognized Python language marker, never arbitrary metadata.
  const language=typeof candidate==='string'&&candidate.toLowerCase()==='python'?'python':'';
  const cells=nb.cells.flatMap((cell,index)=>{
    if(cell.cell_type!=='code')return [];
    let id=cell.id,generated=false;
    if(id===undefined){let suffix=0;do{id=`cellprint-${index+1}-${suffix++}`;}while(ids.has(id));ids.add(id);generated=true;}
    const source=sourceText(cell.source);
    let characters=0,lines=1;for(const char of source){characters++;if(char==='\n')lines++;}
    return [{id,index,source,generated,characters,lines}];
  });
  return {cells,totalCells:nb.cells.length,omittedNonCode:nb.cells.length-cells.length,language,highlightPython:language==='python',formatMinor:nb.nbformat_minor};
}

function select(notebook,ids){
  if(!Array.isArray(ids)||ids.length===0||ids.length>LIMITS.selected||new Set(ids).size!==ids.length)fail('selection-limit');
  const keys=new Set(ids),cells=notebook.cells.filter(c=>keys.has(c.id));
  if(cells.length!==ids.length)fail('unknown-cell');
  if(cells.reduce((n,c)=>n+c.characters,0)>LIMITS.characters)fail('character-limit');
  return cells;
}
export function excerpt(notebook,ids){
  const cells=select(notebook,ids);
  return {nbformat:4,nbformat_minor:5,metadata:notebook.language?{language_info:{name:notebook.language}}:{},cells:cells.map(c=>({cell_type:'code',id:c.id,metadata:{},source:c.source,execution_count:null,outputs:[]}))};
}
const printCSS=`*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:white;color:#16202a;font-family:Arial,"Noto Sans CJK JP",sans-serif;font-size:10pt;line-height:1.45}main{max-width:190mm;margin:18mm auto;padding:0 3mm}h1{font-size:19pt;margin:0 0 3mm}header{border-bottom:1px solid #aab4bb;padding-bottom:4mm;margin-bottom:6mm}header p{margin:1mm 0;color:#475560}section{margin:0 0 7mm;break-inside:auto}h2{font-size:10pt;font-weight:600;color:#465969;margin:0 0 2mm;break-after:avoid}pre{margin:0;padding:3mm;border-left:2px solid #c6d4de;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;tab-size:4;font-family:"DejaVu Sans Mono","Noto Sans Mono CJK JP",monospace;font-size:9pt;line-height:1.55;orphans:3;widows:3}code{font:inherit;white-space:inherit}.token.comment{color:#43604e}.token.keyword,.token.boolean{color:#633ba3}.token.string{color:#8b3f2b}.token.number,.token.function{color:#215b90}.token.operator,.token.punctuation{color:#364956}@page{margin:15mm} @media print{main{max-width:none;margin:0;padding:0}.screen-note{display:none}pre{box-decoration-break:clone;-webkit-box-decoration-break:clone}a{color:inherit;text-decoration:none}}`;
export function printHTML(notebook,ids){
  const cells=select(notebook,ids);
  const blocks=cells.map(c=>{
    // Prism tokenizes only. Our renderer preserves NBSP and CR exactly (Prism's
    // stock HTML encoder normalizes NBSP). Unknown languages use plain text.
    const source=notebook.highlightPython?renderTokens(Prism.tokenize(c.source,Prism.languages.python)):escapeHTML(c.source);
    return `<section data-cell-id="${escapeHTML(c.id)}"><h2>Cell ${c.index+1} · ${escapeHTML(c.id)}</h2><pre><code>${source}</code></pre></section>`;
  }).join('\n');
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>CellPrint · selected notebook source</title><style>${printCSS}</style></head><body><main><header><h1>Selected notebook source</h1><p>${cells.length} code cells · original notebook order · outputs discarded</p><p class="screen-note">Use your browser’s Print command. A4 and Letter are supported. Long lines wrap; tabs use four columns. This file contains only the selected source cells.</p></header>${blocks}</main></body></html>\n`;
}
export function buildArtifacts(notebook,ids){
  const selected=select(notebook,ids);
  return {html:printHTML(notebook,ids),notebook:JSON.stringify(excerpt(notebook,ids),null,2)+'\n',count:selected.length,characters:selected.reduce((n,c)=>n+c.characters,0),ids:selected.map(c=>c.id)};
}
