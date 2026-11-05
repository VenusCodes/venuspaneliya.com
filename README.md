# venuspaneliya.com

The production site: a static, pre-rendered website with clean URLs, a full SEO and LLM file set, and a sign-in-protected CMS for posts, projects and settings.

```
content/      Everything the CMS edits: posts (Markdown), projects (JSON), settings, lists, stack
public/       Code and assets: css, js (app.js renders every view), images, preview images
admin/        Decap CMS (served at /admin/, sign-in required, never linked from the site)
build/        build.mjs: content + public -> dist/ (pages, sitemap, feeds, llms files, CMS config)
tools/        Image framing and preview-image templates (run locally, needs Chrome)
dist/         The built site. Upload this folder, or let the host build it.
```

## Build and preview

```
npm ci
npm run build        # writes dist/
npm run serve        # http://localhost:4000
```

Node 20 or newer. `SITE_URL` sets the canonical domain (default `https://venuspaneliya.com`).

## What the build produces

- 104 pre-rendered pages with clean URLs: `/`, `/work/<project>/`, `/writing/<post>/`, `/stack/<tech>/`, `/categories/<category>/`, `/services/`, `/about/`, `/contact/`, plus `404.html`. Content is real HTML, readable with JavaScript off.
- Per page: unique title and description, canonical URL, Open Graph and Twitter cards with a branded 1200 by 630 image, and JSON-LD (`WebSite`, `Person` with credentials and `sameAs`, `BreadcrumbList`, `BlogPosting`, `Blog`, `CreativeWork` per project, `Service` and `FAQPage` on Services, `ProfilePage`, `ContactPage`, `CollectionPage` with `ItemList`).
- `sitemap.xml` with image entries for every project screenshot and the portrait.
- `robots.txt` open to search engines and named AI crawlers, `/admin/` disallowed.
- `llms.txt` (llmstxt.org format), `llms-full.txt` (the whole site in Markdown), and a Markdown twin of every page at `<page>/index.md`, linked from each page with `rel="alternate" type="text/markdown"`.
- `feed.xml` (RSS 2.0 with full content) and `feed.json` (JSON Feed 1.1).
- `manifest.webmanifest`, `favicon.ico`, `humans.txt`, `.well-known/security.txt`.
- `_headers` and `_redirects` (Netlify and Cloudflare Pages): security headers, caching, Markdown content types, `noindex` on `/admin/` and the Markdown twins. `vercel.json` does the same on Vercel.
- Old `#project-...` style links from the preview site redirect to the new paths.

## Deploy (Netlify, recommended because of the CMS sign-in)

1. Put this folder in a GitHub repository and connect it to Netlify. `netlify.toml` sets the build (`npm ci && npm run build`, publish `dist`).
2. Add the domain `venuspaneliya.com` and turn on HTTPS.
3. Site settings > Identity: enable Identity, set Registration to **Invite only**, and enable **Git Gateway**.
4. Identity > Invite users: invite your own email. Accept the invite and set a password.
5. Submit `https://venuspaneliya.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## The CMS

Go to `https://venuspaneliya.com/admin/` and sign in. Only invited users can sign in; there is no sign-up and no link to it anywhere on the public site.

- **Posts**: write, edit and publish notes. Drafts are never built into the public site. Every saved change commits to the repository and the site rebuilds in about a minute.
- **Projects**: edit write-ups and upload screenshots. Upload only blurred or anonymised screenshots that are already framed (see below).
- **Site settings**: contact details, availability, stack pages, experience, services, FAQ and testimonials.

`publish_mode: editorial_workflow` gives you Draft, In review and Ready columns before anything goes live. To edit locally without signing in, run `npm run cms` and open `http://localhost:4000/admin/` after `npm run serve`.

## Framing screenshots

Project screenshots carry the venuspaneliya.com border (logo, project, result, email, phone, booking link and the call to action), so the branding stays with the image wherever it is indexed or shared. `tools/frame/` has the template and `render.py` (Python and Playwright with Chrome). Put the raw screenshot in `tools/frame/in/`, add a job, run it, and upload the 1600 by 1000 result in the CMS.

## Preview images

`public/assets/og/` holds one 1200 by 630 preview image per page. `tools/og-template.html` and `tools/og.py` regenerate them. Pages without one fall back to `assets/og-image.png`.

## Not published on purpose

No hourly rate or retainer fee: every engagement is quoted after the call.
