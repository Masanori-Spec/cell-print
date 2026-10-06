"""Consume actual exported files with official nbformat/nbconvert; never execute code."""
import argparse,json,hashlib,importlib.metadata,re,copy
from pathlib import Path
from html.parser import HTMLParser
import nbformat
from nbconvert import HTMLExporter
from traitlets.config import Config

EXPECTED_IDS=['nested-python','tabs-python','long-python']
# Independent literal oracle: deliberately not read from the input notebook or JS.
EXPECTED_SOURCES=[
 '# CP_FIRST_SELECTED\n# 日本語のコメント：空白と順番を保つ\ndef render(value):\n    if value:\n        html = "<script>window.BAD = true</script>"\n\n        return html + " & < >"\n\n    return "done"\n',
 '# CP_TABS_START\r\ndef tabbed():\r\n\tmessage = "タブと Unicode 😀 é "\r\n\treturn message\r\n\r\n# CP_TABS_END\r\n',
 '# CP_LONG_START\n'+''.join('print("CP_ROW_%03d")\n'%i for i in range(1,141))+'# LONG_WRAP '+'abcdef_'*55+'\n# CP_LAST_SELECTED\n'
]
FORBIDDEN=['UNSELECTED_FIRST_SENTINEL','UNSELECTED_MIDDLE_SENTINEL','UNSELECTED_TRAILING_SENTINEL','OUTPUT_SCRIPT_SENTINEL','OUTPUT_TEXT_SENTINEL','METADATA_MUST_NOT_SHIP','MARKDOWN_MUST_NOT_SHIP']
class SourceHTML(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.sources=[];self.current=None;self.code=False;self.ids=[];self.bad=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='section':self.ids.append(a.get('data-cell-id'))
  if tag=='code':self.code=True;self.current=''
  if tag in ['script','iframe','object','embed','img','link','form'] or any(k.startswith('on') for k in a):self.bad.append(tag)
 def handle_endtag(self,tag):
  if tag=='code':self.sources.append(self.current);self.code=False
 def handle_data(self,data):
  if self.code:self.current+=data

def verify(notebook_text,html_text):
 raw=json.loads(notebook_text)
 assert raw['nbformat']==4 and raw['nbformat_minor']==5
 assert [c['id'] for c in raw['cells']]==EXPECTED_IDS
 assert [c['source'] for c in raw['cells']]==EXPECTED_SOURCES
 for c in raw['cells']:
  assert set(c)=={'cell_type','id','metadata','source','execution_count','outputs'}
  assert c['cell_type']=='code' and c['metadata']=={} and c['execution_count'] is None and c['outputs']==[]
 for s in FORBIDDEN:assert s not in notebook_text and s not in html_text,s
 parsed=SourceHTML();parsed.feed(html_text)
 assert parsed.ids==EXPECTED_IDS and parsed.sources==EXPECTED_SOURCES and not parsed.bad
 # Public validate() can repair duplicate IDs in this pinned version. Its
 # isvalid() path explicitly disables repair; enforce that before reading.
 snapshot=copy.deepcopy(raw)
 assert nbformat.validator.isvalid(raw) and raw==snapshot
 nbformat.validate(raw)
 assert raw==snapshot
 notebook=nbformat.reads(notebook_text,as_version=nbformat.NO_CONVERT);nbformat.validate(notebook)
 assert [c.id for c in notebook.cells]==EXPECTED_IDS and [c.source for c in notebook.cells]==EXPECTED_SOURCES
 config=Config();config.ExecutePreprocessor.enabled=False;config.HTMLExporter.exclude_output=True
 exporter=HTMLExporter(config=config)
 assert not any(type(p).__name__=='ExecutePreprocessor' and p.enabled for p in exporter._preprocessors)
 rendered,_=exporter.from_notebook_node(notebook)
 assert 'CP_FIRST_SELECTED' in rendered and 'CP_LAST_SELECTED' in rendered
 for s in FORBIDDEN:assert s not in rendered
 return rendered

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--notebook',default='evidence/selected-source.ipynb');parser.add_argument('--html',default='evidence/selected-source.html');parser.add_argument('--report',default='evidence/native-report.json');args=parser.parse_args()
 assert importlib.metadata.version('nbformat')=='5.11.1';assert importlib.metadata.version('nbconvert')=='7.17.1'
 n=Path(args.notebook).read_text();h=Path(args.html).read_text();verify(n,h)
 rejected=[]
 for name,mutate in [
 ('extra-unselected-cell',lambda x:x['cells'].append({'cell_type':'code','id':'bad','metadata':{},'source':'UNSELECTED_FIRST_SENTINEL = 1\n','execution_count':None,'outputs':[]})),
 ('indentation-deleted',lambda x:x['cells'][0].update(source=x['cells'][0]['source'].replace('        return','return'))),
 ('blank-line-deleted',lambda x:x['cells'][0].update(source=x['cells'][0]['source'].replace('\n\n','\n',1))),
 ('duplicate-id',lambda x:x['cells'][1].update(id=x['cells'][0]['id']))]:
  bad=json.loads(n);mutate(bad)
  try:verify(json.dumps(bad),h)
  except (AssertionError,nbformat.ValidationError):rejected.append(name)
  else:raise AssertionError('Negative control was accepted: '+name)
 schema_rejected=[]
 for name,mutate in [('duplicate-cell-id',lambda x:x['cells'][1].update(id=x['cells'][0]['id'])),('invalid-cell-id',lambda x:x['cells'][0].update(id='<invalid>')),('source-wrong-type',lambda x:x['cells'][0].update(source=42)),('outputs-wrong-type',lambda x:x['cells'][0].update(outputs='wrong'))]:
  bad=json.loads(n);mutate(bad)
  unchanged=copy.deepcopy(bad)
  assert not nbformat.validator.isvalid(bad),'Official validation accepted malformed control: '+name
  assert bad==unchanged,'Official rejection mutated input'
  schema_rejected.append(name)
 report={'nbformat':'5.11.1','nbconvert':'7.17.1','status':'accepted-by-official-validate-and-HTMLExporter','selected_ids':EXPECTED_IDS,'exact_sources':True,'forbidden_content_absent':True,'fidelity_controls_rejected':rejected,'official_schema_controls_rejected':schema_rejected,'notebook_sha256':hashlib.sha256(n.encode()).hexdigest(),'html_sha256':hashlib.sha256(h.encode()).hexdigest(),'kernel_executions':0,'scope':'Synthetic exported excerpt and literal source preservation; no notebook execution'}
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
