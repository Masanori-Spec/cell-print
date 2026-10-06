# Scope, prior work, and evidence

Checked 2026-10-06. This is a modest convenience tool, not evidence of a defensible business or new conversion method.

[JupyterLab #19975](https://github.com/jupyterlab/jupyterlab/issues/19975), opened 2026-10-02, asks for printing a selected cell with syntax colors, indentation, and line breaks. The issue was open when checked. Its request also includes JupyterLab integration and rendered Markdown, which this saved-file, code-source-only workbench does not implement.

[nbconvert's official removal guide](https://nbconvert.readthedocs.io/en/latest/removing_cells.html) already explains removal by tags and regular expressions. CellPrint's difference is the explicit offline picker, script-free print document, and source-only excerpt without modifying/tagging the original notebook. This is a workflow distinction, not a new algorithm or proof that alternatives cannot do it.

[ipynbtopdf.cc](https://ipynbtopdf.cc/) advertises local browser conversion, print layouts, syntax colors, and common outputs. Its claims are first-party product descriptions, not independently audited here. [GizmoBench](https://gizmobench.com/notebook-to-pdf) is another notebook-to-PDF reference from the initial landscape scan; its page could not be fetched in this implementation pass, so no feature/privacy claim about it is used. Demand and commercial viability remain unvalidated.

Official consumer pins:

- [nbformat 5.11.1 source](https://github.com/jupyter/nbformat/tree/75f819f5b60bc6ffc72145c364132efe5b3c4b35)
- [nbconvert 7.17.1 source](https://github.com/jupyter/nbconvert/tree/78ed30837a607deab7cf0a12dca072bf3f63417a)
- [Notebook format documentation](https://nbformat.readthedocs.io/en/latest/format_description.html)

All six vendored schemas are exact bytes from the pinned nbformat 5.11.1 distribution. `vendor/nbformat/provenance.json` records SHA-256 hashes. `requirements-native.txt` pins the complete development consumer environment; no Python package code/binary is bundled in the app.

The PDF gate is independent of notebook schema acceptance. A source excerpt may validate while a browser clips a long page. CI therefore consumes actual downloads, generates A4 and Letter PDFs, checks every expected numbered source line, Japanese text, first/last markers, and page text bounds, and renders every page for visual review. Browser success remains pending until that exact gate finishes and the page images are inspected.
