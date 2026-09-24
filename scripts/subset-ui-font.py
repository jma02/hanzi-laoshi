"""Build the self-hosted UI subset from an upstream Noto Sans SC variable TTF.

Usage: python scripts/subset-ui-font.py /path/to/NotoSansSC.ttf
Requires fonttools[woff]. Run after changing interface text or corpus characters.
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
font = TTFont(sys.argv[1])
text = "".join(p.read_text() for p in (root / "src").rglob("*")
               if p.is_file() and p.suffix in {".svelte", ".ts", ".html", ".json"})
# Includes the original corpus's traditional forms and all pinyin tone marks.
classroom = TTFont(root / "static/fonts/hanzi-classroom.woff")
unicodes = set(map(ord, text)) | set(classroom.getBestCmap()) | set(range(0x20, 0x250)) | set(range(0x300, 0x370))
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=unicodes)
subsetter.subset(font)
font = instantiateVariableFont(font, {"wght": (400, 700)}, inplace=True)
for record in font["name"].names:
    if record.nameID in {1, 4, 16}:
        record.string = "Hanzi UI".encode(record.getEncoding())
    elif record.nameID == 6:
        record.string = "HanziUI".encode(record.getEncoding())
font.flavor = "woff2"
font.save(root / "static/fonts/hanzi-ui.woff2")
print(f"Saved Hanzi UI: {len(font.getBestCmap())} characters")
