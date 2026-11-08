import base64,re,sys
src=open(sys.argv[1]).read(); outp=sys.argv[2]
if len(sys.argv) > 4: src=src.replace("const CLOUD = { apiKey:'', projectId:'' };", "const CLOUD = { apiKey:'%s', projectId:'%s' };" % (sys.argv[3], sys.argv[4]), 1)
icon='data:image/png;base64,'+base64.b64encode(open('icon180.png','rb').read()).decode()
title=re.search(r'<title>.*?</title>',src).group(0); links=re.findall(r'<link [^>]*>\n?',src); style=re.search(r'<style>.*?</style>',src,re.S).group(0)
body=src
for part in [title, style]+links: body=body.replace(part,'',1)
body=body.replace('<meta name="claude:viewport-fit-sides" content="cover">','')
out=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{title}
<meta name="description" content="A cozy witch farming game for your phone.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Brambleroot">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#1c1324">
<link rel="apple-touch-icon" href="{icon}">
<link rel="icon" href="{icon}">
{''.join(links)}<style>html,body{{margin:0;height:100%}}[hidden]{{display:none!important}}img{{max-width:100%}}</style>
{style}
</head>
<body>{body.strip()}
</body>
</html>
'''
open(outp,'w').write(out); print(outp, len(out))
