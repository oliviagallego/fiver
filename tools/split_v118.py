#!/usr/bin/env python3
"""One-off (16/11/2026): rebuilds src/ from the v118 index.html, because the working sources were lost.

    python3 tools/split_v118.py path/to/v118/index.html

Each piece is an exact run of lines of that file, cut at the section headers the app already had
("/* ---------- RANK ---------- */" and the like). build.py joins them back in the same order, so the
first build gives back the v118 file byte for byte. Keep this script only as a record: once src/ is
edited, running it again would overwrite those edits.
"""
import base64, hashlib, os, re, sys

V118_SHA256 = "121dd4f24178483255b69bcf2ded45b36bde49100ec09cb1e8dafa9be2be529b"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (first line, last line, file) — 1-based, inclusive, for the script block (lines 653–3860).
SCRIPT = [
    (653, 654, "src/gen/glyphs_data.js"),   # MS: the 97 lettering PNGs
    (655, 694, "src/glyphs.js"),            # lettering renderer
    (695, 696, "src/gen/art.js"),           # ART, ARTW: the rat drawings
    (697, 1112, "src/data.js"),             # cards, places, prices
    (1113, 1118, "src/gen/unis.js"),        # UNIS, UNI_PLACES, UNI_BRANCHES (tools/unis.py, lost)
    (1119, 1120, "src/gen/cat15.js"),       # CAT15 (tools/cat15.py, lost)
    (1121, 1131, "src/cat15.js"),           # how CAT15 joins the places
    (1132, 1133, "src/gen/icons.js"),       # ICONS, SUBICO
    (1134, 1163, "src/geom.js"),
    (1164, 1190, "src/pricing.js"),
    (1191, 1201, "src/diet.js"),
    (1202, 1417, "src/rank.js"),
    (1418, 1487, "src/search.js"),
    (1488, 1540, "src/radar.js"),
    (1541, 1694, "src/shared.js"),          # Supabase, Google Places, what the phone keeps, read-menu
    (1695, 1696, "src/gen/drinks_data.js"), # DRINKS (tools/drinks.py, lost)
    (1697, 1834, "src/drinks.js"),
    (1835, 1842, "src/gen/london_data.js"), # LCHAINS, LMEALDEALS, LPINTS, LBARS… (tools/london.py, lost)
    (1843, 1845, "src/gen/westfield.js"),   # WESTFIELD (tools/westfield.py, lost)
    (1846, 2015, "src/london.js"),
    (2016, 2016, "src/gen/intents_data.js"),# INTENTS
    (2017, 2112, "src/intents.js"),
    (2113, 3542, "src/app.js"),
    (3543, 3775, "src/teach_wait.js"),      # a menu photo being read (08/11)
    (3776, 3783, "src/boot.js"),
    (3784, 3860, "src/visits.js"),          # "Were you at X?", visits, Forget me (08/11)
]
STYLE = (31, 638)
WORD_RX = re.compile(r'data:image/png;base64,([A-Za-z0-9+/=]+)"')


def main(path):
    raw = open(path, "rb").read()
    if hashlib.sha256(raw).hexdigest() != V118_SHA256:
        sys.exit("This is not the v118 index.html (sha256 does not match).")
    lines = raw.decode("utf-8").split("\n")[:-1]           # file ends with a newline
    L = [l + "\n" for l in lines]
    assert len(L) == 3863 and L[651] == "<script>\n" and L[3860] == "</script>\n"
    assert L[29] == "<style>\n" and L[638] == "</style>\n"
    pick = lambda a, b: "".join(L[a - 1:b])

    def put(rel, text, binary=False):
        p = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "wb").write(text if binary else text.encode("utf-8"))

    # shell: the page around the style and the script, with the wordmark out as a PNG
    top = pick(1, 30)
    mid = pick(639, 652)
    m = WORD_RX.search(mid)
    put("img/wordmark.png", base64.b64decode(m.group(1)), binary=True)
    mid = mid[:m.start(1)] + "WORDMARK_B64" + mid[m.end(1):]
    put("src/shell.html", top + "/*STYLE*/\n" + mid + "/*SCRIPT*/\n" + pick(3861, 3863))
    put("src/style.css", pick(*STYLE))

    covered = STYLE[1] - STYLE[0] + 1
    nxt = 653
    for a, b, rel in SCRIPT:
        assert a == nxt, (a, nxt)
        put(rel, pick(a, b))
        covered += b - a + 1
        nxt = b + 1
    assert nxt == 3861
    print("src/ written:", len(SCRIPT) + 2, "files + img/wordmark.png")


if __name__ == "__main__":
    main(sys.argv[1])
