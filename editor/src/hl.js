import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import swift from 'highlight.js/lib/languages/swift';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import kotlin from 'highlight.js/lib/languages/kotlin';
import ini from 'highlight.js/lib/languages/ini';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import scss from 'highlight.js/lib/languages/scss';
import diff from 'highlight.js/lib/languages/diff';
const all = { javascript, typescript, json, css, xml, python, rust, go, java, swift, bash, yaml, markdown, sql, c, cpp, csharp, ruby, php, kotlin, ini, dockerfile, scss, diff };
for (const [n, l] of Object.entries(all)) hljs.registerLanguage(n, l);
const EXT = { js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json', css: 'css', scss: 'scss', html: 'xml', xml: 'xml', svg: 'xml', py: 'python', rs: 'rust', go: 'go', java: 'java', swift: 'swift', sh: 'bash', zsh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml', md: 'markdown', sql: 'sql', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp', rb: 'ruby', php: 'php', kt: 'kotlin', toml: 'ini', ini: 'ini', dockerfile: 'dockerfile', patch: 'diff', diff: 'diff' };
// highlight one line of code for a file path; returns HTML (already escaped) or null when the language is unknown
window.hlLine = (code, path) => {
  const base = path.split('/').pop().toLowerCase(), ext = base === 'dockerfile' ? 'dockerfile' : base.split('.').pop();
  const lang = EXT[ext]; if (!lang || code.length > 600) return null;
  try { return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value; } catch { return null; }
};
