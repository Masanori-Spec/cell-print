from pathlib import Path
import subprocess,sys
base=Path('test-results');notebooks=list(base.rglob('cellprint-excerpt.ipynb'));html=list(base.rglob('cellprint-source.html'));assert len(notebooks)==len(html)==1
subprocess.run([sys.executable,'scripts/native-consumer.py','--notebook',str(notebooks[0]),'--html',str(html[0]),'--report','evidence/browser-native-report.json'],check=True)
