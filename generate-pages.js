/**
 * FileFlyr – Static Page Generator
 * 
 * Generates real HTML pages for every converter from the existing
 * js/converter-registry.js and js/converter-content.js files.
 *
 * Usage (from project root):
 *   node generate-pages.js
 *
 * Output: convert/{slug}/index.html  (38 files)
 */

const fs   = require('fs');
const path = require('path');

// ─── Parse registry & content (strip ES module syntax) ────────────────────────
function loadModule(filePath, exportName) {
  let src = fs.readFileSync(filePath, 'utf8');
  // strip export keywords
  src = src.replace(/^export\s+const\s+/gm, 'const ');
  src = src.replace(/^export\s+function\s+/gm, 'function ');
  const mod = { exports: {} };
  try {
    (new Function('module', 'exports', src + `\nmodule.exports = ${exportName};`))(mod, mod.exports);
  } catch(e) {
    console.error('Error loading', filePath, e.message);
    process.exit(1);
  }
  return mod.exports;
}

const REGISTRY = loadModule('./js/converter-registry.js', 'CONVERTER_REGISTRY');
const CONTENT  = loadModule('./js/converter-content.js',  'CONVERTER_CONTENT');

// ─── SVG Icon map ──────────────────────────────────────────────────────────────
const ICONS = {
  image:     `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  globe:     `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  smartphone:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  box:       `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  tag:       `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  droplet:   `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  camera:    `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  compress:  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`,
  resize:    `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  scissors:  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  rotate:    `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  circle:    `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
  xSquare:   `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`,
  fileText:  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  layers:    `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  code:      `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  grid:      `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  music:     `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  barChart:  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  video:     `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  film:      `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
};

const LIBRARY_URLS = {
  'jspdf':    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'pdf.js':   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'pdf-lib':  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'heic2any': 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
  'lamejs':   'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function renderContent(content) {
  if (!content) return '';
  let html = '';
  (content.sections || []).forEach(s => {
    html += `\n    <div class="info-section" id="${s.id}">\n      <h2>${s.title}</h2>\n      ${s.content}\n    </div>`;
  });
  if (content.faq && content.faq.length) {
    html += `\n    <div class="faq-section">\n      <h2>Frequently Asked Questions</h2>`;
    content.faq.forEach(f => {
      html += `\n      <div class="faq-item">\n        <div class="faq-question">${f.question}</div>\n        <div class="faq-answer">${f.answer}</div>\n      </div>`;
    });
    html += `\n    </div>`;
  }
  return html;
}

function libScripts(libs) {
  return (libs || [])
    .filter(l => LIBRARY_URLS[l])
    .map(l => `    <script src="${LIBRARY_URLS[l]}"></script>`)
    .join('\n');
}

// ─── HTML Template ─────────────────────────────────────────────────────────────
function generateHTML(slug, cfg, content) {
  const url     = `https://fileflyr.com/convert/${slug}/`;
  const icon    = ICONS[cfg.icon] || ICONS.image;
  const accepts = (cfg.acceptFormats || []).join(',');
  const libs    = libScripts(cfg.libraries);
  const infoHTML = renderContent(content);

  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "WebApplication",
    "name": `${cfg.h1} – FileFlyr`, "url": url, "description": cfg.description,
    "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any (Web Browser)",
    "offers": {"@type":"Offer","price":"0","priceCurrency":"USD"},
    "featureList": ["100% browser-based","No file uploads","Free forever","Privacy-first"]
  }, null, 2);

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type":"ListItem","position":1,"name":"FileFlyr","item":"https://fileflyr.com/"},
      {"@type":"ListItem","position":2,"name":"Converters","item":"https://fileflyr.com/#converters"},
      {"@type":"ListItem","position":3,"name":cfg.h1,"item":url}
    ]
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="viMnSLF_Y6opfcGR7XVh2iiPsvyLGfzk1G03qVmXrzc" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3654554314003005" crossorigin="anonymous"></script>

    <title>${cfg.title}</title>
    <meta name="title" content="${cfg.title}">
    <meta name="description" content="${cfg.description}">
    <meta name="keywords" content="${slug.replace(/-/g,' ')}, ${slug}, free ${slug} converter, online ${slug}, no upload, fileflyr">
    <meta name="author" content="FileFlyr">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <link rel="apple-touch-icon" href="/assets/favicon.svg">
    <link rel="shortcut icon" href="/assets/favicon.svg">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${cfg.title}">
    <meta property="og:description" content="${cfg.description}">
    <meta property="og:image" content="https://fileflyr.com/assets/og-image.png">
    <meta property="og:site_name" content="FileFlyr">
    <meta property="og:locale" content="en_US">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${cfg.title}">
    <meta name="twitter:description" content="${cfg.description}">
    <meta name="twitter:image" content="https://fileflyr.com/assets/twitter-image.png">
    <meta name="twitter:creator" content="@fileflyr">

    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="FileFlyr">
    <meta name="theme-color" content="#6366f1">

    <script type="application/ld+json">
${schema}
    </script>
    <script type="application/ld+json">
${breadcrumbSchema}
    </script>

    <link rel="sitemap" type="application/xml" href="/sitemap.xml">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <div class="header-content">
            <a href="/" class="logo">FileFlyr</a>
            <nav>
                <a href="/#converters">Converters</a>
                <a href="/#how">How it works</a>
                <a href="/#privacy">Privacy</a>
            </nav>
        </div>
    </header>

    <nav class="breadcrumb" aria-label="Breadcrumb">
        <div class="breadcrumb-content">
            <a href="/">Home</a>
            <span class="breadcrumb-sep">›</span>
            <a href="/#converters">Converters</a>
            <span class="breadcrumb-sep">›</span>
            <span>${cfg.h1}</span>
        </div>
    </nav>

    <div class="converter-page">
        <div class="converter-box">
            <h1 id="converterTitle">${cfg.h1}</h1>
            <p class="subtitle" id="converterSubtitle">${cfg.subtitle}</p>

            <div id="dropZone" class="drop-zone">
                <div class="drop-content">
                    <div class="drop-icon" id="converterIcon">${icon}</div>
                    <div class="drop-text">Drag &amp; Drop files here</div>
                    <div class="drop-subtext">or click to browse</div>
                </div>
            </div>

            <input type="file" id="fileInput" multiple accept="${accepts}" style="display: none;">

            <div id="previewArea" class="preview-area" style="display: none;">
                <h3>Selected Files (<span id="fileCount">0</span>)</h3>
                <div id="fileList" class="image-list"></div>
            </div>

            <div id="optionsArea" class="options-area" style="display: none;">
                <h3>Conversion Options</h3>
                <div id="optionsContent" class="options-grid"></div>
                <button id="convertBtn" class="convert-btn">Convert Files</button>
            </div>

            <div id="progressArea" class="progress-area" style="display: none;">
                <div class="progress-bar">
                    <div id="progressFill" class="progress-fill" style="width: 0%;"></div>
                </div>
                <p id="progressText">Processing...</p>
            </div>

            <div id="downloadArea" class="download-area" style="display: none;">
                <div class="success-icon">&#x2713;</div>
                <h3>Conversion Complete!</h3>
                <div id="downloadButtons"></div>
                <button id="resetBtn" class="reset-btn">Convert More Files</button>
            </div>

            <div id="postConversionAd" class="ad-container ad-post-conversion" style="display: none;">
                <div class="ad-placeholder ad-large-rectangle">
                    <span class="ad-label">Advertisement</span>
                    <div class="ad-placeholder-content">336 x 280</div>
                </div>
            </div>

            <div class="privacy-notice">
                <p><strong>&#x1F512; 100% Private:</strong> All files are processed locally in your browser. Nothing is uploaded to any server.</p>
            </div>
        </div>
    </div>

    <div class="ad-container ad-mid-content">
        <div class="ad-placeholder ad-medium-rectangle">
            <span class="ad-label">Advertisement</span>
            <div class="ad-placeholder-content">300 x 250</div>
        </div>
    </div>

    <div class="converter-info-content">
${infoHTML}
    </div>

    <footer>
        <div class="footer-content">
            <div class="footer-main">
                <div class="footer-brand">
                    <div class="logo">FileFlyr</div>
                    <p>Professional file conversion tools.<br>100% free, 100% private.</p>
                </div>
                <div class="footer-links">
                    <div class="footer-column">
                        <h4>Popular Tools</h4>
                        <a href="/convert/png-to-jpg/">PNG to JPG</a>
                        <a href="/convert/jpg-to-png/">JPG to PNG</a>
                        <a href="/convert/heic-to-jpg/">HEIC to JPG</a>
                        <a href="/convert/img-to-pdf/">Image to PDF</a>
                    </div>
                    <div class="footer-column">
                        <h4>Resources</h4>
                        <a href="/#how">How it works</a>
                        <a href="/#privacy">Privacy</a>
                        <a href="/#converters">All Converters</a>
                        <a href="/licenses.html">Open Source Licenses</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <nav style="margin-bottom: 16px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                    <a href="/impressum.html" style="color: var(--text-secondary); text-decoration: none; font-size: 14px;">Impressum</a>
                    <span style="color: var(--text-tertiary);">&#183;</span>
                    <a href="/datenschutz.html" style="color: var(--text-secondary); text-decoration: none; font-size: 14px;">Datenschutz</a>
                    <span style="color: var(--text-tertiary);">&#183;</span>
                    <a href="/licenses.html" style="color: var(--text-secondary); text-decoration: none; font-size: 14px;">Lizenzen</a>
                    <span style="color: var(--text-tertiary);">&#183;</span>
                    <a href="/about.html" style="color: var(--text-secondary); text-decoration: none; font-size: 14px;">About</a>
                    <span style="color: var(--text-tertiary);">&#183;</span>
                    <a href="/changes.html" style="color: var(--text-secondary); text-decoration: none; font-size: 14px;">Changelog</a>
                </nav>
                <p>&copy; 2026 FileFlyr powered by <a href="https://frame-sphere.vercel.app/" class="footer-bottom-framesphere">FrameSphere</a></p>
            </div>
        </div>
    </footer>

    <script src="/js/cookie-consent.js"></script>
    <script src="/js/core.js"></script>
${libs}
    <script type="module">
        import { init } from '/js/converters/${cfg.module}.js';
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => init());
        } else {
            init();
        }
    </script>
</body>
</html>`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const outBase = path.join(__dirname, 'convert');
let created = 0, skipped = 0;

for (const [slug, cfg] of Object.entries(REGISTRY)) {
  const dir  = path.join(outBase, slug);
  const file = path.join(dir, 'index.html');

  fs.mkdirSync(dir, { recursive: true });

  // Skip if already manually edited (check mtime vs this script's mtime)
  const content = CONTENT[slug] || null;
  const html = generateHTML(slug, cfg, content);
  fs.writeFileSync(file, html, 'utf8');
  console.log(`  ✅  ${slug}`);
  created++;
}

console.log(`\n✅  Done! Generated ${created} pages in ./convert/\n`);
console.log('Next steps:');
console.log('  1. Deploy – Cloudflare Pages will serve /convert/{slug}/ directly');
console.log('  2. The _redirects file no longer falls back to index.html for /convert/*');
console.log('  3. Run this script again after changing registry or content.\n');
