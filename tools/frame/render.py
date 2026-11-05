import asyncio, json, sys, urllib.parse
from playwright.async_api import async_playwright
jobs=json.load(open(sys.argv[1]))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1600,'height':1000})
        for j in jobs:
            q=urllib.parse.urlencode({k:j[k] for k in ['v','img','name','res','n','slug','fit','bg'] if k in j})
            await pg.goto('http://localhost:8766/frame.html?'+q, wait_until='load'); await pg.wait_for_timeout(150)
            await pg.screenshot(path=j['out'], type='png')
        await b.close()
asyncio.run(main())
