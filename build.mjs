// Static site generator for andreagemelli.me
// Markdown in content/ + static/ assets -> dist/. No framework, no theme.
//   node build.mjs [--drafts] [--watch] [--serve]

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import * as icons from 'simple-icons';

const ROOT = import.meta.dirname;
const OUT = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const INCLUDE_DRAFTS = args.includes('--drafts');

const SITE = {
  title: 'Andrea Gemelli',
  url: 'https://www.andreagemelli.me',
  description:
    'AI Researcher in Paris. PhD in Artificial Intelligence. Notes on agents, ' +
    'retrieval, tokenizers and document understanding.',
  author: 'Andrea Gemelli',
};

const NAV = [
  ['about', '/about/'],
  ['writing', '/posts/'],
  ['publications', '/publications/'],
  ['cv', '/cv.pdf'],
];

const SOCIAL = [
  ['linkedin', 'https://www.linkedin.com/in/andrea-gemelli/', icons.siLinkedin],
  ['x', 'https://twitter.com/_andreagemelli', icons.siX],
  ['github', 'https://github.com/andreagemelli', icons.siGithub],
  ['google scholar', 'https://scholar.google.fr/citations?user=8AeCCO0AAAAJ&hl=it', icons.siGooglescholar],
  ['hugging face', 'https://huggingface.co/andreagemelli', icons.siHuggingface],
];

// ---------------------------------------------------------------- markdown

const md = new MarkdownIt({ html: true, linkify: true, typographer: false })
  .use(footnote)
  .use(anchor, { slugify, permalink: false });

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Front matter + body. Raw HTML in the body passes straight through (html: true).
function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  return { meta: yaml.load(m[1]) ?? {}, body: m[2] };
}

// Collect h2/h3 from rendered HTML for the table of contents.
function toc(html) {
  const items = [...html.matchAll(/<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)].map(
    ([, level, id, text]) => ({ level: +level, id, text: text.replace(/<[^>]+>/g, '') })
  );
  if (items.length < 3) return '';
  return `<nav class="toc"><p class="toc-label">contents</p><ol>${items
    .map((i) => `<li class="toc-h${i.level}"><a href="#${i.id}">${i.text}</a></li>`)
    .join('')}</ol></nav>`;
}

// ---------------------------------------------------------------- templates

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const ymd = (d) => new Date(d).toISOString().slice(0, 10);
const stamp = (d) => ymd(d).slice(0, 7).replace('-', '.'); // 2026.08

function icon(si) {
  return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="${si.path}"/></svg>`;
}

function socialRow() {
  return `<ul class="social">${SOCIAL.map(
    ([name, url, si]) =>
      `<li><a href="${url}" rel="me noopener" target="_blank" title="${name}"><span class="sr-only">${name}</span>${icon(si)}</a></li>`
  ).join('')}</ul>`;
}

function layout({ title, description, body, url, klass = '', ogType = 'website', date }) {
  const full = url === '/' ? SITE.title : `${title} · ${SITE.title}`;
  const desc = description || SITE.description;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${SITE.author}">
<link rel="canonical" href="${SITE.url}${url}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE.url}${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:creator" content="@_andreagemelli">
${date ? `<meta property="article:published_time" content="${ymd(date)}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${SITE.title}" href="/index.xml">
<link rel="icon" href="/assets/favicon.ico?v=2">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png?v=2">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2">
<link rel="preload" href="/fonts/JetBrainsMono-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">
<script>
  // Applied before first paint so the toggled theme never flashes.
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
</head>
<body${klass ? ` class="${klass}"` : ''}>
<a class="sr-only skip" href="#main">Skip to content</a>
<header class="bar">
  <a class="prompt" href="/"><span class="who">andrea@gemelli</span> <span class="cwd">~</span> <span class="sigil">%</span> <span class="caret"></span></a>
  <nav>
    ${NAV.map(([label, href]) => `<a href="${href}"${href.endsWith('.pdf') ? ' target="_blank"' : ''}>${label}</a>`).join('')}
    <button type="button" id="theme" aria-label="Toggle dark mode" title="Toggle dark mode">
      <span aria-hidden="true">◐</span>
    </button>
  </nav>
</header>
<main id="main">
${body}
</main>
<footer class="bar foot">
  <span>${SITE.author}</span>
  <span><a href="/index.xml">rss</a> · <a href="https://github.com/andreagemelli/andreagemelli.github.io">source</a></span>
</footer>
<script>
  document.getElementById('theme').addEventListener('click', function () {
    var d = document.documentElement;
    var dark = d.dataset.theme
      ? d.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    d.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', d.dataset.theme); } catch (e) {}
  });
</script>
</body>
</html>
`;
}

function postList(posts) {
  return `<ul class="index">${posts
    .map(
      (p) => `<li>
    <span class="bullet" aria-hidden="true">~</span>
    <a href="${p.url}">${esc(p.title)}</a>
    <time datetime="${ymd(p.date)}">${stamp(p.date)}</time>
    ${p.description ? `<p>${esc(p.description)}</p>` : ''}
  </li>`
    )
    .join('')}</ul>`;
}

// ---------------------------------------------------------------- content

function readPosts() {
  const dir = path.join(ROOT, 'content/posts');
  return fs
    .readdirSync(dir)
    .filter((slug) => fs.existsSync(path.join(dir, slug, 'index.md')))
    .map((slug) => {
      const { meta, body } = parse(path.join(dir, slug, 'index.md'));
      return {
        slug,
        dir: path.join(dir, slug),
        title: meta.title ?? slug,
        date: meta.date ?? '1970-01-01',
        description: meta.description ?? '',
        tags: meta.tags ?? [],
        draft: meta.draft === true,
        showToc: meta.ShowToc === true,
        url: `/posts/${slug}/`,
        body,
      };
    })
    .filter((p) => INCLUDE_DRAFTS || !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function copyTree(from, to) {
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
}

// ---------------------------------------------------------------- pages

function home(posts) {
  const recent = posts.slice(0, 5);
  const body = `<section class="intro">
  <h1 class="sr-only">Andrea Gemelli</h1>
  <p>I am an <strong>AI Researcher at <a href="https://www.kleio.ai">Kleio</a></strong> in Paris,
  where I work on multi-agent architectures and on the retrieval and orchestration
  pipelines underneath them.</p>

  <p>Before Kleio I spent two years at <a href="https://www.letxbe.ai">LetXBe</a> building
  LLM and multi-modal systems for document understanding. Before that, a
  <a href="https://flore.unifi.it/handle/2158/1353891">PhD in Artificial Intelligence</a>
  with a Doctor Europaeus title, a year as a visiting researcher at the
  <a href="https://www.cvc.uab.es">Computer Vision Center</a> in Barcelona, and papers at
  ECCV, ICPR, ICASSP and IJDAR.</p>

  <p>I keep things in the open: <a href="https://github.com/andreagemelli/doc2graph">Doc2Graph</a>,
  <a href="https://github.com/remorses/easymcp">EasyMCP</a>, 150+ citations, 20k+ downloads on
  Hugging Face. <a href="/about/">More about me</a>, or the
  <a href="/cv.pdf" target="_blank">CV</a>.</p>
</section>

<section class="block">
  <h2 class="rule"><a href="/posts/">writing</a></h2>
  <p class="lede">Notes on what I read and build. Closer to a lab notebook than to a guide.</p>
  ${postList(recent)}
  ${posts.length > recent.length ? '<p class="more"><a href="/posts/">all posts</a></p>' : ''}
</section>

<section class="block">
  <h2 class="rule">elsewhere</h2>
  ${socialRow()}
</section>`;
  return layout({ title: SITE.title, body, url: '/', klass: 'home' });
}

function postsIndex(posts) {
  const byYear = {};
  for (const p of posts) (byYear[new Date(p.date).getFullYear()] ??= []).push(p);
  const body = `<h1>writing</h1>
<p class="lede">Notes on agents, retrieval, tokenizers and document understanding.
Closer to a lab notebook than to a guide. ${posts.length} posts,
<a href="/index.xml">rss</a>.</p>
${Object.keys(byYear)
  .sort((a, b) => b - a)
  .map((y) => `<section class="block"><h2 class="rule">${y}</h2>${postList(byYear[y])}</section>`)
  .join('')}`;
  return layout({ title: 'Writing', description: 'Posts by Andrea Gemelli.', body, url: '/posts/' });
}

function post(p, posts) {
  const html = md.render(p.body);
  const i = posts.indexOf(p);
  const prev = posts[i + 1];
  const next = posts[i - 1];
  const body = `<article class="post">
  <header>
    <h1>${esc(p.title)}</h1>
    ${p.description ? `<p class="lede">${esc(p.description)}</p>` : ''}
    <p class="meta">
      <time datetime="${ymd(p.date)}">${ymd(p.date)}</time>
      ${p.tags.length ? `<span class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</span>` : ''}
      ${p.draft ? '<span class="draft">draft</span>' : ''}
    </p>
  </header>
  ${p.showToc ? toc(html) : ''}
  ${html}
</article>
<nav class="pager">
  ${prev ? `<a class="prev" href="${prev.url}"><span>previous</span>${esc(prev.title)}</a>` : '<span></span>'}
  ${next ? `<a class="next" href="${next.url}"><span>next</span>${esc(next.title)}</a>` : '<span></span>'}
</nav>`;
  return layout({
    title: p.title,
    description: p.description,
    body,
    url: p.url,
    ogType: 'article',
    date: p.date,
  });
}

function page(name, url) {
  const { meta, body } = parse(path.join(ROOT, `content/${name}.md`));
  return layout({
    title: meta.title ?? name,
    description: meta.summary,
    body: `<article class="page"><h1>${esc(meta.title ?? name)}</h1>${md.render(body)}</article>`,
    url,
  });
}

function feed(posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE.url}${p.url}</link>
    <guid>${SITE.url}${p.url}</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
  </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE.title}</title>
  <link>${SITE.url}/</link>
  <description>${esc(SITE.description)}</description>
  <language>en-us</language>
  <atom:link href="${SITE.url}/index.xml" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`;
}

function sitemap(urls) {
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}
</urlset>
`;
}

// Keeps an old URL alive after the page behind it moved or went away.
function redirect(to) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Moved</title><link rel="canonical" href="${SITE.url}${to}">
<meta http-equiv="refresh" content="0; url=${to}"></head>
<body><p>This page moved to <a href="${to}">${to}</a>.</p></body></html>
`;
}

// ---------------------------------------------------------------- build

function build() {
  const t0 = Date.now();
  fs.rmSync(OUT, { recursive: true, force: true });
  const posts = readPosts();

  write('index.html', home(posts));
  write('posts/index.html', postsIndex(posts));
  for (const p of posts) {
    write(`posts/${p.slug}/index.html`, post(p, posts));
    for (const sub of ['images', 'docs']) copyTree(path.join(p.dir, sub), path.join(OUT, 'posts', p.slug, sub));
  }

  write('about/index.html', page('about', '/about/'));
  write('publications/index.html', page('publications', '/publications/'));
  write('archives/index.html', redirect('/posts/'));
  write('misc/index.html', redirect('/about/'));
  write(
    '404.html',
    layout({
      title: '404',
      url: '/404.html',
      body: `<section class="intro"><h1>404</h1>
      <p><code>no such file or directory</code>. The page you asked for is not here.</p>
      <p><a href="/">Back home</a> or straight to the <a href="/posts/">writing</a>.</p></section>`,
    })
  );

  write('index.xml', feed(posts));
  write(
    'sitemap.xml',
    sitemap(['/', '/about/', '/publications/', '/posts/', ...posts.map((p) => p.url)])
  );
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

  copyTree(path.join(ROOT, 'static'), OUT);
  fs.copyFileSync(path.join(ROOT, 'site.css'), path.join(OUT, 'site.css'));
  if (fs.existsSync(path.join(ROOT, 'CNAME'))) fs.copyFileSync(path.join(ROOT, 'CNAME'), path.join(OUT, 'CNAME'));

  console.log(`built ${posts.length} posts to dist/ in ${Date.now() - t0}ms${INCLUDE_DRAFTS ? ' (drafts included)' : ''}`);
}

build();

if (args.includes('--watch')) {
  let timer;
  for (const dir of ['content', 'static']) {
    fs.watch(path.join(ROOT, dir), { recursive: true }, rebuild);
  }
  for (const file of ['build.mjs', 'site.css']) fs.watch(path.join(ROOT, file), rebuild);
  function rebuild() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (e) {
        console.error(e.message);
      }
    }, 80);
  }
  console.log('watching content/, static/, site.css, build.mjs');
}

if (args.includes('--serve')) {
  const TYPES = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
    '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.txt': 'text/plain',
  };
  http
    .createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      // Contain path traversal: the resolved file must stay inside dist/.
      let file = path.join(OUT, url);
      if (!path.resolve(file).startsWith(OUT)) return res.writeHead(403).end();
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/html' });
        return res.end(fs.readFileSync(path.join(OUT, '404.html')));
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    })
    .listen(4000, () => console.log('http://localhost:4000'));
}
