# CellPrint

A small offline picker for saved notebook **code-cell source**. Select cells, review the count, then download a self-contained print HTML file and a source-only `.ipynb` excerpt. Japanese and English controls are included.

保存済みのノートブックから必要なコードセルを選び、印刷用 HTML とソースのみの `.ipynb` を作る、小さなオフライン補助ツールです。出力・Markdown・添付は含みません。

## Open and use

Open `dist/cellprint.html` directly in a modern desktop browser. The delivered `cellprint.html` is the same single file. No server, installation, internet, account, kernel, or extension is needed. Blob Workers must be supported and permitted by your browser.

1. Open the synthetic example or choose a saved `.ipynb`
2. Select code cells; imported notebooks start with nothing selected
3. Build the excerpt, then save the print HTML and/or source-only notebook
4. Open the saved print HTML and use the browser's Print command. Choose A4 or Letter and inspect every page before saving a PDF or printing

HTML ファイルを開き、上部のボタンで日本語と英語を切り替えられます。保存した印刷用 HTML はブラウザーの印刷機能で PDF にできます。

The app neither runs notebook code nor alters the original file. Inputs remain in memory and disappear when the page closes. There is no autosave or network path. Changing a selection or starting an import invalidates old downloads. Failed imports retain the previous notebook but leave previous exports unavailable until rebuilt.

## What survives an export

- Only selected code cells, in their original notebook order
- Exact normalized source text: indentation, blank lines, tabs, CR/LF, Unicode, and trailing newlines are preserved; source arrays are joined without separators
- Existing valid v4.5 cell IDs. Legacy v4.0–4.4 cells get deterministic new IDs because those formats do not carry IDs
- Empty cell metadata, empty outputs, and null execution counts. The only generated notebook metadata is `language_info.name = "python"` when Python is recognized; other metadata is discarded

Unselected cells, outputs, Markdown, raw cells, attachments, and original metadata are physically excluded from both generated artifacts. They are not hidden with CSS or retained in JSON/DOM data. This is an excerpt; selected code may depend on omitted code and is not guaranteed to execute independently.

Python gets Prism token colors. Other languages use escaped plain text. The print file has no scripts or remote resources. Source text is treated as text, including HTML-looking code. Long lines wrap and tabs display at four columns. PDF text/layout depends on installed fonts and the browser; exact source fidelity is established in the HTML DOM and `.ipynb`, not by reconstructing source from PDF text.

## Bounds

Supports the strict official nbformat 4.0–4.5 schemas. Inputs are limited to 20 MiB, 1,000 cells, 150,000 JSON nodes, and depth 40. Select at most 32 cells and 200,000 Unicode codepoints. A disposable Worker has an eight-second deadline. Each picker preview is limited to 240 UTF-16 units; full source is never rendered for every imported cell.

Files must be valid UTF-8; an optional leading UTF-8 BOM is accepted. Malformed schema data, missing v4.5 IDs, duplicate/malformed IDs, unsupported versions, NUL/unsupported control characters, and unpaired surrogates are rejected. Error messages do not echo source. This is a strict bounded subset; it is not a repair tool or a general notebook converter.

## Verification status

Local source/package checks and the official native consumer pass. The fixture contains nested indentation, blank lines, tabs, CRLF, NBSP, combining characters, an emoji, Japanese comments, HTML-looking source, a 140-line cell, and unselected/output/metadata sentinels.

`scripts/native-consumer.py` consumes the actual exported excerpt with pinned **nbformat 5.11.1** and **nbconvert 7.17.1 HTMLExporter**, with execution disabled. Independent literal expectations verify source, IDs, order, and absence of excluded data. Four fidelity controls and four official-invalid controls are separate: losing indentation can remain schema-valid while still being a failed excerpt.

[The completed browser/print gate](https://github.com/Masanori-Spec/cell-print/actions/runs/37445963619) passed on exact commit `12046875f25f1746cbed024c618a27c564c0c575`: 25 source/package checks and all four browser tests. The actual downloaded HTML and notebook passed the pinned native consumer and literal-source checks. A4 and Letter each produced four pages; all 140 numbered source lines appeared exactly once, Japanese and first/last markers were present, and text boxes stayed inside page bounds. All eight PDF page images plus JA/EN desktop, mobile, and enlarged-text UI screenshots were inspected without a blocking clipping/overlap finding.

The browser opened the actual single-file app with Chromium sandboxing on Ubuntu 22.04 and networking disabled. The CI-built app matched the delivered offline HTML byte-for-byte. Actual downloads had SHA-256 `d391fa4aeece370d57c7a2589c497f9e389cf4d7014b8760a957680d0ea35ed4` (print HTML) and `b4b45bcd748a34e81ed7a8f87250db4a981efb6d73d579392acc66e56161391f` (notebook excerpt). These checks cover the synthetic fixture and bounded flows, not every notebook/browser/font combination. [Current workflow runs](https://github.com/Masanori-Spec/cell-print/actions/workflows/verify.yml) show outcomes for later published commits.

## Reproduce

```sh
npm ci
npm run verify
python -m venv .venv
.venv/bin/pip install -r requirements-native.txt
.venv/bin/python scripts/native-consumer.py
```

`npm run build` generates standalone validators from the pinned official schemas and embeds the app, Worker, Python highlighter, synthetic example, and full notices into `dist/cellprint.html`. Runtime does not compile or evaluate schema code. CI's browser/PDF steps additionally need Playwright Chromium, Poppler, and Japanese fonts; see `.github/workflows/verify.yml`. No vendor binaries or caches are included in the source deliverable.

## Why this exists

[JupyterLab issue #19975](https://github.com/jupyterlab/jupyterlab/issues/19975) requests printing selected cells with formatting. That request motivates a narrow convenience workflow; it does not validate broad demand or commercial viability. CellPrint works on a saved file and does not add a JupyterLab command or render Markdown.

[nbconvert already supports tag-based cell/input/output removal](https://nbconvert.readthedocs.io/en/latest/removing_cells.html), and [ipynbtopdf.cc advertises local browser notebook printing](https://ipynbtopdf.cc/). The integration explored here is an explicit source-cell picker producing physically selected-only, output-free artifacts without adding tags to the original. No unique algorithm, general converter superiority, or novel product category is claimed. See [research notes](docs/RESEARCH.md).

## Licensing

No license grant is made for original CellPrint code. Bundled Prism 1.30.0 and Ajv 8.17.1 portions retain their complete MIT notices; the ajv-draft-04 1.0.0 generator's MIT notice is also retained. The official nbformat schemas retain their BSD-3-Clause notice. The single offline HTML embeds the full notices; [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) identifies their scope. Python consumers and browser tooling are development dependencies only. Source and offline artifacts contain no third-party binaries, model files, or fonts.
