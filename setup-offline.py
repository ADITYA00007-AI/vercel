#!/usr/bin/env python3
"""Run ONCE while online:  python3 setup-offline.py
Downloads MediaPipe Pose, Chart.js and the Google Fonts into vendor/ so the app runs with no internet."""
import io, os, re, tarfile, urllib.request
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
os.makedirs('vendor/mediapipe', exist_ok=True); os.makedirs('vendor/fonts', exist_ok=True)

def untar(url, prefix, dest, only=None):
    t = tarfile.open(fileobj=io.BytesIO(get(url)), mode='r:gz')
    for m in t.getmembers():
        if m.isfile() and m.name.startswith(prefix) and (only is None or only(m.name)):
            out = os.path.join(dest, os.path.basename(m.name)); open(out, 'wb').write(t.extractfile(m).read()); print('  ', out)

print('MediaPipe Pose…'); untar('https://registry.npmjs.org/@mediapipe/pose/-/pose-0.5.1675469404.tgz', 'package/', 'vendor/mediapipe', lambda n: not n.endswith(('.md','package.json','.ts')))
print('Chart.js…');       untar('https://registry.npmjs.org/chart.js/-/chart.js-4.4.0.tgz', 'package/dist/chart.umd.js', 'vendor')
print('Fonts…')
css = get('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400&family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap').decode()
for i, u in enumerate(sorted(set(re.findall(r'url\((https://[^)]+)\)', css)))):
    name = f'f{i}.woff2'; open('vendor/fonts/' + name, 'wb').write(get(u)); css = css.replace(u, name)
open('vendor/fonts/fonts.css', 'w').write(css)
print('Done. Reload the app once online, then it works offline.')
