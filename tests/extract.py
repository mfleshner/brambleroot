import re,sys
s=open('brambleroot.html').read()
m=list(re.finditer(r'<script>(.*?)</script>',s,re.S))[-1]
open('b.js','w').write(m.group(1))
