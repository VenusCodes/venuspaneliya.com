import asyncio, json, urllib.parse
from playwright.async_api import async_playwright
jobs=json.load(open('/home/claude/og/jobs.json'))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1200,'height':630}); pg.on('pageerror',lambda e: print('ERR',e))
        for j in jobs:
            q=urllib.parse.urlencode({k:v for k,v in j.items() if k in ('t','k','s','cov','icon')})
            await pg.goto('http://localhost:8790/og-template?'+q,wait_until='load'); await pg.wait_for_timeout(60)
            await pg.screenshot(path=f"/home/claude/prod/public/assets/og/{j['key']}.jpg",type='jpeg',quality=84)
        await b.close()
asyncio.run(main())
