// Static acceptance checks for the Osborne site. Run from the project root:
//   node tools/verify.mjs            -> checks the real site
//   node tools/verify.mjs --control  -> proves the checker catches a known-bad fixture
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEADLINE = 'In an AI world, anyone can be a hacker.';

// Claims the commission forbids publishing. Case-insensitive.
const BANNED = [
  /department of (war|defen[cs]e)/i, /\bDoD\b/, /pentagon/i, /\bmilitary\b/i, /\bdefen[cs]e (department|contractor|clients?)\b/i,
  /24\s*\/\s*7/i, /24x7/i, /round[- ]the[- ]clock/i,
  /unlimited (takedowns?|enforcement)/i, /guarantee/i, /\bcertified\b/i, /\bISO\s?27001\b/i, /\bSOC ?2\b/i,
  /trusted by/i, /testimonial/i, /our clients include/i, /AI[- ](powered|driven) (detection|monitoring|platform)/i,
  /lorem ipsum/i, /\b\d{2,3}%/, /blockchain/i
];

function textOf(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}

function check(files, label) {
  const problems = [];
  const html = files['index.html'] ?? '';
  const visible = textOf(html);
  const all = Object.values(files).join('\n');

  if (!visible.includes(HEADLINE)) problems.push(`headline missing or altered: "${HEADLINE}"`);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1 || h1[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() !== HEADLINE) problems.push('h1 is not exactly the required headline');

  for (const re of BANNED) {
    const isPercent = re.source.includes('%');
    const m = visible.match(re) || (!isPercent && (files['main.js'] ?? '').match(re));
    if (m) problems.push(`banned/unverified claim matched ${re}: "${m[0]}"`);
  }
  // No invented contact data
  const emails = all.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  if (emails.length) problems.push(`email address present: ${[...new Set(emails)].join(', ')}`);
  if (/mailto:/i.test(all)) problems.push('mailto link present');
  if (/\btel:/i.test(all)) problems.push('tel link present');
  // No network submission
  if (/<form[^>]*\baction\s*=/i.test(html)) problems.push('form has an action attribute');
  if (/\bfetch\s*\(|XMLHttpRequest|sendBeacon|navigator\.sendBeacon/.test(files['main.js'] ?? '')) problems.push('network call found in main.js');
  if (/google-analytics|gtag\(|googletagmanager|plausible|hotjar|segment\.com/i.test(all)) problems.push('tracking script found');
  // Honest local-only statement present
  if (!/nothing is sent/i.test(visible)) problems.push('missing explicit "nothing is sent" statement on the brief builder');
  return problems;
}

function load() {
  const out = {};
  for (const f of ['index.html', 'styles.css', 'main.js', 'README.md']) {
    const p = join(root, f);
    if (!existsSync(p)) { out[f] = undefined; continue; }
    out[f] = readFileSync(p, 'utf8');
  }
  return out;
}

if (process.argv.includes('--control')) {
  const bad = {
    'index.html': '<h1>Anyone can be a hacker.</h1><p>Trusted by the Department of Defense. 24/7 monitoring, unlimited takedowns, guaranteed. Lorem ipsum. 99% faster.</p><a href="mailto:x@y.com">x</a><form action="https://x.io"></form>',
    'main.js': 'fetch("/x")', 'styles.css': '', 'README.md': ''
  };
  const p = check(bad, 'control');
  const expected = ['headline', 'h1', 'Defense', '24', 'unlimited', 'guarantee', 'lorem', '%', 'email', 'mailto', 'action', 'network', 'nothing is sent'];
  const missed = expected.filter(k => !p.some(x => x.toLowerCase().includes(k.toLowerCase())));
  if (missed.length) { console.error('Control missed:', missed); process.exit(1); }
  console.log(`control produced ${p.length} findings`);
  console.log('OSBORNE_CONTROL_CAUGHT_ALL');
  process.exit(0);
}

const files = load();
const missing = Object.entries(files).filter(([, v]) => v === undefined).map(([k]) => k);
if (missing.length) { console.error('Missing files:', missing.join(', ')); process.exit(1); }
const problems = check(files, 'site');
if (problems.length) { console.error(problems.map(p => ' - ' + p).join('\n')); process.exit(1); }
console.log('All static checks passed for index.html, styles.css, main.js, README.md');
console.log('OSBORNE_STATIC_CHECKS_PASSED');
