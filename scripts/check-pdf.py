"""Check every PDF page/text box, then render all pages for human inspection."""
import argparse,subprocess,json,xml.etree.ElementTree as ET
from pathlib import Path
import runpy
FORBIDDEN=runpy.run_path(str(Path(__file__).with_name('native-consumer.py')))['FORBIDDEN']
parser=argparse.ArgumentParser();parser.add_argument('--root',default='test-results');args=parser.parse_args();root=Path(args.root);reports=[]
for paper in ['A4','Letter']:
 paths=list(root.rglob(f'selected-{paper}.pdf'));assert len(paths)==1,(paper,paths)
 pdf=paths[0];folder=pdf.parent/f'pdf-{paper}';folder.mkdir(exist_ok=True)
 text=subprocess.check_output(['pdftotext','-layout',str(pdf),'-']).decode()
 for marker in FORBIDDEN:assert marker not in text
 assert 'CP_FIRST_SELECTED' in text and 'CP_LAST_SELECTED' in text and 'CP_TABS_END' in text
 assert '日本語のコメント' in text and 'タブと' in text
 for i in range(1,141):assert text.count('CP_ROW_%03d'%i)==1,(paper,i)
 (folder/'text.txt').write_text(text)
 bbox=subprocess.check_output(['pdftotext','-bbox',str(pdf),'-']).decode();xml=ET.fromstring(bbox);pages=list(xml.iter('{http://www.w3.org/1999/xhtml}page'));assert len(pages)>=3
 for page in pages:
  w,h=float(page.attrib['width']),float(page.attrib['height']);words=list(page.iter('{http://www.w3.org/1999/xhtml}word'));assert words
  for word in words:
   a=word.attrib;assert float(a['xMin'])>=20 and float(a['xMax'])<=w-20 and float(a['yMin'])>=20 and float(a['yMax'])<=h-20,(paper,a)
 subprocess.run(['pdftoppm','-png','-r','85',str(pdf),str(folder/'page')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 reports.append({'paper':paper,'pages':len(pages),'all_140_numbered_lines_once':True,'first_last_and_Japanese_present':True,'text_boxes_inside_page':True,'page_pngs':len(list(folder.glob('page-*.png'))),'visual_review':'required separately'})
Path('evidence/pdf-report.json').write_text(json.dumps(reports,indent=2)+'\n');print(json.dumps(reports,indent=2))
