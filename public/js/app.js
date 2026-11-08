/* venuspaneliya.com: router, views and the live layer (blog posts and project images). */
(() => {
'use strict';
document.documentElement.classList.add('js');
const S = window.SITE, CATS = window.CATEGORIES, PROJECTS = window.PROJECTS;
const TECHS = window.TECH_GROUPS.flatMap(g => g.items.map(t => Object.assign({}, t, { group: g.name, category: g.category })));
const IMGS = window.PROJECT_IMAGES || {};
const app = document.getElementById('app');
const STATIC = !!(app && app.dataset.route);
const toPath = h => { h = (h || '').replace(/^#/, ''); if (!h || h === 'home') return '/';
  const m = h.match(/^(project|post|category|tech)-([a-z0-9-]+)$/);
  if (m) return { project: '/work/', post: '/writing/', category: '/categories/', tech: '/stack/' }[m[1]] + m[2] + '/';
  return ({ work: '/work/', services: '/services/', about: '/about/', writing: '/writing/', contact: '/contact/', categories: '/categories/', technologies: '/stack/' })[h] || null; };
const fixLinks = root => { if (!STATIC) return; root.querySelectorAll('a[href^="#"]').forEach(a => { const p = toPath(a.getAttribute('href')); if (p) a.setAttribute('href', p); }); };

/* ---------- state ---------- */
const state = {
  posts: window.POSTS.slice(), postsFromDb: false,
  drafts: [], images: {},

  editing: null, workFilter: 'all', writingFilter: 'all', writingQuery: ''
};

/* ---------- helpers ---------- */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const ph = t => `<span class="ph">[${esc(t)}]</span>`;
const cat = s => CATS.find(c => c.slug === s);
const tech = s => TECHS.find(t => t.slug === s);
const proj = s => PROJECTS.find(p => p.slug === s);
const postsIn = c => state.posts.filter(p => p.category === c);
const postsWithTech = t => state.posts.filter(p => (p.techs || []).includes(t));
const projectsWithTech = t => PROJECTS.filter(p => p.techs.includes(t));
const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
let vid = 0;
const vload = (lg = false) => window.VLOAD_SVG.replace('{SIZE}', lg ? ' vp-vload--lg' : '').replace(/\{ID\}/g, 'v' + (++vid));
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
const status = `<p class="vp-status"><span class="vp-status__dot" aria-hidden="true"></span><span class="vp-status__word">${esc(S.availability)}</span></p>`;
const catTag = c => cat(c) ? `<a class="vp-tag tag-link" href="#category-${c}">${esc(cat(c).name)}</a>` : '';
const techTags = list => list.map(t => tech(t)).filter(Boolean).map(t => `<a class="vp-tag tag-link" href="#tech-${t.slug}">${esc(t.name)}</a>`).join('');

/* ---------- small Markdown renderer (escapes everything first) ---------- */
const SQLK = /\b(alter table|enable row level security|create policy|select|from|where|insert into|update|delete|on|using|and|or|create table|references|primary key|not null|returns|begin|end)\b/gi;
function safeUrl(u, img) {
  u = u.trim();
  if (img) return /^(\/_blob\/[A-Za-z0-9_-]+|https:\/\/)/.test(u) ? u : null;
  return /^(https?:\/\/|mailto:|#[A-Za-z0-9-]+$)/.test(u) ? u : null;
}
function inline(t) {
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, u) => { const s = safeUrl(u.replace(/&amp;/g, '&'), true); return s ? `<img src="${esc(s)}" alt="${alt}" loading="lazy">` : m; });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, u) => { const s = safeUrl(u.replace(/&amp;/g, '&')); return s ? `<a href="${esc(s)}"${s.startsWith('http') ? ' rel="noopener"' : ''}>${txt}</a>` : m; });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
function md(src) {
  const lines = esc(src || '').replace(/\r/g, '').split('\n');
  const out = []; let i = 0;
  const isUl = l => /^\s*[-*]\s+/.test(l), isOl = l => /^\s*\d+\.\s+/.test(l);
  const nextNonBlank = j => { while (j < lines.length && !lines[j].trim()) j++; return j; };
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const lang = l.slice(3).trim().toLowerCase(); const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      let code = buf.join('\n');
      if (lang === 'sql') code = code.replace(SQLK, '<span class="vp-code__k">$1</span>');
      out.push(`<pre class="vp-code" tabindex="0"><code>${code}</code></pre>`); continue;
    }
    if (/^#{1,3}\s/.test(l)) { const n = l.match(/^#+/)[0].length; out.push(`<h${n + 1}>${inline(l.replace(/^#+\s/, ''))}</h${n + 1}>`); i++; continue; }
    if (/^&gt;\s?/.test(l)) { const buf = []; while (i < lines.length && /^&gt;\s?/.test(lines[i])) buf.push(lines[i++].replace(/^&gt;\s?/, '')); out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`); continue; }
    if (isUl(l) || isOl(l)) {
      const ordered = isOl(l), test = ordered ? isOl : isUl, strip = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, buf = [];
      while (i < lines.length) {
        if (test(lines[i])) { buf.push(inline(lines[i].replace(strip, ''))); i++; continue; }
        if (!lines[i].trim()) { const j = nextNonBlank(i); if (j < lines.length && test(lines[j])) { i = j; continue; } break; }
        if (buf.length && lines[i - 1] && lines[i - 1].trim()) { buf[buf.length - 1] += '<br>' + inline(lines[i]); i++; continue; }
        break;
      }
      const items = buf.map(x => `<li>${x}</li>`).join('');
      out.push(ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`); continue;
    }
    if (!l.trim()) { i++; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|&gt;|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) buf.push(inline(lines[i++]));
    out.push(`<p>${buf.join('<br>')}</p>`);
  }
  return out.join('\n');
}
const firstPara = body => { const p = (body || '').split(/\n\s*\n/).find(x => x.trim() && !x.startsWith('```') && !x.startsWith('#')); return p ? p.replace(/[*_`#>\[\]]/g, '').replace(/\(([^)]*)\)/g, '').trim().slice(0, 260) : ''; };

/* ---------- shared pieces ---------- */
function pageHead({ crumbs = [], title, lede = '', extra = '' }) {
  const bc = crumbs.length ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}<li aria-current="page">${esc(title)}</li></ol></nav>` : '';
  return `<header class="page-head"><div class="vp-container">${bc}<h1 class="page-head__title" tabindex="-1">${esc(title)}</h1>${lede ? `<p class="page-head__lede">${lede}</p>` : ''}${extra}</div></header>`;
}
function techIcon(slug, cls = '') {
  const t = tech(slug), I = window.TECH_ICONS || { brand: {}, line: {} }; if (!t) return '';
  if (I.brand[t.icon]) return `<span class="tlogo ${cls}"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${I.brand[t.icon]}"/></svg></span>`;
  return `<span class="tlogo tlogo--line ${cls}"><svg viewBox="0 0 24 24" aria-hidden="true">${I.line[t.icon] || ''}</svg></span>`;
}
const techChip = slug => { const t = tech(slug); return t ? `<a class="tchip" href="#tech-${t.slug}">${techIcon(slug)}<span>${esc(t.name)}</span></a>` : ''; };
const techChips = list => `<div class="tchips">${list.map(techChip).join('')}</div>`;
function cover(p, big) {
  const g = IMGS[p.slug]; if (g && g.length) return { src: big ? g[0].src : g[0].thumb, alt: g[0].alt };
  return null;
}
function media(p, big = false) {
  const c = cover(p, big);
  if (c) return `<div class="pmedia${big ? ' pmedia--big' : ''}"><img src="${esc(c.src)}" alt="${esc(c.alt)}" ${big ? 'fetchpriority="high"' : 'loading="lazy"'} width="1600" height="1000"><span class="pmedia__fallback vp-dotgrid">${ph('BLURRED SCREENSHOT TO COME')}</span></div>`;
  return `<div class="pmedia pmedia--type${big ? ' pmedia--big' : ''}" role="img" aria-label="${esc(p.name)}: ${esc(p.result)}"><img class="pmedia__mark" src="assets/vmark.svg" alt=""><span class="pmedia__n">${p.n}</span><span class="pmedia__name">${esc(p.name)}</span><span class="pmedia__res">${esc(p.result)}</span><img class="pmedia__logo" src="assets/logo-primary.svg" alt=""></div>`;
}
function gallery(p) {
  const g = IMGS[p.slug] || []; if (!g.length) return media(p, true);
  return `<div class="gallery" data-gallery="${p.slug}">
    <button type="button" class="gallery__main" data-open-img="0" aria-label="Open screenshot 1 of ${g.length}: ${esc(g[0].caption)}"><img src="${esc(g[0].src)}" alt="${esc(g[0].alt)}" width="1600" height="1000" fetchpriority="high"></button>
    ${g.length > 1 ? `<ul class="gallery__thumbs">${g.map((im, i) => `<li><button type="button" class="gallery__thumb" data-open-img="${i}" aria-label="Open screenshot ${i + 1} of ${g.length}: ${esc(im.caption)}"><img src="${esc(im.thumb)}" alt="" loading="lazy" width="800" height="500"><span>${esc(im.caption)}</span></button></li>`).join('')}</ul>` : ''}
  </div>`;
}
const projectCard = p => `<li><a class="pcard" href="#project-${p.slug}">${media(p)}<div class="pcard__body"><p class="pcard__meta"><span class="num">${p.n}</span><span class="vp-tag">${esc(cat(p.category).name)}</span></p><h3 class="pcard__name">${esc(p.name)}</h3><p class="pcard__result">${esc(p.result)}</p>${p.techs.length ? `<p class="pcard__techs">${p.techs.slice(0, 5).map(t => techIcon(t, 'tlogo--sm')).join('')}</p>` : ''}</div></a></li>`;
const projectGrid = list => list.length ? `<ul class="pgrid">${list.map(projectCard).join('')}</ul>` : `<p class="empty">No project write-ups here yet.</p>`;
const wordsOf = p => ((p.body || '') + ' ' + (p.excerpt || '')).replace(/[`*#>\[\]()_-]/g, ' ').split(/\s+/).filter(Boolean).length;
const readTime = p => `${Math.max(1, Math.round(wordsOf(p) / 220))} min read`;
const PROD = 'https://venuspaneliya.com';
const avatar = (cls = '') => S.portrait ? `<img class="byline__img ${cls}" src="${S.portrait}" alt="" width="40" height="40" loading="lazy">` : `<span class="vp-avatar ${cls}" aria-hidden="true">VP</span>`;
const byline = (p, big = false) => `<div class="byline${big ? ' byline--big' : ''}">${avatar()}<div><p class="byline__name">Venus Paneliya</p><p class="byline__meta">${big ? 'Full-stack AI engineer. ' : ''}${esc(readTime(p))}${p.publishedAt ? `, ${esc(fmtDate(p.publishedAt))}` : ''}${p.linkedin ? ', also on LinkedIn' : ''}</p></div></div>`;
const postCard = (p, feature = false) => `<li class="bcard-li${feature ? ' bcard-li--feature' : ''}"><a class="bcard${feature ? ' bcard--feature' : ''}" href="#post-${p.slug}">
  <p class="bcard__top"><span class="vp-tag">${esc(cat(p.category)?.name || '')}</span><span class="bcard__time">${esc(readTime(p))}</span></p>
  <h3 class="bcard__title">${esc(p.title)}</h3>
  ${p.excerpt ? `<p class="bcard__excerpt">${esc(p.excerpt)}</p>` : ''}
  <div class="bcard__foot">${avatar('byline__img--sm')}<span>Venus Paneliya</span><span class="bcard__read">Read${ic('arrow-right')}</span></div>
</a></li>`;
const postRow = p => `<li><a class="post" href="#post-${p.slug}"><span class="post__n">${esc(readTime(p))}</span><span class="post__main"><span class="post__title">${esc(p.title)}</span>${p.excerpt ? `<span class="post__excerpt">${esc(p.excerpt)}</span>` : ''}</span><span class="post__topic">${esc(cat(p.category)?.name || '')}</span></a></li>`;
const postList = list => list.length ? `<ol class="posts">${list.map(postRow).join('')}</ol>` : `<p class="empty">No notes here yet.</p>`;
const postGrid = (list, feature = false) => list.length ? `<ul class="bgrid">${list.map((p, i) => postCard(p, feature && i === 0)).join('')}</ul>` : `<p class="empty">No notes match that yet.</p>`;
const ctaBand = (title = 'Send me your prototype’s link.', text = 'I read every message the same day. Then twenty minutes on a call about what breaks first.') =>
  `<section class="cta-band"><div class="vp-container cta-band__inner"><div><h2 class="cta-band__title">${esc(title)}</h2><p>${esc(text)}</p></div><div class="cta-band__actions"><a class="vp-btn vp-btn--primary vp-btn--lg" href="#contact">Get in touch${ic('arrow-right')}</a><a class="vp-btn vp-btn--lg" href="${S.whatsapp}" rel="noopener">${ic('whatsapp')}WhatsApp ${S.phone}</a></div></div></section>`;
const sectionHead = (title, lede = '', action = '') => `<div class="vp-section-head${action ? ' vp-section-head--split' : ''}"><div><h2 class="vp-section-head__title">${esc(title)}</h2>${lede ? `<p class="vp-section-head__lede">${lede}</p>` : ''}</div>${action}</div>`;
const quotes = () => `<div class="quotes__grid">${window.TESTIMONIALS.map(t => `<figure class="vp-quote"><blockquote class="vp-quote__text"><p>“${esc(t.quote)}”</p></blockquote><figcaption class="vp-quote__by"><span class="vp-avatar" aria-hidden="true">${t.initials}</span><span><span class="vp-quote__name">${esc(t.name)}</span><span class="vp-quote__role">${esc(t.role)}</span></span></figcaption></figure>`).join('')}</div>`;
const offers = (full = true) => `<div class="offers">${window.OFFERS.map(o => `<article class="vp-domain offer"><h3 class="vp-domain__title">${esc(o.name)}</h3><p class="vp-domain__text">${esc(o.what)}</p>${full ? `<dl class="offer__facts">${o.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}</article>`).join('')}</div><p class="pricing-note">${ic('info')}<span>Every engagement is quoted after the 20-minute call, because no two products need the same work. <a class="text-link" href="#contact">Ask for a quote</a></span></p>`;
const chips = (key, opts) => `<div class="vp-chips filter" role="group" aria-label="Filter by category">${opts.map(([v, label, n]) => `<button type="button" class="vp-chip" data-filter="${key}" data-value="${v}" aria-pressed="${state[key] === v}">${esc(label)} <span class="vp-chip__count">${n}</span></button>`).join('')}</div>`;
const sortPosts = list => list.slice().sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '') || (a.n || 99) - (b.n || 99));

/* ---------- views ---------- */
const V = {};

V.home = () => {
  const lead = PROJECTS[0], cs = lead.caseStudy;
  return { title: null, html: `
<section class="hero"><div class="vp-container hero__grid">
  <div class="hero__copy">
    ${status}
    <h1 class="hero__title" tabindex="-1"><span class="hero__line">Prototype in.</span> <span class="hero__line">Production out<span class="vp-dot hero__dot" aria-hidden="true"></span><span class="sr">.</span></span></h1>
    <p class="hero__lede">Your AI-built SaaS works in the demo. I make it work in production. I take prototypes from Cursor, v0, Bolt, Lovable and ChatGPT and fix what they skipped: architecture, security, multi-tenancy and payments.</p>
    <div class="hero__actions"><a class="vp-btn vp-btn--primary vp-btn--lg" href="#contact">Send me your prototype’s link${ic('arrow-right')}</a><a class="vp-btn vp-btn--lg" href="#work">See the work</a></div>
    <p class="hero__who">Venus Paneliya, full-stack AI engineer (${esc(S.stackLine)}). Based in Surat, India.</p>
  </div>
  ${auditFigure()}
</div></section>

<section class="vp-section"><div class="vp-container">
  ${sectionHead('What changed once it shipped', 'Figures from systems I built and run in production.')}
  <div class="metrics">${window.METRICS.map(([v, l], i) => `<div class="vp-metric${i === 0 ? ' metric--lead' : ''}"><p class="vp-metric__value">${esc(v)}</p><p class="vp-metric__label">${esc(l)}</p></div>`).join('')}</div>
</div></section>

<section class="vp-section"><div class="vp-container">
  ${sectionHead('Eight systems, now in production', 'Payments, AI, cloud and fintech. Client names stay private.', '<a class="vp-btn" href="#work">See all eight</a>')}
  <a class="feature-case" href="#project-${lead.slug}">
    ${media(lead, true)}
    <div class="feature-case__body">
      <p class="pcard__meta"><span class="num">${lead.n}</span><span class="vp-tag">${esc(cat(lead.category).name)}</span></p>
      <h3 class="feature-case__title">${esc(cs.title)}</h3>
      <p class="feature-case__text">${esc(cs.context)} ${esc(cs.decision)}</p>
      <ul class="mini-results">${cs.results.slice(0, 2).map(([v, l]) => `<li><span>${esc(v)}</span> ${esc(l)}</li>`).join('')}</ul>
      <span class="text-link">Read the case study${ic('arrow-right')}</span>
    </div>
  </a>
  ${projectGrid(PROJECTS.slice(1, 4))}
</div></section>

<section class="vp-section"><div class="vp-container">
  ${sectionHead('Three ways to work together', 'Each one starts with a 20-minute call.', '<a class="vp-btn" href="#services">See how I work</a>')}
  ${offers(false)}
</div></section>

<section class="vp-section"><div class="vp-container">
  ${sectionHead('What clients and leads say')}
  ${quotes()}
</div></section>

<section class="vp-section"><div class="vp-container">
  ${sectionHead('Notes from production', 'For founders: what AI tools skip, and what it costs later.', '<a class="vp-btn" href="#writing">Read all notes</a>')}
  ${postGrid(sortPosts(state.posts).slice(0, 3))}
</div></section>
${ctaBand()}`, mount: mountAudit };
};

function auditFigure() {
  const rows = (list) => list.map(([ok, area, note]) => `<li><span class="${ok ? 'ok' : 'bad'}" aria-hidden="true">${ok ? '✓' : '✕'}</span><span class="${ok ? 'ok' : 'bad'}">${ok ? 'pass' : 'fail'}</span><span class="audit__area">${area}</span><span class="audit__note">${note}</span></li>`).join('');
  return `<figure class="audit" aria-labelledby="audit-cap"><div class="audit__box">
  <div class="audit__bar"><span class="audit__name">audit example-app</span><div class="audit__tabs" role="tablist" aria-label="Audit state">
    <button type="button" role="tab" id="tab-in" aria-controls="audit-in" aria-selected="true">Prototype in</button>
    <button type="button" role="tab" id="tab-out" aria-controls="audit-out" aria-selected="false" tabindex="-1">Production out</button></div></div>
  <div class="audit__panel" role="tabpanel" id="audit-in" aria-labelledby="tab-in"><p class="audit__cmd"><span class="muted">$</span> audit --week-one</p><ul class="audit__list">${rows([[0, 'tenancy', 'tenant_id filter only, no row-level security'], [0, 'payments', 'payout state lives in Stripe webhooks'], [0, 'ai cost', 'no token caps, cost grows with every user'], [0, 'security', 'no rate limits on public endpoints'], [1, 'demo', 'works for one user, on one laptop']])}</ul><p class="audit__sum"><span class="bad">4 risks</span> <span class="muted">written up in the week one report</span></p></div>
  <div class="audit__panel" role="tabpanel" id="audit-out" aria-labelledby="tab-out" hidden><p class="audit__cmd"><span class="muted">$</span> audit --after-stabilise</p><ul class="audit__list">${rows([[1, 'tenancy', 'row-level security on every table'], [1, 'payments', 'ledger is the record, Stripe is the rail'], [1, 'ai cost', 'server-side token caps keep cost flat'], [1, 'security', 'per-tenant rate limits'], [1, 'handover', 'every decision written down']])}</ul><p class="audit__sum"><span class="ok">0 risks open</span> <span class="muted">ready for real customers</span></p></div>
  </div><figcaption id="audit-cap" class="audit__cap">Sample audit of an example app, to show what the week one report covers. Not client data.</figcaption></figure>`;
}

V.work = () => {
  const counts = CATS.map(c => [c.slug, c.name, PROJECTS.filter(p => p.category === c.slug).length]).filter(c => c[2]);
  const list = state.workFilter === 'all' ? PROJECTS : PROJECTS.filter(p => p.category === state.workFilter);
  return { title: 'Work', desc: 'Eight systems in production: payments, AI engineering, cloud, fintech and SaaS.', html: `
${pageHead({ title: 'Eight systems, now in production', lede: 'Each one has its own page. Client names stay private. The creator payouts case has the full story; the others carry their one-line facts until their write-ups are ready.' })}
<section class="vp-section vp-section--tight"><div class="vp-container">
  ${chips('workFilter', [['all', 'All', PROJECTS.length], ...counts])}
  <div id="work-list">${projectGrid(list)}</div>
  <p class="browse">Browse by <a class="text-link" href="#categories">category</a> or by <a class="text-link" href="#technologies">technology</a>.</p>
</div></section>${ctaBand()}`, mount: mountFilters };
};

V.project = slug => {
  const p = proj(slug); if (!p) return null;
  const i = PROJECTS.indexOf(p), prev = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
  const c = cat(p.category), cs = p.caseStudy;
  const related = p.relatedPost ? state.posts.find(x => x.slug === p.relatedPost) : null;
  const sameCat = PROJECTS.filter(x => x.category === p.category && x !== p);
  const stackRow = p.techs.length ? p.techs.map(t => `<a class="inline-link" href="#tech-${t}">${esc(tech(t).name)}</a>`).join(', ') : ph('STACK TO ADD');
  const caseBlock = cs ? `
  <div class="case">
    <div class="case__main">
      <h2 class="case__title">${esc(cs.title)}</h2>
      <p class="case__context">${esc(cs.context)}</p>
      <table class="vp-spec case__spec"><tr><th scope="row">My role</th><td>${esc(cs.role)}</td></tr><tr><th scope="row">Timeline</th><td>${esc(cs.timeline)}</td></tr><tr><th scope="row">Domain</th><td>${esc(cs.domain)}</td></tr><tr><th scope="row">Stack</th><td>${stackRow}</td></tr></table>
      <div class="case__story"><div><h3 class="case__h">The problem</h3><p>${esc(cs.problem)}</p></div><div><h3 class="case__h">The decision</h3><p>${esc(cs.decision)}</p></div></div>
    </div>
    <div class="case__side">
      <figure class="ledger"><div class="ledger__scroll" tabindex="0" role="region" aria-label="Sample payout ledger"><table>
        <thead><tr><th scope="col">Creator</th><th scope="col" class="num">Amount</th><th scope="col">Stripe webhook</th><th scope="col">Ledger</th></tr></thead>
        <tbody><tr><td>Example Studio A</td><td class="num">$1,240.00</td><td><span class="ok">✓</span> received</td><td><span class="ok">✓</span> paid</td></tr>
        <tr class="ledger__hit"><td>Example Studio B</td><td class="num">$860.00</td><td><span class="bad">✕</span> dropped</td><td><span class="ok">✓</span> paid on retry</td></tr>
        <tr><td>Example Studio C</td><td class="num">$415.50</td><td><span class="ok">✓</span> received</td><td><span class="ok">✓</span> paid</td></tr></tbody></table></div>
        <figcaption>Sample data with example names. With the ledger as the record, a dropped webhook gets retried instead of lost.</figcaption></figure>
      <ul class="case__results" aria-label="Results">${cs.results.map(([v, l]) => `<li><span class="case__rv">${esc(v)}</span><span>${esc(l)}</span></li>`).join('')}</ul>
    </div>
  </div>` : '';
  const detail = p.problem || cs ? `
  ${caseBlock}
  ${!cs ? `<div class="pdetail">
    <div class="pdetail__main"><h2 class="sub-h sub-h--first">The problem</h2><p class="pdetail__lead">${esc(p.problem)}</p></div>
    <table class="vp-spec pdetail__spec"><tr><th scope="row">Result</th><td>${esc(p.result)}</td></tr><tr><th scope="row">Category</th><td><a class="inline-link" href="#category-${c.slug}">${esc(c.name)}</a></td></tr><tr><th scope="row">Stack</th><td>${stackRow}</td></tr></table>
  </div>
  <ul class="metrics metrics--project">${p.results.map(([v, l]) => `<li class="vp-metric"><p class="vp-metric__value">${esc(v)}</p><p class="vp-metric__label">${esc(l)}</p></li>`).join('')}</ul>` : ''}
  ${p.approach ? `<h2 class="sub-h">What I did</h2><ol class="steps">${p.approach.map(([h, t]) => `<li><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>` : ''}
  ${p.features ? `<h2 class="sub-h">What it does</h2><ul class="checks">${p.features.map(f => `<li>${ic('check')}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
  ${p.testimonial ? `<figure class="vp-quote pquote"><blockquote class="vp-quote__text"><p>“${esc(p.testimonial.quote)}”</p></blockquote><figcaption class="vp-quote__by"><span class="vp-avatar" aria-hidden="true">${esc(p.testimonial.name.split(' ').map(x => x[0]).join(''))}</span><span><span class="vp-quote__name">${esc(p.testimonial.name)}</span><span class="vp-quote__role">${esc(p.testimonial.role)}</span></span></figcaption></figure>` : ''}` : `
  <div class="pfacts">
    <table class="vp-spec">
      <tr><th scope="row">Result</th><td>${esc(p.result)}</td></tr>
      <tr><th scope="row">Category</th><td><a class="inline-link" href="#category-${c.slug}">${esc(c.name)}</a></td></tr>
      <tr><th scope="row">What it is</th><td>${esc(p.note)}</td></tr>
      <tr><th scope="row">Stack</th><td>${stackRow}</td></tr>
    </table>
    <div class="vp-callout">${ic('info', 'vp-callout__icon')}<div><strong class="vp-callout__title">Full write-up to come.</strong><p>Only the one-line facts are public for this project so far. ${ph('PROBLEM, DECISION AND RESULTS FOR THIS PROJECT')}</p></div></div>
  </div>`;
  return { title: p.name, desc: `${p.name}: ${p.result}. ${p.note}`, html: `
${pageHead({ crumbs: [['Work', '#work']], title: p.name, lede: esc(p.note), extra: `<p class="phead__result">${esc(p.result)}</p><div class="tag-row">${catTag(p.category)}</div>${p.techs.length ? techChips(p.techs) : ''}` })}
<section class="vp-section vp-section--tight"><div class="vp-container">
  <div class="pmedia-wrap">${gallery(p)}</div>
  ${detail}
  ${related ? `<h2 class="sub-h">Related note</h2>${postList([related])}` : ''}
  ${sameCat.length ? `<h2 class="sub-h">More in ${esc(c.name)}</h2>${projectGrid(sameCat)}` : ''}
  <nav class="pager" aria-label="More projects"><a href="#project-${prev.slug}" class="pager__link">${ic('arrow-left')}<span><span class="pager__k">Previous</span>${esc(prev.name)}</span></a><a href="#project-${next.slug}" class="pager__link pager__link--next"><span><span class="pager__k">Next</span>${esc(next.name)}</span>${ic('arrow-right')}</a></nav>
</div></section>${ctaBand()}`, mount: () => mountGallery(p) };
};

function mountGallery(p) {
  const g = IMGS[p.slug] || [], root = app.querySelector('[data-gallery]'); if (!root || !g.length) return;
  let dlg = document.getElementById('lightbox');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'lightbox'; dlg.className = 'lightbox'; document.body.appendChild(dlg); }
  let at = 0, opener = null;
  const show = i => { at = (i + g.length) % g.length; const im = g[at];
    dlg.innerHTML = `<div class="lightbox__bar"><p class="lightbox__cap"><span class="num">${at + 1} / ${g.length}</span> ${esc(im.caption)}</p><button type="button" class="vp-btn vp-btn--sm" data-lb="close">${ic('x')}Close</button></div><img src="${esc(im.src)}" alt="${esc(im.alt)}" width="1600" height="1000">${g.length > 1 ? `<div class="lightbox__nav"><button type="button" class="vp-btn vp-btn--sm" data-lb="prev">${ic('arrow-left')}Previous</button><button type="button" class="vp-btn vp-btn--sm" data-lb="next">Next${ic('arrow-right')}</button></div>` : ''}`; };
  root.addEventListener('click', e => { const b = e.target.closest('[data-open-img]'); if (!b) return; opener = b; show(+b.dataset.openImg); try { dlg.showModal(); } catch (err) { dlg.setAttribute('open', ''); } const c = dlg.querySelector('[data-lb="close"]'); if (c) c.focus(); });
  dlg.onclick = e => { const b = e.target.closest('[data-lb]'); if (e.target === dlg || (b && b.dataset.lb === 'close')) { dlg.close(); return; } if (b) { show(at + (b.dataset.lb === 'next' ? 1 : -1)); const f = dlg.querySelector(`[data-lb="${b.dataset.lb}"]`); if (f) f.focus(); } };
  dlg.onkeydown = e => { if (e.key === 'ArrowRight') show(at + 1); if (e.key === 'ArrowLeft') show(at - 1); };
  dlg.onclose = () => { if (opener) opener.focus(); };
}

V.services = () => ({ title: 'Services', desc: 'Hourly audits and fixes, a monthly retainer, or a full-time remote hire. Each starts with a 20-minute call.', html: `
${pageHead({ title: 'Three ways to work together', lede: 'Each one starts with a 20-minute call.' })}
<section class="vp-section vp-section--tight"><div class="vp-container">
  ${offers(true)}
  <h2 class="sub-h">How a project runs</h2>
  <ol class="process">${window.PROCESS.map(([h, t], i) => `<li><span class="process__n">${i + 1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
  <div class="faq"><h2 class="sub-h faq__title">Questions founders ask</h2><div class="faq__list">${window.FAQ.map(([q, a]) => `<details class="faq__item"><summary><span>${esc(q)}</span>${ic('plus')}</summary><p>${esc(a)}</p></details>`).join('')}</div></div>
  <h2 class="sub-h">After you get in touch</h2>
  <ol class="next next--row"><li><strong>I read it.</strong> Your message and the product link, the same day.</li><li><strong>We talk.</strong> Twenty minutes on what breaks first.</li><li><strong>You get a plan.</strong> Hourly fix, audit, retainer or a full-time conversation.</li></ol>
</div></section>${ctaBand()}` });

V.about = () => ({ title: 'About', desc: 'Venus Paneliya, full-stack AI engineer in Surat, India. Experience, education and skills.', html: `
${pageHead({ title: 'One developer. Full ownership. Production-ready software.' })}
<section class="vp-section vp-section--tight"><div class="vp-container about__grid">
  <div class="about__side">${S.portrait ? `<img class="portrait" src="${S.portrait}" alt="Portrait of Venus Paneliya" width="900" height="1125">` : `<div class="portrait vp-dotgrid" role="img" aria-label="Portrait of Venus Paneliya, still to be supplied">${ph('PORTRAIT OF VENUS')}</div>`}${status}
    <p class="about__phone">${ic('phone')}<a href="${S.tel}">${S.phone}</a></p><div class="about__links"><a class="vp-btn vp-btn--sm" href="${S.whatsapp}" rel="noopener">${ic('whatsapp')}WhatsApp</a><a class="vp-btn vp-btn--sm" href="${S.linkedin}" rel="noopener">${ic('linkedin')}LinkedIn</a><a class="vp-btn vp-btn--sm" href="${S.github}" rel="noopener">${ic('github')}GitHub</a><a class="vp-btn vp-btn--sm" href="${S.upwork}" rel="noopener">${ic('briefcase')}Upwork</a></div></div>
  <div class="about__main">
    <div class="about__intro"><p>I’m Venus Paneliya, a full-stack AI engineer working in MERN, Next.js and TypeScript, moving toward AI solutions architecture.</p><p>AI tools are the best first developer you’ll ever have. But they’re not the last developer you’ll need. I take what they built and make it production-grade, across web and mobile, for founders and teams in the US, UK, EU, Middle East and APAC. I work from Surat, India.</p></div>
    <h2 class="sub-h">Experience</h2>
    <div class="roles">${window.EXPERIENCE.map(r => `<div class="vp-role"><div class="vp-role__when">${esc(r.when)}<br>${esc(r.where)}</div><div><h3 class="vp-role__title">${esc(r.title)}</h3><p class="vp-role__org">${esc(r.org)}</p><p class="role__text">${esc(r.text)}</p></div></div>`).join('')}</div>
    <h2 class="sub-h">Education and certificates</h2>
    <table class="vp-spec">${window.EDUCATION.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
    <h2 class="sub-h">Stack</h2>
    <div class="about__stack">${window.TECH_GROUPS.map(g => `<div class="about__group"><h3>${esc(g.name)}</h3>${techChips(g.items.map(t => t.slug))}</div>`).join('')}</div>
  </div>
</div></section>
<section class="vp-section"><div class="vp-container">${sectionHead('What clients and leads say')}${quotes()}</div></section>${ctaBand()}` });

V.writing = () => {
  const counts = CATS.map(c => [c.slug, c.name, postsIn(c.slug).length]).filter(c => c[2]);
  const all = sortPosts(state.posts), list = filteredPosts(all);
  return { title: 'Writing', desc: `Notes from production by Venus Paneliya: ${all.length} posts for founders on what AI tools skip, payments, multi-tenancy, security and hiring developers.`, html: `
${pageHead({ title: 'Notes from production', lede: 'For founders: what AI tools skip, and what it costs later. Written from the systems I build and run.', extra: `<div class="page-head__actions"><a class="vp-btn vp-btn--sm" href="${S.linkedinPosts}" rel="noopener">${ic('linkedin')}Follow on LinkedIn</a></div>` })}
<section class="vp-section vp-section--tight"><div class="vp-container">
  <div class="blog-tools">
    ${counts.length > 1 ? chips('writingFilter', [['all', 'All', all.length], ...counts]) : ''}
    <label class="blog-search"><span class="sr">Search the notes</span>${ic('search')}<input class="vp-input" type="search" id="blog-q" placeholder="Search the notes" value="${esc(state.writingQuery || '')}" autocomplete="off"></label>
  </div>
  <div id="writing-list">${postGrid(list, state.writingFilter === 'all' && !state.writingQuery)}</div>
</div></section>${ctaBand()}`, mount: () => { mountFilters(); const q = document.getElementById('blog-q'); if (q) q.addEventListener('input', () => { state.writingQuery = q.value; document.getElementById('writing-list').innerHTML = postGrid(filteredPosts(sortPosts(state.posts)), false); }); } };
};
function filteredPosts(all) {
  const q = (state.writingQuery || '').trim().toLowerCase();
  return all.filter(p => (state.writingFilter === 'all' || p.category === state.writingFilter) && (!q || (p.title + ' ' + p.excerpt + ' ' + p.body).toLowerCase().includes(q)));
}

V.post = slug => {
  const p = state.posts.find(x => x.slug === slug);
  if (!p) return null;
  const c = cat(p.category);
  const all = sortPosts(state.posts), idx = all.indexOf(p);
  const more = all.filter(x => x.category === p.category && x !== p).slice(0, 3);
  const fill = more.length < 3 ? all.filter(x => x !== p && !more.includes(x)).slice(0, 3 - more.length) : [];
  const relProj = p.project ? proj(p.project) : PROJECTS.find(x => x.relatedPost === p.slug);
  const url = `${PROD}/writing/${p.slug}/`;
  const body = p.body && p.body.trim() ? `<div class="vp-prose article__prose">${md(p.body)}</div>` :
    `<div class="vp-callout">${ic('info', 'vp-callout__icon')}<div><strong class="vp-callout__title">This note is on LinkedIn.</strong><p>Read it there for now.</p></div></div>`;
  const prev = all[idx - 1], next = all[idx + 1];
  return { title: p.title, desc: p.excerpt || firstPara(p.body) || p.title, html: `
<article class="article" itemscope itemtype="https://schema.org/BlogPosting">
  <header class="page-head article__head"><div class="vp-container article__headin">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="#writing">Writing</a></li><li><a href="#category-${c.slug}">${esc(c.name)}</a></li><li aria-current="page">${esc(p.title)}</li></ol></nav>
    <h1 class="article__title" tabindex="-1" itemprop="headline">${esc(p.title)}</h1>
    ${byline(p, true)}
  </div></header>
  <div class="vp-container article__layout">
    <div class="article__main" itemprop="articleBody">
      ${body}
      ${p.carousel ? `<div class="vp-callout article__doc">${ic('info', 'vp-callout__icon')}<div><strong class="vp-callout__title">This post came with a document.</strong><p>${esc(p.carousel)} is attached to the post on LinkedIn.</p><div class="enquiry__actions"><a class="vp-btn vp-btn--sm" href="${S.linkedinPosts}" rel="noopener">${ic('linkedin')}See it on LinkedIn</a></div></div></div>` : ''}
      <div class="article__tags">${catTag(p.category)}${techTags(p.techs || [])}</div>
      <div class="share" aria-label="Share this note"><span class="share__k">Share</span>
        <a class="vp-btn vp-btn--sm" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" rel="noopener">${ic('linkedin')}LinkedIn</a>
        <a class="vp-btn vp-btn--sm" href="https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.title)}" rel="noopener">X</a>
        <a class="vp-btn vp-btn--sm" href="https://wa.me/?text=${encodeURIComponent(p.title + ' ' + url)}" rel="noopener">${ic('whatsapp')}WhatsApp</a>
        <button type="button" class="vp-btn vp-btn--sm" data-copy="${esc(url)}">${ic('copy')}Copy link</button>
        <span class="share__msg" role="status"></span>
      </div>
      <aside class="author" aria-label="About the author">
        ${S.portrait ? `<img class="author__img" src="${S.portrait}" alt="Venus Paneliya" width="96" height="96" loading="lazy">` : ''}
        <div><p class="author__name">Venus Paneliya</p><p class="author__role">Full-stack AI engineer. I take AI-built SaaS prototypes and make them production-grade: architecture, security, multi-tenancy and payments.</p>
        <div class="enquiry__actions"><a class="vp-btn vp-btn--primary vp-btn--sm" href="#contact">Send me your prototype’s link</a><a class="vp-btn vp-btn--sm" href="${S.booking}" rel="noopener">${ic('calendar')}Book a 20-minute call</a></div></div>
      </aside>
    </div>
    <aside class="article__side">
      ${relProj ? `<div class="side-card"><p class="side-card__k">The project behind this note</p>${projectGrid([relProj])}</div>` : ''}
      <div class="side-card"><p class="side-card__k">Work with me</p><p>One developer. Full ownership. Production-ready software.</p><a class="text-link" href="#services">See how I work${ic('arrow-right')}</a></div>
    </aside>
  </div>
  <nav class="vp-container pager pager--posts" aria-label="More notes">${prev ? `<a href="#post-${prev.slug}" class="pager__link">${ic('arrow-left')}<span><span class="pager__k">Newer</span>${esc(prev.title)}</span></a>` : '<span></span>'}${next ? `<a href="#post-${next.slug}" class="pager__link pager__link--next"><span><span class="pager__k">Older</span>${esc(next.title)}</span>${ic('arrow-right')}</a>` : ''}</nav>
</article>
<section class="vp-section"><div class="vp-container">${sectionHead('Keep reading', '', `<a class="vp-btn" href="#writing">All notes</a>`)}${postGrid(more.concat(fill))}</div></section>
${ctaBand()}`, mount: mountShare };
};
function mountShare() {
  app.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const msg = b.parentElement.querySelector('.share__msg');
    try { await navigator.clipboard.writeText(b.dataset.copy); msg.textContent = 'Link copied.'; } catch (e) { msg.textContent = b.dataset.copy; }
  }));
}

V.categories = () => ({ title: 'Categories', desc: 'Projects and notes by category: payments, AI engineering, cloud, fintech, SaaS, security and founders.', html: `
${pageHead({ title: 'Categories', lede: 'Projects and notes, grouped by the problem they deal with.' })}
<section class="vp-section vp-section--tight"><div class="vp-container"><ul class="cgrid">${CATS.map(c => {
  const np = PROJECTS.filter(p => p.category === c.slug).length, nn = postsIn(c.slug).length;
  return `<li><a class="ccard" href="#category-${c.slug}"><h2 class="ccard__name">${esc(c.name)}</h2><p class="ccard__intro">${esc(c.intro)}</p><p class="ccard__count">${np} ${np === 1 ? 'project' : 'projects'}, ${nn} ${nn === 1 ? 'note' : 'notes'}</p></a></li>`;
}).join('')}</ul></div></section>${ctaBand()}` });

V.category = slug => {
  const c = cat(slug); if (!c) return null;
  const ps = PROJECTS.filter(p => p.category === slug), notes = sortPosts(postsIn(slug));
  const techs = TECHS.filter(t => t.category === slug);
  return { title: c.name, desc: c.intro, html: `
${pageHead({ crumbs: [['Categories', '#categories']], title: c.name, lede: esc(c.intro) })}
<section class="vp-section vp-section--tight"><div class="vp-container">
  <h2 class="sub-h sub-h--first">Projects</h2>${projectGrid(ps)}
  <h2 class="sub-h">Notes</h2>${notes.length ? postGrid(notes) : `<p class="empty">No notes here yet.</p>`}
  ${techs.length ? `<h2 class="sub-h">Technologies</h2><div class="tag-row tag-row--lg">${techTags(techs.map(t => t.slug))}</div>` : ''}
  <nav class="other-cats" aria-label="Other categories"><p class="other-cats__k">Other categories</p><div class="tag-row">${CATS.filter(x => x !== c).map(x => `<a class="vp-tag tag-link" href="#category-${x.slug}">${esc(x.name)}</a>`).join('')}</div></nav>
</div></section>${ctaBand()}` };
};

V.technologies = () => ({ title: 'Stack', desc: 'The technologies Venus Paneliya works with: React, Node.js, Next.js, TypeScript, PostgreSQL, MySQL, AWS Lambda, DynamoDB, Stripe Connect, OpenAI and more.', html: `
${pageHead({ title: 'The stack', lede: `${window.TECH_GROUPS.length} groups, ${TECHS.length} technologies. Each one has a page: how I use it, what I do with it, and the projects and notes where it appears.` })}
<section class="vp-section vp-section--tight"><div class="vp-container"><div class="tgroups">${window.TECH_GROUPS.map(g => `
  <section class="tgroup" aria-labelledby="g-${slugify(g.name)}"><h2 class="tgroup__name" id="g-${slugify(g.name)}">${esc(g.name)}</h2>
  <ul class="tlist">${g.items.map(t => { const k = projectsWithTech(t.slug).length + postsWithTech(t.slug).length; return `<li><a class="tlink" href="#tech-${t.slug}">${techIcon(t.slug)}<span class="tlink__name">${esc(t.name)}</span><span class="tlink__n">${k ? k + (k === 1 ? ' entry' : ' entries') : ''}</span></a></li>`; }).join('')}</ul></section>`).join('')}
</div><p class="legal-note">Product names and logos are trademarks of their owners and are used to name the technology.</p></div></section>${ctaBand()}` });

V.tech = slug => {
  const t = tech(slug); if (!t) return null;
  const ps = projectsWithTech(slug), notes = sortPosts(postsWithTech(slug));
  const sibs = TECHS.filter(x => x.group === t.group && x !== t);
  return { title: t.name, desc: `${t.name}: ${t.about}`, html: `
<header class="page-head tech-head"><div class="vp-container">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="#technologies">Stack</a></li><li aria-current="page">${esc(t.name)}</li></ol></nav>
  <div class="tech-head__row">${techIcon(slug, 'tlogo--xl')}<div><h1 class="page-head__title" tabindex="-1">${esc(t.name)}</h1><div class="tag-row">${t.category && cat(t.category).name === t.group ? catTag(t.category) : `<span class="vp-tag">${esc(t.group)}</span>${t.category ? catTag(t.category) : ''}`}</div></div></div>
  <p class="page-head__lede">${esc(t.about)}</p>
</div></header>
<section class="vp-section vp-section--tight"><div class="vp-container">
  <div class="tech-body">
    <div><h2 class="sub-h sub-h--first">What I do with ${esc(t.name)}</h2><ul class="checks checks--col">${t.uses.map(u => `<li>${ic('check')}<span>${esc(u)}</span></li>`).join('')}</ul></div>
    <aside class="tech-aside"><h2 class="tech-aside__h">At a glance</h2><table class="vp-spec"><tr><th scope="row">Group</th><td>${esc(t.group)}</td></tr><tr><th scope="row">Projects here</th><td>${ps.length}</td></tr><tr><th scope="row">Notes here</th><td>${notes.length}</td></tr></table><a class="vp-btn vp-btn--primary" href="#contact">Hire me for ${esc(t.name)}${ic('arrow-right')}</a></aside>
  </div>
  <h2 class="sub-h">Projects that use it</h2>${ps.length ? projectGrid(ps) : `<p class="empty">No project write-up on this site names ${esc(t.name)} yet.</p>`}
  ${notes.length ? `<h2 class="sub-h">Notes</h2>${notes.length ? postGrid(notes) : `<p class="empty">No notes here yet.</p>`}` : ''}
  <nav class="other-cats" aria-label="More in ${esc(t.group)}"><p class="other-cats__k">More in ${esc(t.group)}</p>${techChips(sibs.map(x => x.slug))}</nav>
</div></section>${ctaBand(`Need ${t.name} done properly?`, 'Send me your prototype’s link. I read every message the same day, then we talk for twenty minutes about what breaks first.')}` };
};

V.contact = () => ({ title: 'Contact', desc: 'Send Venus Paneliya your prototype’s link. Email, a 20-minute intro call, LinkedIn, GitHub and Upwork.', html: `
${pageHead({ title: 'Send me your prototype’s link.', lede: 'I read every message the same day.' })}
<section class="vp-section vp-section--tight contact"><div class="vp-container contact__grid">
  <div class="contact__info">
    <ol class="next"><li><strong>I read it.</strong> Your message and the product link, the same day.</li><li><strong>We talk.</strong> Twenty minutes on what breaks first.</li><li><strong>You get a plan.</strong> Hourly fix, audit, retainer or a full-time conversation.</li></ol>
    <ul class="reach">
      <li>${ic('mail')}<span><span class="reach__k">Email</span><a href="mailto:${S.email}">${S.email}</a>${S.email2 ? `<br><a href="mailto:${S.email2}">${S.email2}</a>` : ''}</span></li>
      <li>${ic('phone')}<span><span class="reach__k">Phone and WhatsApp</span><a href="${S.tel}">${S.phone}</a><br><a href="${S.whatsapp}" rel="noopener">Message me on WhatsApp</a></span></li>
      <li>${ic('calendar')}<span><span class="reach__k">20-minute intro call</span>${S.booking ? `<a href="${esc(S.booking)}" rel="noopener">Book a 20-minute call</a>` : ph('BOOKING LINK TO CONFIRM')}</span></li>
    </ul>
    <ul class="elsewhere"><li><a class="vp-btn vp-btn--sm" href="${S.whatsapp}" rel="noopener">${ic('whatsapp')}WhatsApp</a></li><li><a class="vp-btn vp-btn--sm" href="${S.linkedin}" rel="noopener">${ic('linkedin')}LinkedIn</a></li><li><a class="vp-btn vp-btn--sm" href="${S.github}" rel="noopener">${ic('github')}GitHub</a></li><li><a class="vp-btn vp-btn--sm" href="${S.upwork}" rel="noopener">${ic('briefcase')}Upwork</a></li><li><a class="vp-btn vp-btn--sm" href="/Venus_Paneliya_Resume.pdf" target="_blank" rel="noopener">${ic('arrow-up-right')}Resume</a></li></ul>
  </div>
  <div class="enquiry">
    <form class="enquiry__form" id="enquiry" novalidate>
      <div class="enquiry__row">
        <div class="vp-field"><label class="vp-field__label" for="f-name">Your name</label><input class="vp-input" id="f-name" name="name" autocomplete="name" required><p class="vp-field__error" id="e-name" hidden>${ic('x')}Add your name.</p></div>
        <div class="vp-field"><label class="vp-field__label" for="f-email">Email</label><input class="vp-input" id="f-email" name="email" type="email" autocomplete="email" required><p class="vp-field__error" id="e-email" hidden>${ic('x')}Add an email I can reply to.</p></div>
      </div>
      <div class="vp-field"><label class="vp-field__label" for="f-link">Product link <span class="opt">(optional)</span></label><input class="vp-input" id="f-link" name="link" type="url" inputmode="url" placeholder="https://" aria-describedby="h-link"><p class="vp-field__hint" id="h-link">A live URL, a staging link or a repo.</p></div>
      <div class="vp-field"><label class="vp-field__label" for="f-need">What you need</label><select class="vp-input" id="f-need" name="need"><option>An audit or a focused fix (hourly)</option><option>An embedded engineer (monthly retainer)</option><option>A full-time remote hire</option><option>Not sure yet</option></select></div>
      <div class="vp-field"><label class="vp-field__label" for="f-message">What worries you about it</label><textarea class="vp-input" id="f-message" name="message" rows="5" required></textarea><p class="vp-field__error" id="e-message" hidden>${ic('x')}Write a line or two about the product.</p></div>
      <div class="enquiry__foot"><button class="vp-btn vp-btn--primary vp-btn--lg" type="submit">Send enquiry</button><p class="vp-field__hint">This form is not connected yet. If you submit, it tells you how to send it by email.</p></div>
    </form>
    <div class="vp-callout enquiry__result" id="enquiry-result" tabindex="-1" hidden>${ic('info', 'vp-callout__icon')}<div>
      <strong class="vp-callout__title">Nothing was sent.</strong>
      <p>This form is not connected to a server yet, so your message is still on this page. Email it to me at <strong>${S.email}</strong>. I read every message the same day.</p>
      <div class="enquiry__actions"><a class="vp-btn vp-btn--sm" id="enquiry-mailto" href="mailto:${S.email}">${ic('mail')}Open it in your email app</a><button class="vp-btn vp-btn--sm" type="button" id="enquiry-copy">${ic('copy')}Copy message</button></div>
      <p class="enquiry__copied" id="enquiry-copied" role="status"></p></div></div>
  </div>
</div></section>`, mount: mountEnquiry });

V.notfound = () => ({ title: 'Page not found', desc: 'This page does not exist.', html: `
<section class="notfound"><div class="vp-container notfound__inner">
  <p class="notfound__code">404</p>
  <h1 class="notfound__title" tabindex="-1">This page isn’t here.</h1>
  <p class="notfound__text">The link may be old, or the page was never written. Everything that exists is one click away.</p>
  <div class="hero__actions"><a class="vp-btn vp-btn--primary" href="#home">Go to the homepage</a><a class="vp-btn" href="#work">See the work</a><a class="vp-btn" href="#writing">Read the notes</a></div>
</div></section>` });

/* ---------- mounts ---------- */
function mountAudit() {
  const tabs = [...app.querySelectorAll('.audit__tabs [role="tab"]')]; if (!tabs.length) return;
  app.querySelectorAll('.audit__list').forEach(l => [...l.children].forEach((li, i) => li.style.setProperty('--i', i)));
  const select = (tab, focus) => { tabs.forEach(t => { const on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls')); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panel.hidden = !on; if (on) { panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); } }); if (focus) tab.focus(); };
  tabs.forEach((t, i) => { t.addEventListener('click', () => select(t)); t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true); } }); });
}
function mountFilters() {
  app.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.filter; state[key] = b.dataset.value;
    app.querySelectorAll(`[data-filter="${key}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (key === 'workFilter') document.getElementById('work-list').innerHTML = projectGrid(state.workFilter === 'all' ? PROJECTS : PROJECTS.filter(p => p.category === state.workFilter));
    else { document.getElementById('writing-list').innerHTML = postGrid(filteredPosts(sortPosts(state.posts)), state.writingFilter === 'all' && !state.writingQuery); }
  }));
}
function mountEnquiry() {
  const form = document.getElementById('enquiry'), result = document.getElementById('enquiry-result'), mailto = document.getElementById('enquiry-mailto');
  const copyBtn = document.getElementById('enquiry-copy'), copied = document.getElementById('enquiry-copied');
  const checks = { name: v => v.trim().length > 0, email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), message: v => v.trim().length > 0 };
  const setError = (n, bad) => { const input = form.elements[n], err = document.getElementById('e-' + n); input.closest('.vp-field').classList.toggle('vp-field--error', bad); err.hidden = !bad; if (bad) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', err.id); } else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); } };
  Object.keys(checks).forEach(n => form.elements[n].addEventListener('input', e => { if (e.target.getAttribute('aria-invalid')) setError(n, !checks[n](e.target.value)); }));
  const compose = () => { const f = form.elements; const lines = [f.message.value.trim(), '', 'What I need: ' + f.need.value]; if (f.link.value.trim()) lines.push('Product link: ' + f.link.value.trim()); lines.push('', f.name.value.trim(), f.email.value.trim()); return { subject: 'Enquiry from venuspaneliya.com: ' + f.name.value.trim(), body: lines.join('\n') }; };
  form.addEventListener('submit', e => { e.preventDefault(); let first = null; Object.keys(checks).forEach(n => { const bad = !checks[n](form.elements[n].value); setError(n, bad); if (bad && !first) first = form.elements[n]; }); if (first) { result.hidden = true; first.focus(); return; } const m = compose(); mailto.href = `mailto:${S.email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`; copied.textContent = ''; result.hidden = false; result.focus(); });
  copyBtn.addEventListener('click', async () => { const m = compose(), text = `To: ${S.email}\nSubject: ${m.subject}\n\n${m.body}`; try { await navigator.clipboard.writeText(text); copied.textContent = 'Copied. Paste it into an email to ' + S.email + '.'; } catch (err) { copied.textContent = 'Copying is blocked here. Select your message above and email it to ' + S.email + '.'; } });
}

/* ---------- router ---------- */
const META_DESC = document.querySelector('meta[name="description"]'), DEFAULT_DESC = META_DESC ? META_DESC.content : '';
function parse() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h || h === 'home') return ['home'];
  if (['work', 'services', 'about', 'writing', 'contact', 'categories', 'technologies'].includes(h)) return [h];
  const m = h.match(/^(project|post|category|tech)-([a-z0-9-]+)$/); if (m) return [m[1], m[2]];
  return ['notfound'];
}
let first = true, current = '';
function render(keepScroll) {
  if (STATIC) {
    if (!first) return;
    first = false;
    const v = (V[app.dataset.route] && V[app.dataset.route](app.dataset.arg || undefined)) || V.notfound();
    if (v.mount) v.mount();
    fixLinks(document);
    new MutationObserver(() => fixLinks(app)).observe(app, { childList: true, subtree: true });
    return;
  }
  const [name, arg] = parse();
  let v = V[name](arg); if (!v) v = V.notfound();
  const key = location.hash;
  const navKey = { project: 'work', post: 'writing', category: 'work', tech: 'technologies', write: 'writing' }[name] || name;
  app.innerHTML = v.html;
  document.title = v.title ? `${v.title.replace(/\.$/, '')}, Venus Paneliya` : 'Venus Paneliya, full-stack AI engineer. Prototype in. Production out.';
  if (META_DESC) META_DESC.content = v.desc || DEFAULT_DESC;
  document.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === navKey; a.classList.toggle('is-current', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  app.querySelectorAll('.pmedia img').forEach(img => img.addEventListener('error', () => img.closest('.pmedia').classList.add('is-missing'), { once: true }));
  if (v.mount) v.mount();
  if (!keepScroll && key !== current) {
    window.scrollTo(0, 0);
    if (!first) { const h1 = app.querySelector('h1'); if (h1) h1.focus({ preventScroll: true }); document.getElementById('route-status').textContent = (v.title || 'Home') + ' page'; }
  }
  current = key; first = false;
}
if (STATIC) {
  const legacy = () => { const p = toPath(location.hash); if (location.hash.length > 1 && p && p !== location.pathname) location.replace(p); };
  legacy(); window.addEventListener('hashchange', legacy);
} else window.addEventListener('hashchange', () => render());
document.getElementById('skip') && document.getElementById('skip').addEventListener('click', ev => { ev.preventDefault(); const h1 = app.querySelector('h1'); (h1 || app).focus(); });

/* ---------- nav on phones ---------- */
(() => {
  const nav = document.querySelector('.site-nav'), toggle = nav.querySelector('.site-nav__toggle'), label = toggle.querySelector('.site-nav__toggle-label');
  const setOpen = open => { nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); label.textContent = open ? 'Close' : 'Menu'; toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu'); };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.site-nav__menu a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
})();

if (window.__PRERENDER) { window.__VP = { V, state, toPath, md, readTime, TECHS }; } else render();
})();

/* ---------- Logo loader (loaders.html, .penloop[data-pen=c], 0.75x), only while the page is still loading ---------- */
window.VPSPEED = 0.75;
(() => {
  const splash = document.getElementById('splash'); if (!splash) return;
  let started = false, stop = () => {};
  const done = () => { stop(); if (!started) { splash.remove(); return; } splash.classList.add('is-leaving'); setTimeout(() => splash.remove(), 440); };
  if (document.readyState === 'complete') { splash.remove(); return; }
  const timer = setTimeout(() => { splash.hidden = false; started = true; stop = startLoop(splash); }, 400);
  window.addEventListener('load', () => { clearTimeout(timer); done(); }, { once: true });
  function startLoop(sec) {
    const RMQ = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const svg = sec.querySelector('svg'), btn = sec.querySelector('.pen-toggle');
    const ds = [...svg.querySelectorAll('.pdot')], mk = svg.querySelector('.marker'), mkG = svg.querySelector('.marker-g');
    const zo = svg.querySelector('.zw-o'), zf = svg.querySelector('.zw-f'), zz = svg.querySelector('.zz'), er = svg.querySelector('.eraser'), erG = svg.querySelector('.eraser-g');
    const pal = svg.querySelector('.palette'), ring = svg.querySelector('.sw-ring'), sig = svg.querySelector('.sw-sig');
    const ZL = zz.getTotalLength(); [zo, zf, zz].forEach(p => p.style.strokeDasharray = ZL);
    const bb = d => { const b = d.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2]; }; const DC = ds.map(bb), SW = [+sig.getAttribute('cx'), +sig.getAttribute('cy')];
    const S = { write: [400, 2500], lag: 260, palIn: [2550, 2850], toPal: [2750, 3500], tap: [3500, 3900], dot1: [3900, 4900], dot2: [4900, 5750], exit: [5800, 6300], erase: [7200, 9300], T: 11200 };
    const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a))), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out = t => 1 - Math.pow(1 - t, 3);
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const WEND = zz.getPointAtLength(ZL); const wend = [WEND.x, WEND.y];
    function render(t) {
      const pw = seg(t, ...S.write), pf = seg(t, S.write[0] + S.lag, S.write[1] + S.lag);
      zo.style.strokeDashoffset = ZL * (1 - pw); zf.style.strokeDashoffset = ZL * (1 - pf);
      let pos, lift = 0, rot = 28, vis = seg(t, S.write[0] - 350, S.write[0]) * (1 - seg(t, ...S.exit));
      if (t < S.write[1]) { const q = zz.getPointAtLength(ZL * pw); pos = [q.x, q.y]; rot = 28 + Math.sin(pw * Math.PI * 18) * 5; lift = (1 - out(seg(t, S.write[0] - 350, S.write[0]))) * -60; }
      else if (t < S.tap[0]) { const q = io(seg(t, ...S.toPal)); pos = lerp(wend, SW, q); lift = -70 * Math.sin(Math.PI * q); }
      else if (t < S.tap[1]) { pos = SW; lift = -18 * Math.sin(Math.PI * seg(t, ...S.tap)); }
      else if (t < S.dot1[1]) { const q = seg(t, ...S.dot1); const m = io(Math.min(1, q / 0.7)); pos = lerp(SW, DC[0], m); lift = -60 * Math.sin(Math.PI * m) + (q > 0.7 ? -10 * Math.sin(Math.PI * (q - 0.7) / 0.3) : 0); }
      else if (t < S.dot2[1]) { const q = seg(t, ...S.dot2); const m = io(Math.min(1, q / 0.68)); pos = lerp(DC[0], DC[1], m); lift = -50 * Math.sin(Math.PI * m) + (q > 0.68 ? -10 * Math.sin(Math.PI * (q - 0.68) / 0.32) : 0); }
      else { const q = out(seg(t, ...S.exit)); pos = lerp(DC[1], [DC[1][0] + 280, DC[1][1] - 140], q); }
      mk.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`); mk.setAttribute('opacity', vis.toFixed(3));
      mkG.setAttribute('transform', `translate(0 ${lift.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(1.25)`);
      pal.setAttribute('opacity', (seg(t, ...S.palIn) * (1 - seg(t, S.exit[0], S.exit[1]))).toFixed(3));
      const picked = t >= S.tap[0] + 180 && t < S.exit[1] + 300; mk.classList.toggle('is-orange', picked); ring.setAttribute('opacity', picked && t < S.exit[0] ? 1 : 0);
      const g1 = seg(t, S.dot1[0] + (S.dot1[1] - S.dot1[0]) * 0.72, S.dot1[1]), g2 = seg(t, S.dot2[0] + (S.dot2[1] - S.dot2[0]) * 0.7, S.dot2[1]);
      [g1, g2].forEach((g, i) => { const s = g < .7 ? g / .7 * 1.2 : 1.2 - (g - .7) / .3 * .2; ds[i].style.transform = `scale(${g > 0 ? s : 0})`; ds[i].style.opacity = g > 0 ? 1 : 0; });
      const ep = seg(t, ...S.erase); zz.style.strokeDashoffset = ZL * (1 - ep); const q = zz.getPointAtLength(ZL * ep);
      er.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`); er.setAttribute('opacity', (seg(t, S.erase[0] - 400, S.erase[0]) * (1 - seg(t, S.erase[1], S.erase[1] + 400))).toFixed(3));
      const el = (1 - out(seg(t, S.erase[0] - 400, S.erase[0]))) * -60 + seg(t, S.erase[1], S.erase[1] + 400) * -60; erG.setAttribute('transform', `translate(0 ${el.toFixed(1)}) rotate(${(22 + Math.sin(ep * Math.PI * 18) * 5).toFixed(2)}) scale(1.7)`);
    }
    if (RMQ) { zo.style.strokeDashoffset = 0; zf.style.strokeDashoffset = 0; zz.style.strokeDashoffset = ZL; ds.forEach(d => { d.style.transform = 'scale(1)'; }); btn.disabled = true; btn.textContent = 'Paused (reduced motion)'; return () => {}; }
    let last = null, paused = false, at = 0, alive = true;
    const frame = now => { if (paused || !alive) { last = null; return; } if (last !== null) at = (at + (now - last) * (window.VPSPEED || 1)) % S.T; last = now; render(at); requestAnimationFrame(frame); };
    btn.addEventListener('click', () => { paused = !paused; btn.setAttribute('aria-pressed', String(paused)); btn.textContent = paused ? 'Play' : 'Pause'; if (!paused) { last = null; requestAnimationFrame(frame); } });
    render(0); requestAnimationFrame(frame);
    return () => { alive = false; };
  }
})();
