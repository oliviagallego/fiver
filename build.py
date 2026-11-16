#!/usr/bin/env python3
"""Fed for a Fiver build: joins src/ + img/wordmark.png into one self-contained index.html, plus sw.js.

    python3 build.py              → dist/index.html and dist/sw.js (nothing published changes)
    python3 build.py --publish    → also copies both to the repo root (what GitHub Pages serves)

Only the Python standard library. The cache number comes from VERSION: raise it by one for every delivery,
or phones keep the old copy.
"""
import base64, os, shutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(ROOT, *a)
rd = lambda *a: open(P(*a), encoding="utf-8").read()

# The order matters: later files use what earlier ones define.
SCRIPT = [
    "src/gen/glyphs_data.js", "src/glyphs.js", "src/gen/art.js", "src/data.js",
    "src/gen/unis.js", "src/gen/cat15.js", "src/cat15.js", "src/gen/icons.js",
    "src/geom.js", "src/pricing.js", "src/diet.js", "src/rank.js", "src/search.js", "src/radar.js",
    "src/shared.js", "src/gen/drinks_data.js", "src/drinks.js",
    "src/gen/london_data.js", "src/gen/westfield.js", "src/london.js",
    "src/gen/intents_data.js", "src/intents.js",
    "src/app.js", "src/teach_wait.js", "src/boot.js", "src/visits.js",
]


def build():
    version = rd("VERSION").strip()
    if not version.isdigit():
        sys.exit("VERSION must be a whole number, e.g. 118")
    word = base64.b64encode(open(P("img", "wordmark.png"), "rb").read()).decode()
    js = "".join(rd(f) for f in SCRIPT)
    shell = rd("src", "shell.html")
    for mark in ("/*STYLE*/\n", "/*SCRIPT*/\n", "WORDMARK_B64"):
        if shell.count(mark) != 1:
            sys.exit("src/shell.html must hold " + mark.strip() + " exactly once")
    page = shell.replace("WORDMARK_B64", word).replace("/*STYLE*/\n", rd("src", "style.css")).replace("/*SCRIPT*/\n", js)
    sw = rd("src", "sw.js")
    if sw.count("{{VERSION}}") != 1:
        sys.exit("src/sw.js must hold {{VERSION}} exactly once")
    sw = sw.replace("{{VERSION}}", version)
    os.makedirs(P("dist"), exist_ok=True)
    for name, text in (("index.html", page), ("sw.js", sw)):
        with open(P("dist", name), "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
    print("dist/index.html", len(page.encode()) // 1024, "KB · dist/sw.js cache fiver-v" + version)
    if "--publish" in sys.argv:
        for name in ("index.html", "sw.js"):
            shutil.copyfile(P("dist", name), P(name))
        print("copied to the repo root: index.html, sw.js")


if __name__ == "__main__":
    build()
