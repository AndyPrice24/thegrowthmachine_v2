// Builds the single-file app: node tools/growth-machine/build.mjs
// Output: tools/growth-machine/dist/growth-machine-studio.html (open it directly in a browser; no server needed)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const js = `const STUDIO_BUILD = '${stamp}';\n` + ['model.js', 'questions.js', 'engagement.js', 'charts.js', 'flows.js', 'processes.js', 'demo.js', 'views.js', 'views2.js', 'leaks.js', 'report.js', 'app.js'].map((f) => `/* ---- ${f} ---- */\n${src(f)}`).join('\n');
const html = src('index.html')
  .replace('/*VIZ_CSS*/', () => src('viz.css'))
  .replace('/*REPORT_CSS*/', () => src('report.css'))
  .replace('/*APP_CSS*/', () => src('styles.css'))
  .replace('/*APP_JS*/', () => js);
mkdirSync(join(here, 'dist'), { recursive: true });
writeFileSync(join(here, 'dist', 'growth-machine-studio.html'), html);
console.log(`Built dist/growth-machine-studio.html (${(html.length / 1024).toFixed(0)} KB)`);
