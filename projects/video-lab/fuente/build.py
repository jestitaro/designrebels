import json, pathlib
here = pathlib.Path(__file__).resolve().parent
site = here.parent
docs = {p.name: p.read_text(encoding="utf-8") for p in sorted((site / "descargas").glob("*.md"))}
t = (here / "template.html").read_text(encoding="utf-8")
payload = json.dumps(docs, ensure_ascii=False).replace("<", "\\u003c")
assert "/*__DOCS__*/" in t
(site / "index.html").write_text(t.replace("/*__DOCS__*/", payload), encoding="utf-8")
print("Listo:", len(docs), "archivos incluidos en index.html")
