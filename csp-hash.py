"""Berechnet den CSP-Hash des Inline-Skripts neu und trägt ihn in den Kopf ein.
Aufruf: python3 csp-hash.py index.html"""
import base64, hashlib, re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
scripts = re.findall(r'<script>(.*?)</script>', s, re.S)
assert len(scripts) == 1, 'genau ein Inline-Skript erwartet'
h = "sha256-" + base64.b64encode(hashlib.sha256(scripts[0].encode('utf-8')).digest()).decode()
s2 = re.sub(r"script-src '(?:__HASH__|sha256-[A-Za-z0-9+/=]+)'", f"script-src '{h}'", s, count=1)
assert s2 != s or h in s, 'CSP-Eintrag script-src nicht gefunden'
open(p, 'w', encoding='utf-8').write(s2)
print(h)
