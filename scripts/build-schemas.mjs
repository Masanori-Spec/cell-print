import fs from 'node:fs';
import Ajv from 'ajv-draft-04';
import standaloneCode from 'ajv/dist/standalone/index.js';
import crypto from 'node:crypto';
const pins=JSON.parse(fs.readFileSync('vendor/nbformat/provenance.json','utf8'));
fs.mkdirSync('src/generated',{recursive:true});
for(let minor=0;minor<=5;minor++){
 const file=`vendor/nbformat/nbformat.v4.${minor}.schema.json`,bytes=fs.readFileSync(file);
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==pins.find(p=>p.path===file)?.sha256)throw Error('Schema pin mismatch');
 const schema=JSON.parse(bytes);
 const ajv=new Ajv({strict:false,allErrors:false,code:{source:true,esm:false},validateFormats:false});
 const validate=ajv.compile(schema);
 fs.writeFileSync(`src/generated/schema-${minor}.cjs`,standaloneCode(ajv,validate));
}
console.log('Generated six standalone official schema validators; no runtime compiler/eval');
