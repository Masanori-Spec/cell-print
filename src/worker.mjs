import {parseNotebook,buildArtifacts} from './engine.mjs';
self.onmessage=({data})=>{
 try{const value=data.type==='parse'?parseNotebook(data.text):data.type==='build'?buildArtifacts(data.notebook,data.ids):(()=>{throw new Error('invalid-request');})();self.postMessage({id:data.id,ok:true,value});}
 catch(error){self.postMessage({id:data.id,ok:false,error:typeof error.message==='string'?error.message:'failed'});}
};
