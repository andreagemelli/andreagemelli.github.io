// Smallest thing that fails if the generator breaks: build, then assert on dist/.
//   node test.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = (f) => readFileSync(`dist/${f}`, 'utf8');

execFileSync('node', ['build.mjs'], { stdio: 'inherit' });

// drafts stay out of a production build
assert.ok(!existsSync('dist/posts/intelligence'), 'draft post was published');
assert.ok(!read('index.xml').includes('Retrieval and Reasoning'), 'draft leaked into the feed');

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

// old Hugo URLs still resolve
assert.match(read('archives/index.html'), /url=\/posts\//, 'archives redirect broken');
assert.match(read('misc/index.html'), /url=\/about\//, 'misc redirect broken');

console.log('all checks passed');
