import fs from 'node:fs';
import {parseNotebook,buildArtifacts} from '../src/engine.mjs';
const code=(id,source,outputs=[])=>({cell_type:'code',id,source,metadata:{private_note:'METADATA_MUST_NOT_SHIP'},execution_count:7,outputs});
const nested='# CP_FIRST_SELECTED\n# 日本語のコメント：空白と順番を保つ\ndef render(value):\n    if value:\n        html = "<script>window.BAD = true</script>"\n\n        return html + " & < >"\n\n    return "done"\n';
const tabs='# CP_TABS_START\r\n'+ 'def tabbed():\r\n\tmessage = "タブと Unicode 😀 é "\r\n\treturn message\r\n\r\n# CP_TABS_END\r\n';
const long='# CP_LONG_START\n'+Array.from({length:140},(_,i)=>`print("CP_ROW_${String(i+1).padStart(3,'0')}")`).join('\n')+'\n# LONG_WRAP '+('abcdef_'.repeat(55))+'\n# CP_LAST_SELECTED\n';
const notebook={nbformat:4,nbformat_minor:5,metadata:{language_info:{name:'python'},private_note:'NOTEBOOK_METADATA_MUST_NOT_SHIP'},cells:[
code('unselected-first','UNSELECTED_FIRST_SENTINEL = 1\n'),
{cell_type:'markdown',id:'markdown-hidden',metadata:{},source:'# MARKDOWN_MUST_NOT_SHIP'},
code('nested-python',[nested.slice(0,60),nested.slice(60)], [{output_type:'display_data',metadata:{},data:{'text/html':'<script>fetch("https://never.invalid/OUTPUT_SCRIPT_SENTINEL")</script>','text/plain':'OUTPUT_TEXT_SENTINEL'}}]),
code('tabs-python',tabs),code('unselected-middle','UNSELECTED_MIDDLE_SENTINEL = 2\n'),code('long-python',long),code('unselected-trailing','UNSELECTED_TRAILING_SENTINEL = 3\n')]};
fs.writeFileSync('fixtures/synthetic.ipynb',JSON.stringify(notebook,null,2)+'\n');
const parsed=parseNotebook(JSON.stringify(notebook));const result=buildArtifacts(parsed,['long-python','nested-python','tabs-python']);
fs.writeFileSync('evidence/selected-source.ipynb',result.notebook);fs.writeFileSync('evidence/selected-source.html',result.html);
console.log(`Generated synthetic notebook + actual exports: ${result.count} selected, ${result.characters} characters`);
