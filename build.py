#!/usr/bin/env python3
"""בונה את index.html מהנתונים ומהתבנית.

הרצה:  python3 build.py

מקור האמת הוא data/ - לא index.html. כל עריכה ידנית ב-index.html
תידרס בבנייה הבאה. להוספת פרומפט: לערוך data/prompts.json ולהריץ מחדש.
"""

import base64
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "index.html"


def read(*parts):
    return (ROOT.joinpath(*parts)).read_text(encoding="utf-8")


def js_literal(obj):
    # json.dumps ולא template literal - כך גרשיים אחוריים וסימני $ בתוכן
    # לא יכולים לשבור את הקוד. ה-</ מוברח כדי ש-</script> בתוך מחרוזת לא יסגור את הבלוק.
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


def main():
    prompts = json.loads(read("data", "prompts.json"))
    guides = json.loads(read("data", "guides.json"))
    starter_rules = read("data", "starter-rules.txt")

    seen = set()
    for p in prompts:
        for field in ("cat", "name", "purpose", "text"):
            if field not in p:
                sys.exit(f"שגיאה: לפרומפט '{p.get('name', '?')}' חסר השדה '{field}'")
        if p["name"] in seen:
            sys.exit(f"שגיאה: הפרומפט '{p['name']}' מופיע פעמיים")
        seen.add(p["name"])

    for i, g in enumerate(sorted(guides, key=lambda g: g["n"]), start=1):
        if g["n"] != i:
            sys.exit(f"שגיאה: מספור המדריכים לא רציף - ציפיתי ל-{i}, קיבלתי {g['n']}")

    logo = base64.b64encode((ROOT / "assets" / "logo-white.png").read_bytes()).decode("ascii")

    page = (read("template", "page.html")
            .replace("{{LOGO}}", "data:image/png;base64," + logo)
            .replace("{{N_PROMPTS}}", str(len(prompts)))
            .replace("{{N_GUIDES}}", str(len(guides))))

    html = "\n".join([
        '<!DOCTYPE html>',
        '<html lang="he" dir="rtl">',
        '<head>',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<title>ספריית הפרומפטים והמדריכים</title>',
        '<style>',
        read("assets", "fonts.css"),
        read("template", "styles.css"),
        '</style>',
        '</head>',
        '<body>',
        page,
        # בלוק 53 הכללים יושב כטקסט גולמי ולא כמחרוזת JS, כדי שהגרשיים
        # האחוריים והגדרות ה-markdown שבתוכו יישמרו בדיוק כפי שהם.
        '<script type="text/plain" id="starter-rules-src">' + starter_rules + '</script>',
        '',
        '<script>',
        'const PROMPTS = ' + js_literal(prompts) + ';',
        'const GUIDES = ' + js_literal(guides) + ';',
        '',
        read("template", "app.js"),
        '</script>',
        '',
        '</body>',
        '</html>',
        '',
    ])

    OUT.write_text(html, encoding="utf-8")
    cats = {}
    for p in prompts:
        cats[p["cat"]] = cats.get(p["cat"], 0) + 1
    print(f"נבנה: {OUT}")
    print(f"  {len(prompts)} פרומפטים ב-{len(cats)} קטגוריות")
    print(f"  {len(guides)} מדריכים")
    print(f"  {OUT.stat().st_size / 1024:.0f}KB")


if __name__ == "__main__":
    main()
