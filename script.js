const form = document.getElementById('analyze-form');
const urlInput = document.getElementById('url-input');
const includeAssetsInput = document.getElementById('include-assets');
const includeVoiceInput = document.getElementById('include-voice');
const statusEl = document.getElementById('status');
const analysisSection = document.getElementById('analysis');
const analysisSubtitle = document.getElementById('analysis-subtitle');
const analysisContent = document.getElementById('analysis-content');
const saveButton = document.getElementById('save-analysis');
const libraryList = document.getElementById('library-list');
const librarySearch = document.getElementById('library-search');
const toolkitError = document.getElementById('toolkit-error');

const STORAGE_KEY = 'brand-vision-library-v1';

const state = {
  currentAnalysis: null,
  library: loadLibrary(),
};

renderLibrary();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const rawUrl = urlInput.value.trim();

  if (!rawUrl) {
    setStatus('Add a URL to get started.', 'error');
    return;
  }

  const url = normalizeUrl(rawUrl);
  form.querySelector('button[type="submit"]').disabled = true;
  setStatus('Analyzing the site and drafting your brand system…', 'info');
  toolkitError.hidden = true;

  try {
    const { analysis, warning } = await analyzeWebsite(url, {
      includeAssets: includeAssetsInput.checked,
      includeVoice: includeVoiceInput.checked,
    });

    state.currentAnalysis = analysis;
    renderAnalysis(analysis);
    setStatus('Brand system ready. Explore, expand, or save it to your library.', 'success');

    if (warning) {
      toolkitError.textContent = warning;
      toolkitError.hidden = false;
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'We could not generate an analysis for that site.', 'error');
    toolkitError.textContent = 'We couldn’t analyze that site automatically. Double-check the URL or use a CORS-friendly proxy before trying again.';
    toolkitError.hidden = false;
    analysisSection.hidden = true;
  } finally {
    form.querySelector('button[type="submit"]').disabled = false;
  }
});

analysisContent.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const sectionId = button.dataset.section;
  const action = button.dataset.action;

  if (!state.currentAnalysis) return;

  if (['overview', 'mission', 'tagline', 'hero', 'cta', 'elevator'].includes(sectionId)) {
    handleTextAction(sectionId, action);
    return;
  }

  if (sectionId === 'voice' && action === 'regenerate') {
    state.currentAnalysis.voice = generateVoice(state.currentAnalysis.context, createSeededRng(Date.now()));
    renderAnalysis(state.currentAnalysis);
    return;
  }

  if (sectionId === 'palette' && action === 'regenerate') {
    state.currentAnalysis.palette = generatePalette(state.currentAnalysis.context.colors, createSeededRng(Date.now()));
    renderAnalysis(state.currentAnalysis);
    return;
  }

  if (sectionId === 'fonts' && action === 'regenerate') {
    state.currentAnalysis.fonts = generateFonts(state.currentAnalysis.context.fonts, createSeededRng(Date.now()));
    renderAnalysis(state.currentAnalysis);
    return;
  }

  if (sectionId === 'assets' && action === 'regenerate') {
    state.currentAnalysis.assets = generateAssets(createSeededRng(Date.now()));
    renderAnalysis(state.currentAnalysis);
    return;
  }

  if (sectionId === 'logos' && action === 'regenerate') {
    state.currentAnalysis.logoDirections = generateLogos(state.currentAnalysis.context.logoHints, createSeededRng(Date.now()));
    renderAnalysis(state.currentAnalysis);
  }
});

saveButton.addEventListener('click', () => {
  if (!state.currentAnalysis) return;
  const clone = JSON.parse(JSON.stringify(state.currentAnalysis));
  const existingIndex = state.library.findIndex((entry) => entry.id === clone.id);

  if (existingIndex >= 0) {
    state.library[existingIndex] = clone;
  } else {
    state.library.unshift(clone);
  }

  persistLibrary();
  renderLibrary();
  setStatus('Saved to your library. Search and revisit it anytime.', 'success');
});

libraryList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-library-action]');
  if (!button) return;

  const { libraryAction: action, id } = button.dataset;
  const entryIndex = state.library.findIndex((item) => item.id === id);
  if (entryIndex < 0) return;

  if (action === 'load') {
    state.currentAnalysis = JSON.parse(JSON.stringify(state.library[entryIndex]));
    renderAnalysis(state.currentAnalysis);
    setStatus('Loaded analysis from your library.', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (action === 'delete') {
    state.library.splice(entryIndex, 1);
    persistLibrary();
    renderLibrary();
    setStatus('Removed from your library.', 'info');
  }
});

librarySearch.addEventListener('input', (event) => {
  renderLibrary(event.target.value.trim().toLowerCase());
});

async function analyzeWebsite(url, options) {
  const normalized = normalizeUrl(url);
  const fetchResult = await tryFetchSite(normalized);
  const context = buildContext(normalized, fetchResult.html, fetchResult.warning);
  const analysis = buildAnalysis(context, options);
  return { analysis, warning: fetchResult.warning };
}

function normalizeUrl(raw) {
  if (!/^https?:\/\//i.test(raw)) {
    return `https://${raw}`;
  }
  return raw;
}

async function tryFetchSite(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let warning = '';

  try {
    const response = await fetch(url, { mode: 'cors', signal: controller.signal });
    if (!response.ok) {
      warning = `We couldn’t access ${url} (status ${response.status}). The results are based on heuristics.`;
      return { html: null, warning };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text')) {
      warning = 'The response was not HTML. We generated insights using the URL context only.';
      return { html: null, warning };
    }

    const html = await response.text();
    return { html, warning: '' };
  } catch (error) {
    console.warn('Fetching failed', error);
    warning = 'We used AI heuristics because the site blocked direct analysis. Consider using a proxy if you need live content.';
    return { html: null, warning };
  } finally {
    clearTimeout(timeout);
  }
}

function buildContext(url, html, warning) {
  const urlObject = new URL(url);
  const domain = urlObject.hostname.replace(/^www\./, '');
  const siteName = deriveSiteName(domain);
  const context = {
    url,
    domain,
    siteName,
    pageTitle: siteName,
    description: '',
    keywords: [],
    headings: [],
    phrases: [],
    colors: [],
    fonts: [],
    logoHints: [],
    fetchWarning: warning,
    hasHtml: Boolean(html),
  };

  if (!html) {
    context.keywords = generateKeywordsFromDomain(domain);
    return context;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title');
  if (title && title.textContent.trim()) {
    context.pageTitle = title.textContent.trim();
  }

  const metaDescription = doc.querySelector('meta[name="description"]');
  if (metaDescription && metaDescription.content) {
    context.description = metaDescription.content.trim();
  }

  const metaKeywords = doc.querySelector('meta[name="keywords"]');
  if (metaKeywords && metaKeywords.content) {
    context.keywords = metaKeywords.content.split(',').map((word) => word.trim()).filter(Boolean);
  }

  const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
    .map((heading) => heading.textContent.trim())
    .filter(Boolean)
    .slice(0, 12);
  context.headings = headings;

  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map((p) => p.textContent.trim())
    .filter(Boolean)
    .slice(0, 18);
  context.phrases = paragraphs;

  if (!context.keywords.length) {
    context.keywords = deriveKeywords(headings, paragraphs);
  }

  context.colors = extractColors(html);
  context.fonts = extractFonts(html);
  context.logoHints = extractLogoHints(doc);

  return context;
}

function deriveSiteName(domain) {
  const parts = domain.split('.');
  const core = parts.length > 2 ? parts.slice(-3, -2)[0] : parts[0];
  if (!core) return domain;
  return core
    .split('-')
    .map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join(' ');
}

function generateKeywordsFromDomain(domain) {
  return domain
    .split('.')
    .flatMap((chunk) => chunk.split('-'))
    .filter(Boolean)
    .map((fragment) => fragment.replace(/\d+/g, ''))
    .filter(Boolean)
    .slice(0, 6);
}

function deriveKeywords(headings, paragraphs) {
  const text = [...headings, ...paragraphs].join(' ');
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'into', 'into', 'into', 'our', 'are', 'you', 'all']);
  const frequency = new Map();
  tokens.forEach((token) => {
    if (stopWords.has(token) || token.length < 3) return;
    frequency.set(token, (frequency.get(token) || 0) + 1);
  });
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 8);
}

function extractColors(html) {
  const matches = html.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  const uniqueColors = Array.from(new Set(matches.map((color) => color.length === 4 ? expandHex(color) : color.toLowerCase())));
  return uniqueColors.slice(0, 8);
}

function expandHex(shortHex) {
  if (shortHex.length !== 4) return shortHex;
  return `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}`;
}

function extractFonts(html) {
  const matches = html.match(/font-family\s*:\s*([^;"']+)/gi) || [];
  return matches
    .map((match) => match.split(':')[1].trim())
    .map((family) => family.replace(/['\"]+/g, ''))
    .map((family) => family.split(',')[0].trim())
    .filter(Boolean)
    .slice(0, 6);
}

function extractLogoHints(doc) {
  return Array.from(doc.querySelectorAll('img'))
    .map((img) => ({
      alt: img.alt || '',
      src: img.src || '',
    }))
    .filter((meta) => /logo|mark|brand/i.test(meta.alt) || /logo|brand/i.test(meta.src))
    .map((meta) => meta.alt || meta.src)
    .slice(0, 6);
}

function buildAnalysis(context, options) {
  const seedSource = `${context.domain}-${context.pageTitle}-${context.keywords.join('-')}`;
  const seed = hashString(seedSource || context.domain);
  const rng = createSeededRng(seed);

  const voice = options.includeVoice ? generateVoice(context, rng) : [];
  const palette = generatePalette(context.colors, rng);
  const fonts = generateFonts(context.fonts, rng);
  const assets = options.includeAssets ? generateAssets(rng) : [];
  const logoDirections = generateLogos(context.logoHints, rng);

  const textSections = {
    overview: {
      id: 'overview',
      label: 'Brand Overview',
      type: 'overview',
      body: generateOverview(context, rng),
    },
    mission: {
      id: 'mission',
      label: 'Mission Statement',
      type: 'mission',
      body: generateMission(context, rng),
    },
    tagline: {
      id: 'tagline',
      label: 'Tagline',
      type: 'tagline',
      body: generateTagline(context, rng),
    },
    hero: {
      id: 'hero',
      label: 'Hero Copy',
      type: 'hero',
      body: generateHero(context, rng),
    },
    cta: {
      id: 'cta',
      label: 'Call to Action',
      type: 'cta',
      body: generateCTA(context, rng),
    },
    elevator: {
      id: 'elevator',
      label: 'Elevator Pitch',
      type: 'elevator',
      body: generateElevator(context, rng),
    },
  };

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    url: context.url,
    domain: context.domain,
    siteName: context.siteName,
    pageTitle: context.pageTitle,
    context,
    textSections,
    voice,
    palette,
    fonts,
    assets,
    logoDirections,
  };
}

function generateOverview(context, rng) {
  const openers = [
    'A future-facing brand rooted in',
    'An experience-first brand translating',
    'An elevated expression of',
    'A design-forward company celebrating',
    'A modern brand harmonizing',
  ];
  const focuses = [
    'clarity and craft',
    'precision and warmth',
    'performance and empathy',
    'innovation and trust',
    'ambition and belonging',
  ];
  const descriptors = context.keywords.length ? context.keywords.slice(0, 3).join(', ') : context.siteName;
  return `${pick(openers, rng)} ${descriptors}. ${capitalize(pick(focuses, rng))} define the experience across every touchpoint.`;
}

function generateMission(context, rng) {
  const verbs = ['amplify', 'elevate', 'redefine', 'unlock', 'craft'];
  const outcomes = ['confident choices', 'meaningful momentum', 'seamless journeys', 'signature moments', 'lasting loyalty'];
  const audience = deriveAudience(context);
  return `We ${pick(verbs, rng)} ${audience} with ${pick(context.keywords.concat(['distinctive thinking', 'human-centric systems']), rng)} so they achieve ${pick(outcomes, rng)}.`;
}

function generateTagline(context, rng) {
  const patterns = [
    ['Where', 'meets'],
    ['Designed for', 'built with'],
    ['Powering', 'with'],
    ['Beyond', 'toward'],
    ['Crafting', 'for'],
  ];
  const [first, second] = pick(patterns, rng);
  const keywordA = capitalize(pick(context.keywords.concat([context.siteName, 'bold ideas', 'clarity']), rng));
  const keywordB = capitalize(pick(context.keywords.concat(['human impact', 'clarity']), rng));
  return `${first} ${keywordA} ${second} ${keywordB}`;
}

function generateHero(context, rng) {
  const lead = pick([
    'Make every interaction feel intentional.',
    'Bring signature clarity to your next launch.',
    'Unlock a brand presence that moves people.',
    'Design an ecosystem that grows with you.',
    'Turn complexity into a premium experience.',
  ], rng);
  const benefit = pick([
    'We translate your value into immersive stories that scale.',
    'Our AI-guided system distills the essence of your brand in minutes.',
    'From palette to product copy, every artifact is elevated and cohesive.',
    'We listen, interpret, and build a brand architecture that resonates.',
    'Every deliverable balances meticulous craft with measurable impact.',
  ], rng);
  return `${lead}\n${benefit}`;
}

function generateCTA(context, rng) {
  const ctas = [
    'Start the brand blueprint',
    'Preview your signature system',
    'Activate the experience kit',
    'Unlock the next iteration',
    'Launch with clarity',
  ];
  return pick(ctas, rng);
}

function generateElevator(context, rng) {
  const structures = [
    `We partner with ${deriveAudience(context)} to turn ${pick(context.keywords.concat(['ambition']), rng)} into unmistakable experiences.`,
    `From discovery to deployment, we orchestrate ${pick(['strategy', 'design', 'content', 'technology'], rng)} so ${deriveAudience(context)} move faster with confidence.`,
    `Our AI-assisted studio transforms ${pick(context.keywords.concat(['visionary concepts', 'innovative teams']), rng)} into iconic systems built to scale.`,
  ];
  return pick(structures, rng);
}

function handleTextAction(sectionId, action) {
  const section = state.currentAnalysis.textSections[sectionId];
  if (!section) return;

  if (action === 'expand') {
    section.body = expandText(section.type, section.body, state.currentAnalysis.context);
  } else if (action === 'regenerate') {
    section.body = regenerateText(section.type, state.currentAnalysis.context);
  }

  renderAnalysis(state.currentAnalysis);
}

function expandText(type, currentBody, context) {
  const rng = createSeededRng(hashString(currentBody + Date.now()));
  if (type === 'tagline') {
    const alternate = generateTagline(context, rng);
    if (currentBody.includes('\n')) {
      return `${currentBody}\n${alternate}`;
    }
    return `${currentBody}\n${alternate}`;
  }

  const additions = [
    'We refine every touchpoint into a cohesive narrative.',
    'Our process pairs human intuition with AI acceleration.',
    'It’s a living system that evolves with your roadmap.',
    'Expect a high-gloss presentation and production-ready assets.',
  ];
  return `${currentBody}\n\n${pick(additions, rng)}`;
}

function regenerateText(type, context) {
  const rng = createSeededRng(Date.now());
  switch (type) {
    case 'overview':
      return generateOverview(context, rng);
    case 'mission':
      return generateMission(context, rng);
    case 'tagline':
      return generateTagline(context, rng);
    case 'hero':
      return generateHero(context, rng);
    case 'cta':
      return generateCTA(context, rng);
    case 'elevator':
      return generateElevator(context, rng);
    default:
      return '';
  }
}

function generateVoice(context, rng) {
  const tones = [
    { name: 'Refined Confidence', description: 'Balances expert clarity with an effortless, concierge tone.' },
    { name: 'Analytical Warmth', description: 'Incorporates data-rich insights while remaining human and inviting.' },
    { name: 'Progressive Minimalism', description: 'Speaks in crisp sentences with intentional emphasis on what matters.' },
    { name: 'Electric Optimism', description: 'Infuses momentum and forward-looking energy into every line.' },
    { name: 'Strategic Empathy', description: 'Centers the audience’s needs and narrates how the brand clears the path.' },
  ];
  const shuffled = shuffle([...tones], rng);
  return shuffled.slice(0, 3);
}

function generatePalette(baseColors, rng) {
  const curated = [
    { name: 'Polar Dawn', colors: ['#0E1C36', '#2F80ED', '#6FC3DF', '#F2F6FF', '#101926'] },
    { name: 'Mineral Mist', colors: ['#1B1F3B', '#5D5FEF', '#9DA9FF', '#F7F7FF', '#111827'] },
    { name: 'Soft Alloy', colors: ['#111827', '#3B82F6', '#93C5FD', '#E2E8F0', '#F9FAFB'] },
    { name: 'Verdant Halo', colors: ['#0F172A', '#22C55E', '#86EFAC', '#F0FDF4', '#111827'] },
    { name: 'Lunar Quartz', colors: ['#0B1120', '#6366F1', '#A855F7', '#F5F3FF', '#0F172A'] },
  ];

  let palette = pick(curated, rng).colors;
  if (baseColors.length >= 3) {
    palette = baseColors.slice(0, 5);
  }

  const roles = ['Primary', 'Accent', 'Highlight', 'Surface', 'Text'];
  return palette.map((hex, index) => ({
    role: roles[index] || `Tone ${index + 1}`,
    hex,
    name: createColorName(hex, rng),
  }));
}

function createColorName(hex, rng) {
  const moods = ['Aurora', 'Nimbus', 'Halo', 'Spectra', 'Pulse', 'Cascade'];
  const textures = ['Glass', 'Silk', 'Chrome', 'Mist', 'Quartz', 'Glow'];
  return `${pick(moods, rng)} ${pick(textures, rng)}`;
}

function generateFonts(fontHints, rng) {
  const library = [
    { family: 'SF Pro Display', pairing: 'SF Pro Text', usage: 'Headlines & UI' },
    { family: 'Inter', pairing: 'Inter', usage: 'Digital interfaces & systems' },
    { family: 'Neue Haas Grotesk', pairing: 'Freight Text', usage: 'Editorial storytelling' },
    { family: 'Suisse Intl', pairing: 'Suisse Works', usage: 'Brand & marketing collateral' },
    { family: 'Avenir Next', pairing: 'Charter', usage: 'Pitch decks & whitepapers' },
  ];

  const hints = fontHints.map((hint) => ({ family: hint, pairing: 'System Sans', usage: 'Based on detected styles' }));
  const combined = hints.length ? hints.concat(library) : library;
  const shuffled = shuffle([...combined], rng);
  return shuffled.slice(0, 3);
}

function generateAssets(rng) {
  const options = [
    { name: 'Launch Deck', description: 'Twelve-slide keynote-ready presentation aligning strategy, visuals, and proof points.' },
    { name: 'Product UI Kit', description: 'Figma components, grids, and sample flows matching the system typography and palette.' },
    { name: 'Social Momentum Pack', description: 'Motion-ready templates for announcements, hiring, and cultural storytelling.' },
    { name: 'Sales Enablement Suite', description: 'One-pager, case study shell, and outreach messaging tailored to the new voice.' },
    { name: 'Website Narrative Framework', description: 'Page-by-page outline with content blocks, hero messaging, and conversion cues.' },
    { name: 'Brand Guidelines Capsule', description: 'Concise spec book covering logo usage, color ratios, and tone guardrails.' },
  ];
  const shuffled = shuffle([...options], rng);
  return shuffled.slice(0, 4);
}

function generateLogos(hints, rng) {
  const treatments = [
    { name: 'Precision Wordmark', description: 'Monoline geometry with subtle ink traps inspired by neo-grotesk typography.' },
    { name: 'Flux Monogram', description: 'Interlocking initials with soft chamfers to mirror the digital-first experience.' },
    { name: 'Signal Glyph', description: 'Abstract symbol built from modular shapes suggesting connection and clarity.' },
    { name: 'Aurora Emblem', description: 'Radiant gradient field with negative-space iconography for hero applications.' },
    { name: 'Heritage Crest', description: 'Timeless ligature set within a circular frame, ideal for premium packaging.' },
  ];

  if (hints.length) {
    const custom = hints.slice(0, 3).map((hint) => ({
      name: 'Inspired Direction',
      description: `Reimagine “${hint}” with elevated materials, premium spacing, and adaptive lockups.`,
    }));
    return custom.concat(shuffle([...treatments], rng).slice(0, 2));
  }

  return shuffle([...treatments], rng).slice(0, 4);
}

function deriveAudience(context) {
  if (context.keywords.some((word) => /team|business|company/i.test(word))) {
    return 'growth-minded teams';
  }
  if (context.keywords.some((word) => /customer|client|community/i.test(word))) {
    return 'the audiences you serve';
  }
  return 'modern leaders';
}

function setStatus(message, tone = 'info') {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function renderAnalysis(analysis) {
  if (!analysis) {
    analysisSection.hidden = true;
    return;
  }

  analysisSection.hidden = false;
  const { textSections, voice, palette, fonts, assets, logoDirections } = analysis;
  const context = analysis.context;

  const cards = [];

  cards.push(createTextCard(textSections.overview, analysis.siteName, analysis.domain));
  cards.push(createTextCard(textSections.tagline));
  cards.push(createTextCard(textSections.mission));
  cards.push(createVoiceCard(voice));
  cards.push(createTextCard(textSections.hero));
  cards.push(createTextCard(textSections.cta));
  cards.push(createTextCard(textSections.elevator));
  cards.push(createPaletteCard(palette));
  cards.push(createFontCard(fonts));
  cards.push(createLogoCard(logoDirections));
  cards.push(createAssetCard(assets));

  analysisContent.innerHTML = cards.filter(Boolean).join('');

  if (context.fetchWarning) {
    analysisSubtitle.textContent = 'Results generated with contextual AI heuristics due to limited site access.';
  } else {
    analysisSubtitle.textContent = 'Results generated with contextual AI heuristics.';
  }
}

function createTextCard(section, name, domain) {
  if (!section) return '';
  const subtitle = name && domain && section.id === 'overview'
    ? `<p class="result-card__meta">${escapeHtml(name)} · ${escapeHtml(domain)}</p>`
    : '';
  const expandButton = section.id === 'tagline'
    ? `<div class="result-card__actions"><button type="button" data-action="expand" data-section="${section.id}">Expand</button><button type="button" data-action="regenerate" data-section="${section.id}">Regenerate</button></div>`
    : `<div class="result-card__actions"><button type="button" data-action="expand" data-section="${section.id}">Expand</button><button type="button" data-action="regenerate" data-section="${section.id}">Regenerate</button></div>`;

  return `
    <article class="result-card" data-section="${section.id}">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">${escapeHtml(section.label)}</h3>
          ${subtitle}
        </div>
        ${expandButton}
      </div>
      <div class="result-card__body">${escapeHtml(section.body)}</div>
    </article>
  `;
}

function createVoiceCard(voice) {
  if (!voice || !voice.length) return '';
  const items = voice
    .map((item) => `<li><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.description)}</span></li>`)
    .join('');
  return `
    <article class="result-card" data-section="voice">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Voice Pillars</h3>
        </div>
        <div class="result-card__actions">
          <button type="button" data-action="regenerate" data-section="voice">Regenerate</button>
        </div>
      </div>
      <ul class="voice-list">${items}</ul>
    </article>
  `;
}

function createPaletteCard(palette) {
  if (!palette || !palette.length) return '';
  const swatches = palette
    .map((item) => `
      <li class="palette__item">
        <div class="palette__swatch" style="background:${item.hex};"></div>
        <div class="palette__meta">
          <strong>${escapeHtml(item.role)}</strong>
          <span>${escapeHtml(item.name)}</span>
          <code>${escapeHtml(item.hex)}</code>
        </div>
      </li>
    `)
    .join('');
  return `
    <article class="result-card" data-section="palette">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Color System</h3>
        </div>
        <div class="result-card__actions">
          <button type="button" data-action="regenerate" data-section="palette">Regenerate</button>
        </div>
      </div>
      <ul class="palette">${swatches}</ul>
    </article>
  `;
}

function createFontCard(fonts) {
  if (!fonts || !fonts.length) return '';
  const rows = fonts
    .map((font) => `<li><strong>${escapeHtml(font.family)}</strong><span>${escapeHtml(font.usage)}</span><span>${escapeHtml(font.pairing)}</span></li>`)
    .join('');
  return `
    <article class="result-card" data-section="fonts">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Typography</h3>
        </div>
        <div class="result-card__actions">
          <button type="button" data-action="regenerate" data-section="fonts">Regenerate</button>
        </div>
      </div>
      <ul class="font-stack">${rows}</ul>
    </article>
  `;
}

function createLogoCard(logoDirections) {
  if (!logoDirections || !logoDirections.length) return '';
  const rows = logoDirections
    .map((logo) => `<li><strong>${escapeHtml(logo.name)}</strong><span>${escapeHtml(logo.description)}</span></li>`)
    .join('');
  return `
    <article class="result-card" data-section="logos">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Logo Directions</h3>
        </div>
        <div class="result-card__actions">
          <button type="button" data-action="regenerate" data-section="logos">Regenerate</button>
        </div>
      </div>
      <ul class="logo-grid">${rows}</ul>
    </article>
  `;
}

function createAssetCard(assets) {
  if (!assets || !assets.length) return '';
  const rows = assets
    .map((asset) => `<li><strong>${escapeHtml(asset.name)}</strong><span>${escapeHtml(asset.description)}</span></li>`)
    .join('');
  return `
    <article class="result-card" data-section="assets">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Asset Concepts</h3>
        </div>
        <div class="result-card__actions">
          <button type="button" data-action="regenerate" data-section="assets">Regenerate</button>
        </div>
      </div>
      <ul class="asset-list">${rows}</ul>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createSeededRng(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return function rng() {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

function pick(array, rng) {
  if (!array.length) return '';
  const index = Math.floor(rng() * array.length);
  return array[index];
}

function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn('Unable to parse library', error);
    return [];
  }
}

function persistLibrary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.library));
}

function renderLibrary(filterTerm = '') {
  if (!state.library.length) {
    libraryList.innerHTML = '<li class="empty-state">Your saved brand systems will live here.</li>';
    return;
  }

  const filtered = state.library.filter((entry) => {
    if (!filterTerm) return true;
    const haystack = [entry.siteName, entry.domain, entry.pageTitle, Object.values(entry.textSections || {}).map((section) => section.body).join(' ')].join(' ').toLowerCase();
    return haystack.includes(filterTerm);
  });

  if (!filtered.length) {
    libraryList.innerHTML = '<li class="empty-state">No matches. Try another search term.</li>';
    return;
  }

  const rows = filtered
    .map((entry) => {
      const date = new Date(entry.createdAt);
      const subtitle = `${escapeHtml(entry.domain)} · ${date.toLocaleString(undefined, { month: 'short', day: 'numeric' })}`;
      return `
        <li class="library__item">
          <h3 class="library__title">${escapeHtml(entry.siteName)}</h3>
          <div class="library__meta">
            <span>${subtitle}</span>
            <div class="library__actions">
              <button type="button" data-library-action="load" data-id="${entry.id}">Load</button>
              <button type="button" data-library-action="delete" data-id="${entry.id}">Remove</button>
            </div>
          </div>
        </li>
      `;
    })
    .join('');

  libraryList.innerHTML = rows;
}
