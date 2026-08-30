// Smallest thing that fails if the generator breaks: build, then assert on dist/.
//   node test.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = (f) => readFileSync(`dist/${f}`, 'utf8');

execFileSync('node', ['build.mjs'], { stdio: 'inherit' });

// drafts stay out of a production build. Derived from what is actually on disk, so
// this keeps testing the filter as posts come and go rather than naming one slug.
const feed = read('index.xml');
for (const dir of readdirSync('content/posts')) {
  const md = `content/posts/${dir}/index.md`;
  if (!existsSync(md) || !/^draft:\s*true\s*$/m.test(readFileSync(md, 'utf8'))) continue;
  const title = readFileSync(md, 'utf8').match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1];
  assert.ok(!existsSync(`dist/posts/${dir}`), `draft "${dir}" was published`);
  if (title) assert.ok(!feed.includes(title), `draft "${dir}" leaked into the feed`);
}

// front matter drives the page
const post = read('posts/tokenizers/index.html');
assert.match(post, /<h1>3476, 477, 12274, 112838, 248<\/h1>/, 'title lost');
assert.match(post, /<time datetime="2025-01-26">/, 'date lost');
assert.match(post, /<span class="tags">.*<span>Tokenizers<\/span>/, 'tags lost');

// TOC needs ids from markdown-it-anchor and 3+ headings; this pair broke once
assert.match(post, /class="toc"/, 'ShowToc post has no table of contents');
assert.match(post, /<a href="#what-are-tokenizers">/, 'TOC anchor does not match the heading id');
assert.ok(!read('posts/hello-world/index.html').includes('class="toc"'), 'TOC on a short post');

// site.css styles captions via `.post img + em`, so the em must stay the img's
// immediate sibling inside the same paragraph
assert.match(read('posts/tokenizers/index.html'), /<img[^>]*images\/chats\.png[^>]*>\s*<em>/,
  'image caption is no longer the img sibling that the CSS hooks onto');

// newest first, and page bundle assets travel with the post
assert.match(read('posts/index.html').split('class="index"')[1], /baguettotron-vlm/, 'wrong sort order');
assert.ok(existsSync('dist/posts/tokenizers/images/chats.png'), 'post images not copied');

// the career page absorbed the about page, plus two sections of its own
const career = read('career/index.html');
// prefix match on purpose: the heading gets renamed, the section should not vanish
assert.match(career, /<h2 id="teaching/, 'teaching section missing');
assert.match(career, /<h2 id="unsorted"/, 'unsorted section missing');
assert.ok(!career.includes('citation-section'), 'the opening blockquote moved to the home page');

// the home page is a three-paragraph intro that cites the VLM work
const home = read('index.html');
assert.match(home, /baguettotron-vlm/i, 'home page does not cite Baguettotron-VLM');
assert.equal(home.split('<section class="intro">')[1].split('</section>')[0].match(/<p>/g).length, 3,
  'home intro is not three paragraphs');

// links that leave the site open in a new tab; links that stay do not
assert.match(post, /<a href="https:\/\/huggingface\.co\/docs[^"]*" target="_blank" rel="noopener">/,
  'external link in a post does not open in a new tab');
assert.match(home, /<a href="\/career\/">/, 'internal link was given a target');
assert.ok(!/<a href="#fnref1"[^>]*target=/.test(post), 'footnote backref was given a target');
assert.ok(!/target="_blank"[^>]*target="_blank"/.test(home), 'target applied twice');

// URLs that existed before still resolve
assert.match(read('archives/index.html'), /url=\/posts\//, 'archives redirect broken');
assert.match(read('about/index.html'), /url=\/career\//, 'about redirect broken');
assert.match(read('misc/index.html'), /url=\/career\//, 'misc redirect broken');

console.log('all checks passed');
