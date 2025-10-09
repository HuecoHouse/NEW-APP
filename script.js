const form = document.querySelector('#analysis-form');
const urlInput = document.querySelector('#source-url');
const resultsGrid = document.querySelector('#results-grid');
const statusEl = document.querySelector('#results-status');
const template = document.querySelector('#result-card-template');
const modal = document.querySelector('#modal');
const modalBody = modal.querySelector('.modal-body');
const modalClose = modal.querySelector('.modal-close');

const audioEl = document.querySelector('#soundtrack-audio');
const playToggle = document.querySelector('#play-toggle');
const prevBtn = document.querySelector('#prev-btn');
const nextBtn = document.querySelector('#next-btn');
const trackTitle = document.querySelector('#track-title');

const tracks = [
  {
    title: 'Sunrise Sketch',
    src: 'https://cdn.pixabay.com/download/audio/2022/09/01/audio_13b716ccb0.mp3?filename=serene-view-118199.mp3',
    attribution: 'Ambient wave 118199',
  },
  {
    title: 'Soft Focus',
    src: 'https://cdn.pixabay.com/download/audio/2021/09/24/audio_c1232dba6e.mp3?filename=ambient-corporate-11254.mp3',
    attribution: 'Ambient corporate 11254',
  },
  {
    title: 'Nordic Air',
    src: 'https://cdn.pixabay.com/download/audio/2021/11/09/audio_541c8bb398.mp3?filename=ambient-piano-112191.mp3',
    attribution: 'Ambient piano 112191',
  },
];
let currentTrack = 0;
let isPlaying = false;

const brandPillars = {
  archetypes: [
    'Visionary guide',
    'Modern artisan',
    'Human-first technologist',
    'Playful futurist',
    'Quiet disruptor',
    'Purpose-led collaborator',
  ],
  tones: [
    'calm confidence',
    'refined optimism',
    'luminous minimalism',
    'uplifting momentum',
    'precise warmth',
    'poetic pragmatism',
  ],
  palettes: [
    ['#0B1F3A', '#24528F', '#9EB9E5', '#F5F7FB'],
    ['#1B1B1F', '#3A5168', '#7DA7C5', '#F5F2EC'],
    ['#161A1D', '#2F5A73', '#83D0F2', '#F9FBFF'],
    ['#101725', '#3F4C6B', '#9EA6FF', '#F4F5FD'],
    ['#0F2433', '#2D6B6F', '#89D3C6', '#F5FFFB'],
    ['#111720', '#51308D', '#BFAAF1', '#F8F5FF'],
  ],
  fonts: [
    { display: 'Playfair Display', support: 'Inter' },
    { display: 'Space Grotesk', support: 'Satoshi' },
    { display: 'Recoleta', support: 'Work Sans' },
    { display: 'Canela', support: 'GT America' },
    { display: 'Aeonik', support: 'Söhne' },
    { display: 'Neue Montreal', support: 'IBM Plex Sans' },
  ],
  logoMotifs: [
    'Fluid monogram with negative-space horizon',
    'Minimalist wordmark with modular ligatures',
    'Circular emblem echoing ripple gradients',
    'Linear crest inspired by architectural grids',
    'Soft geometric mark with dual-tone glow',
    'Dynamic logotype featuring vertical rhythm',
  ],
  textures: [
    'translucent glass over diffused gradients',
    'micro patterns derived from topographic lines',
    'soft grain overlays with subtle chromatic shifts',
    'light-filled vignettes with optical blur',
    'tonal mesh gradients with iridescent finish',
    'architectural photography framed with blur edges',
  ],
  voice: [
    'Illuminate the why behind every interaction.',
    'Design clarity for people navigating complex choices.',
    'Blend poetic storytelling with purposeful momentum.',
    'Invite curiosity with grounded, human language.',
    'Celebrate the harmony of craft and cutting-edge innovation.',
    'Anchor every moment in empathy and elegant detail.',
  ],
  taglines: [
    'Elevate the everyday future.',
    'Where clarity meets quiet confidence.',
    'Crafting luminous moments of trust.',
    'A softer path to bold innovation.',
    'Designing resonance for modern life.',
    'Amplify the calm before the breakthrough.',
  ],
  snippets: [
    'We translate intricate ideas into serene, intuitive experiences that feel inevitable.',
    'From color to cadence, every touchpoint is tuned for people who crave purposeful innovation.',
    'Our platforms hum with quiet energy — orchestras of detail designed to stay out of the way.',
    'We believe in progress that respects human pace, designing tools that breathe with you.',
    'Each interaction balances clarity and allure, ensuring the brand feels both trusted and unexpected.',
    'We give teams a compass for decision-making, pairing data intuition with emotive storytelling.',
  ],
};

function seededRandom(seed) {
  let value = 0;
  for (const char of seed) {
    value = (value * 31 + char.charCodeAt(0)) % 233280;
  }
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function pick(array, rng) {
  return array[Math.floor(rng() * array.length)];
}

function createPalette(seed, rng) {
  const base = pick(brandPillars.palettes, rng);
  const highlight = Math.floor(rng() * base.length);
  const rotated = base.map((hex, index) => {
    if (index === highlight) {
      return shiftHex(hex, rng);
    }
    return hex;
  });
  return rotated;
}

function shiftHex(hex, rng) {
  const base = parseInt(hex.replace('#', ''), 16);
  const channel = (offset) => {
    const shift = Math.floor(rng() * 32) - 16;
    let value = (base >> (offset * 8)) & 0xff;
    value = Math.min(255, Math.max(0, value + shift));
    return value;
  };
  const r = channel(2).toString(16).padStart(2, '0');
  const g = channel(1).toString(16).padStart(2, '0');
  const b = channel(0).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function summariseUrl(url) {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.replace('www.', '').split('.');
    const core = parts[0] ?? 'brand';
    return core.replace(/[^a-z0-9]/gi, ' ').trim();
  } catch (error) {
    return 'brand';
  }
}

function generateBrandSystem(url, toggles) {
  const seedKey = summariseUrl(url) || 'brand';
  const rng = seededRandom(seedKey);
  const archetype = pick(brandPillars.archetypes, rng);
  const tone = pick(brandPillars.tones, rng);
  const palette = createPalette(seedKey, rng);
  const fonts = pick(brandPillars.fonts, rng);
  const logo = pick(brandPillars.logoMotifs, rng);
  const texture = pick(brandPillars.textures, rng);
  const voice = pick(brandPillars.voice, rng);
  const tagline = pick(brandPillars.taglines, rng);
  const snippet = pick(brandPillars.snippets, rng);

  const results = [];

  results.push({
    title: 'Brand Narrative',
    summary: `Position ${seedKey} as a ${archetype} with ${tone}.`,
    items: [
      `North star: ${voice}`,
      `Signature vibe: ${texture}`,
      `Tagline: “${tagline}”`,
    ],
    detail: [
      `Brand essence`,
      `Archetype: ${archetype}`,
      `Primary tone: ${tone}`,
      `Supporting statement: ${snippet}`,
    ],
  });

  results.push({
    title: 'Color & Material',
    summary: 'Palette tuned for luminous digital and physical touchpoints.',
    items: palette.map((hex) => `Color swatch ${hex}`),
    detail: palette.map((hex, idx) => `Color ${idx + 1}: ${hex}`),
  });

  results.push({
    title: 'Typography System',
    summary: 'Pair a sculpted display with a highly legible workhorse.',
    items: [
      `Display: ${fonts.display}`,
      `Support: ${fonts.support}`,
      'Use generous tracking for calm emphasis.',
    ],
    detail: [
      `Display recommendations: ${fonts.display} at 48/54 with -2 tracking.`,
      `Body recommendations: ${fonts.support} at 18/28 for product surfaces.`,
      'Use airy spacing and optical adjustments for hero headlines.',
    ],
  });

  if (toggles.includeLogos) {
    results.push({
      title: 'Logo Concepts',
      summary: 'Ideas for extending the mark without diluting recognition.',
      items: [logo, 'Explore responsive marks for compact surfaces.'],
      detail: [
        `Primary concept: ${logo}.`,
        'Consider motion expressions that reveal the mark through a soft gradient wipe.',
        'Develop monochrome and glass variants for light/dark backdrops.',
      ],
    });
  }

  if (toggles.includeAssets) {
    results.push({
      title: 'Signature Assets',
      summary: 'Hero visuals and motion cues to reinforce memory.',
      items: [texture, 'Editorial photography with misty lighting.'],
      detail: [
        `Texture direction: ${texture}.`,
        'Use macro typography paired with diffused imagery for launch moments.',
        'Layer gentle parallax to create depth without noise.',
      ],
    });
  }

  if (toggles.includeVoice) {
    results.push({
      title: 'Voice & Messaging',
      summary: 'Language frameworks to keep every surface coherent.',
      items: [voice, snippet, `Tagline: “${tagline}”`],
      detail: [
        `Voice: ${voice}`,
        `Tone shifts: ${tone} with moments of precise energy.`,
        `Key snippet: ${snippet}`,
      ],
    });
  }

  return results;
}

function renderResultCard({ title, summary, items, detail }) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector('.card-title').textContent = title;
  card.querySelector('.card-summary').textContent = summary;
  const list = card.querySelector('.card-list');
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }

  card.dataset.detail = JSON.stringify(detail);
  return card;
}

function updateResults(results) {
  resultsGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  results.forEach((result) => {
    fragment.appendChild(renderResultCard(result));
  });
  resultsGrid.appendChild(fragment);
  statusEl.textContent = 'Generation complete';
}

function handleRegenerate(card) {
  const detail = JSON.parse(card.dataset.detail || '[]');
  const summary = card.querySelector('.card-summary');
  const list = card.querySelector('.card-list');
  if (detail.length === 0) {
    summary.textContent = 'Refined details ready.';
    return;
  }
  summary.textContent = detail[0];
  list.innerHTML = '';
  detail.slice(1).forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  });
}

function handleExpand(card) {
  const detail = JSON.parse(card.dataset.detail || '[]');
  if (!Array.isArray(detail) || detail.length === 0) {
    return;
  }

  modalBody.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = card.querySelector('.card-title').textContent;
  const intro = document.createElement('p');
  intro.textContent = detail[0];
  const list = document.createElement('ul');
  list.classList.add('modal-list');
  detail.slice(1).forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  });

  modalBody.appendChild(title);
  modalBody.appendChild(intro);
  modalBody.appendChild(list);
  modal.showModal();
}

resultsGrid.addEventListener('click', (event) => {
  const action = event.target.closest('.card-action');
  if (!action) return;
  const card = action.closest('.result-card');
  if (!card) return;

  const actionType = action.dataset.action;
  if (actionType === 'regenerate') {
    handleRegenerate(card);
  }
  if (actionType === 'expand') {
    handleExpand(card);
  }
});

modalClose.addEventListener('click', () => {
  modal.close();
});

modal.addEventListener('cancel', (event) => {
  event.preventDefault();
  modal.close();
});

function setTrack(index) {
  currentTrack = (index + tracks.length) % tracks.length;
  const track = tracks[currentTrack];
  trackTitle.textContent = track.title;
  audioEl.src = track.src;
  audioEl.dataset.attribution = track.attribution;
}

function play() {
  audioEl.play().then(() => {
    isPlaying = true;
    playToggle.innerHTML = '&#10074;&#10074;';
  }).catch(() => {
    isPlaying = false;
    playToggle.innerHTML = '&#9658;';
  });
}

function pause() {
  audioEl.pause();
  isPlaying = false;
  playToggle.innerHTML = '&#9658;';
}

playToggle.addEventListener('click', () => {
  if (!audioEl.src) {
    setTrack(currentTrack);
  }
  if (isPlaying) {
    pause();
  } else {
    play();
  }
});

prevBtn.addEventListener('click', () => {
  setTrack(currentTrack - 1);
  if (isPlaying) play();
});

nextBtn.addEventListener('click', () => {
  setTrack(currentTrack + 1);
  if (isPlaying) play();
});

audioEl.addEventListener('ended', () => {
  setTrack(currentTrack + 1);
  play();
});

setTrack(currentTrack);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  statusEl.textContent = 'Generating…';
  const formData = new FormData(form);
  const toggles = {
    includeLogos: formData.get('include-logos') !== null,
    includeAssets: formData.get('include-assets') !== null,
    includeVoice: formData.get('include-voice') !== null,
  };

  const results = generateBrandSystem(url, toggles);
  updateResults(results);
});

const form = document.getElementById('analyze-form');
const urlInput = document.getElementById('url-input');
const includeAssetsInput = document.getElementById('include-assets');
const includeVoiceInput = document.getElementById('include-voice');
const statusEl = document.getElementById('status');
const analysisSection = document.getElementById('analysis');
const analysisSubtitle = document.getElementById('analysis-subtitle');
const analysisContent = document.getElementById('analysis-content');
const toolkitError = document.getElementById('toolkit-error');
const spotifyRedirectInput = document.getElementById('spotify-redirect');
const spotifyUseCurrentButton = document.getElementById('spotify-use-current');
const spotifyStatus = document.getElementById('spotify-status');
const floatingPlayer = document.getElementById('floating-player');
const playerCollapseButton = document.getElementById('player-collapse');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerMood = document.getElementById('player-mood');
const playerProgress = document.getElementById('player-progress');
const playerQueue = document.getElementById('player-queue');
const playerControls = document.querySelectorAll('.floating-player__controls [data-player-action]');
const playerToggleButton = document.querySelector('[data-player-action="toggle"]');

const SPOTIFY_SETTINGS_KEY = 'brand-vision-spotify-settings';

const SOUNDTRACK_POOL = [
  {
    id: 'signal-bloom',
    title: 'Signal Bloom',
    artist: 'Aerial Forms',
    mood: 'Glasswave electronica',
    previewUrl:
      'https://cdn.pixabay.com/download/audio/2022/11/09/audio_7eae4f1cd7.mp3?filename=technology-ambient-124947.mp3',
  },
  {
    id: 'halo-lines',
    title: 'Halo Lines',
    artist: 'Chromatic Field',
    mood: 'Dreamy future bass',
    previewUrl:
      'https://cdn.pixabay.com/download/audio/2022/11/24/audio_f174a23a3c.mp3?filename=luxury-future-bass-126369.mp3',
  },
  {
    id: 'lumen-drift',
    title: 'Lumen Drift',
    artist: 'Polar Echoes',
    mood: 'Ethereal ambient',
    previewUrl:
      'https://cdn.pixabay.com/download/audio/2022/03/15/audio_0c3121d9a4.mp3?filename=ethereal-ambient-111464.mp3',
  },
  {
    id: 'midnight-parallax',
    title: 'Midnight Parallax',
    artist: 'Signal Division',
    mood: 'Lux downtempo',
    previewUrl:
      'https://cdn.pixabay.com/download/audio/2021/10/25/audio_53bb97c4b2.mp3?filename=slow-travel-ambient-11029.mp3',
  },
  {
    id: 'crestline',
    title: 'Crestline',
    artist: 'North Star',
    mood: 'Uplifting minimalism',
    previewUrl:
      'https://cdn.pixabay.com/download/audio/2022/02/17/audio_5bf86de1ca.mp3?filename=future-ambient-112191.mp3',
  },
  {
    id: 'afterglow',
    title: 'Afterglow Systems',
    artist: 'Analog Atlas',
    mood: 'Deep ambient pulse',
    previewUrl:
      'https://cdn.pixabay.com/download/audio/2022/03/16/audio_481508a403.mp3?filename=deep-ambient-112158.mp3',
  },
];

const state = {
  currentAnalysis: null,
};

const playerState = {
  audio: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  collapsed: false,
  brandLabel: '',
};

initializeFloatingPlayer();
initializeSpotifyIntegration();
initializeFloatingPlayer();
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
    setStatus('Brand system ready. Explore and refine the results.', 'success');
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
    state.currentAnalysis.logoDirections = generateLogos(
      state.currentAnalysis.context.logoHints,
      createSeededRng(Date.now()),
    );
    renderAnalysis(state.currentAnalysis);
  }
});

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
  const soundtrack = generateSoundtrack(context, rng);

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
    soundtrack,
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

function generateSoundtrack(context, rng) {
  const accent = capitalize((context.keywords && context.keywords[0]) || context.siteName || context.domain);
  const selection = shuffle([...SOUNDTRACK_POOL], rng)
    .slice(0, 4)
    .map((track, index) => ({
      ...track,
      id: `${track.id}-${index}`,
      mood: `${track.mood} · ${accent}`,
    }));

  return selection;
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

  if (!analysis.soundtrack || !analysis.soundtrack.length) {
    const seed = hashString(`${context.domain}-${context.siteName}-soundtrack`);
    analysis.soundtrack = generateSoundtrack(context, createSeededRng(seed));
  }

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
  cards.push(createSoundtrackCard(analysis.soundtrack));

  analysisContent.innerHTML = cards.filter(Boolean).join('');

  if (context.fetchWarning) {
    analysisSubtitle.textContent = 'Results generated with contextual AI heuristics due to limited site access.';
  } else {
    analysisSubtitle.textContent = 'Results generated with contextual AI heuristics.';
  }

  updateFloatingPlayer(analysis.soundtrack, analysis.siteName);
}

function createActionButtons(sectionId, actions) {
  if (!actions || !actions.length) return '';

  const labels = {
    expand: 'Expand',
    regenerate: 'Regenerate',
  };

  const buttons = actions
    .map((action) => `<button type="button" data-action="${action}" data-section="${sectionId}">${escapeHtml(labels[action] || action)}</button>`)
    .join('');

  return `<div class="result-card__actions">${buttons}</div>`;
}

function createTextCard(section, name, domain) {
  if (!section) return '';
  const subtitle = name && domain && section.id === 'overview'
    ? `<p class="result-card__meta">${escapeHtml(name)} · ${escapeHtml(domain)}</p>`
    : '';
  const actions = createActionButtons(section.id, section.actions || ['expand', 'regenerate']);

  return `
    <article class="result-card" data-section="${section.id}">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">${escapeHtml(section.label)}</h3>
          ${subtitle}
        </div>
        ${actions}
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
  const actions = createActionButtons('voice', ['regenerate']);
  return `
    <article class="result-card" data-section="voice">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Voice Pillars</h3>
        </div>
        ${actions}
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
  const actions = createActionButtons('palette', ['regenerate']);
  return `
    <article class="result-card" data-section="palette">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Color System</h3>
        </div>
        ${actions}
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
  const actions = createActionButtons('fonts', ['regenerate']);
  return `
    <article class="result-card" data-section="fonts">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Typography</h3>
        </div>
        ${actions}
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
  const actions = createActionButtons('logos', ['regenerate']);
  return `
    <article class="result-card" data-section="logos">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Logo Directions</h3>
        </div>
        ${actions}
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
  const actions = createActionButtons('assets', ['regenerate']);
  return `
    <article class="result-card" data-section="assets">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Asset Concepts</h3>
        </div>
        ${actions}
      </div>
      <ul class="asset-list">${rows}</ul>
    </article>
  `;
}

function createSoundtrackCard(tracks) {
  if (!tracks || !tracks.length) return '';
  const items = tracks
    .map(
      (track, index) => `
        <li>
          <div>
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.artist)}</span>
          </div>
          <span>${escapeHtml(track.mood)}</span>
          <span class="result-card__meta">Track ${index + 1}</span>
        </li>
      `,
    )
    .join('');

  return `
    <article class="result-card" data-section="soundtrack">
      <div class="result-card__header">
        <div>
          <h3 class="result-card__title">Soundtrack Suite</h3>
          <p class="result-card__meta">Tap a track in the floating player to play a preview.</p>
        </div>
      </div>
      <ul class="soundtrack-list">${items}</ul>
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

function initializeFloatingPlayer() {
  if (!floatingPlayer) return;

  playerState.audio = new Audio();
  playerState.audio.crossOrigin = 'anonymous';
  playerState.audio.preload = 'none';

  playerState.audio.addEventListener('timeupdate', syncPlayerProgress);
  playerState.audio.addEventListener('ended', () => playNextTrack(true));
  playerState.audio.addEventListener('play', () => {
    playerState.isPlaying = true;
    updatePlayerToggle();
    renderPlayerQueue();
  });
  playerState.audio.addEventListener('pause', () => {
    playerState.isPlaying = false;
    updatePlayerToggle();
    renderPlayerQueue();
  });

  if (playerCollapseButton) {
    playerCollapseButton.addEventListener('click', () => {
      setPlayerCollapsed(!playerState.collapsed);
    });
  }

  if (playerControls && playerControls.length) {
    playerControls.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.playerAction;
        if (action === 'prev') {
          playPreviousTrack();
        } else if (action === 'next') {
          playNextTrack();
        } else if (action === 'toggle') {
          togglePlayback();
        }
      });
    });
  }

  if (playerQueue) {
    playerQueue.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-track-index]');
      if (!button) return;
      const index = Number.parseInt(button.dataset.trackIndex, 10);
      if (Number.isNaN(index)) return;
      loadTrack(index, { autoplay: true });
    });
  }

  updateFloatingPlayer(SOUNDTRACK_POOL, 'Your Playlists');
  updatePlayerToggle();
}

function updateFloatingPlayer(tracks, siteName) {
  if (!floatingPlayer) return;

  if (!tracks || !tracks.length) {
    floatingPlayer.hidden = true;
    if (playerState.audio) {
      playerState.audio.pause();
      playerState.audio.removeAttribute('src');
    }
    playerState.queue = [];
    if (playerProgress) {
      playerProgress.value = 0;
    }
    return;
  }

  floatingPlayer.hidden = false;
  setPlayerCollapsed(false);
  playerState.queue = tracks;
  playerState.currentIndex = 0;
  playerState.isPlaying = false;
  playerState.brandLabel = siteName || '';
  if (playerState.audio) {
    playerState.audio.pause();
    playerState.audio.removeAttribute('src');
  }
  if (playerProgress) {
    playerProgress.value = 0;
  }
  updatePlayerMeta(tracks[0], siteName);
  renderPlayerQueue();
  updatePlayerToggle();
}

function loadTrack(index, options = {}) {
  if (!playerState.queue[index]) return;
  playerState.currentIndex = index;
  const track = playerState.queue[index];
  updatePlayerMeta(track);
  if (playerState.audio) {
    playerState.audio.src = track.previewUrl;
    playerState.audio.currentTime = 0;
  }
  if (playerProgress) {
    playerProgress.value = 0;
  }
  renderPlayerQueue();

  if (options.autoplay && playerState.audio) {
    playerState.audio
      .play()
      .catch((error) => {
        console.warn('Playback failed', error);
      });
  }
}

function updatePlayerMeta(track, siteName) {
  if (playerTitle) {
    playerTitle.textContent = track.title || 'Untitled track';
  }
  if (playerArtist) {
    const parts = [];
    if (track.artist) parts.push(track.artist);
    const label = siteName || playerState.brandLabel;
    if (label) parts.push(label);
    playerArtist.textContent = parts.join(' · ') || 'Brand Vision Studio';
  }
  if (playerMood) {
    playerMood.textContent = track.mood || '';
    playerMood.hidden = !track.mood;
  }
}

function renderPlayerQueue() {
  if (!playerQueue) return;
  if (!playerState.queue.length) {
    playerQueue.innerHTML = '';
    return;
  }

  const markup = playerState.queue
    .map((track, index) => {
      const isCurrent = index === playerState.currentIndex;
      const isPlaying = isCurrent && playerState.isPlaying;
      return `
        <li>
          <button type="button" data-track-index="${index}" data-current="${isCurrent}" data-playing="${isPlaying}">
            <span>${escapeHtml(track.title)}</span>
            <span>${escapeHtml(track.artist)}</span>
            <span>${escapeHtml(track.mood)}</span>
          </button>
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

  playerQueue.innerHTML = markup;
}

function togglePlayback() {
  if (!playerState.queue.length || !playerState.audio) return;

  if (!playerState.audio.src) {
    loadTrack(playerState.currentIndex, { autoplay: true });
    return;
  }

  if (playerState.isPlaying) {
    playerState.audio.pause();
  } else {
    playerState.audio
      .play()
      .catch((error) => {
        console.warn('Playback failed', error);
      });
  }
}

function playNextTrack(autoAdvance = true) {
  if (!playerState.queue.length) return;
  const nextIndex = (playerState.currentIndex + 1) % playerState.queue.length;
  loadTrack(nextIndex, { autoplay: autoAdvance });
}

function playPreviousTrack() {
  if (!playerState.queue.length) return;
  const previousIndex = (playerState.currentIndex - 1 + playerState.queue.length) % playerState.queue.length;
  loadTrack(previousIndex, { autoplay: true });
}

function syncPlayerProgress() {
  if (!playerProgress || !playerState.audio) return;
  if (!Number.isFinite(playerState.audio.duration) || playerState.audio.duration <= 0) {
    playerProgress.value = 0;
    return;
  }
  playerProgress.value = playerState.audio.currentTime / playerState.audio.duration;
}

function updatePlayerToggle() {
  if (!playerToggleButton) return;
  if (playerState.isPlaying) {
    playerToggleButton.innerHTML = '&#10073;&#10073;';
    playerToggleButton.setAttribute('aria-label', 'Pause');
  } else {
    playerToggleButton.innerHTML = '&#9654;';
    playerToggleButton.setAttribute('aria-label', 'Play');
  }
}

function setPlayerCollapsed(collapsed) {
  if (!floatingPlayer || !playerCollapseButton) return;
  playerState.collapsed = collapsed;
  floatingPlayer.dataset.collapsed = collapsed ? 'true' : 'false';
  playerCollapseButton.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
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

function initializeSpotifyIntegration() {
  if (!spotifyRedirectInput || !spotifyStatus) {
    return;
  }

  const config = loadSpotifyConfig();
  if (config.redirectUri) {
    spotifyRedirectInput.value = config.redirectUri;
  }

  updateSpotifyStatus(spotifyRedirectInput.value.trim());

  spotifyRedirectInput.addEventListener('input', () => {
    const value = spotifyRedirectInput.value.trim();
    const isValid = updateSpotifyStatus(value);

    if (isValid || !value) {
      persistSpotifyConfig({ redirectUri: value });
    }
  });

  if (spotifyUseCurrentButton) {
    spotifyUseCurrentButton.addEventListener('click', () => {
      const suggestion = getSuggestedSpotifyRedirect();
      spotifyRedirectInput.value = suggestion;
      updateSpotifyStatus(suggestion);
      persistSpotifyConfig({ redirectUri: suggestion });
    });
  }
}

function getSuggestedSpotifyRedirect() {
  try {
    const { origin, pathname } = window.location;
    const basePath = pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '/');
    return `${origin}${basePath}api/spotify/callback`;
  } catch (error) {
    console.warn('Unable to derive Spotify redirect suggestion', error);
    return 'https://yourdomain.com/api/spotify/callback';
  }
}

function updateSpotifyStatus(rawValue) {
  if (!spotifyStatus) return false;

  const value = rawValue.trim();
  if (!value) {
    spotifyStatus.dataset.tone = '';
    const suggestion = escapeHtml(getSuggestedSpotifyRedirect());
    spotifyStatus.innerHTML = `Spotify requires an exact redirect URI match. Start with <code>${suggestion}</code> and add it to your app settings.`;
    return false;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    spotifyStatus.dataset.tone = 'error';
    spotifyStatus.textContent = 'Enter a full URL (https://…) or use http://localhost for local development.';
    return false;
  }

  const isHttps = parsed.protocol === 'https:';
  const isLocalhost =
    parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');

  if (!isHttps && !isLocalhost) {
    spotifyStatus.dataset.tone = 'error';
    spotifyStatus.textContent = 'Spotify accepts https:// URLs in production and http://localhost while testing.';
    return false;
  }

  if (parsed.hash) {
    spotifyStatus.dataset.tone = 'error';
    spotifyStatus.textContent = 'Remove the hash fragment from the redirect URI before saving it.';
    return false;
  }

  spotifyStatus.dataset.tone = 'success';
  spotifyStatus.textContent = 'Looks good. Register this exact value in your Spotify application dashboard.';
  return true;
}

function loadSpotifyConfig() {
  try {
    const raw = localStorage.getItem(SPOTIFY_SETTINGS_KEY);
    if (!raw) return { redirectUri: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { redirectUri: '' };
    }
    return { redirectUri: typeof parsed.redirectUri === 'string' ? parsed.redirectUri : '' };
  } catch (error) {
    console.warn('Unable to parse Spotify settings', error);
    return { redirectUri: '' };
  }
}

function persistSpotifyConfig(config) {
  try {
    if (!config.redirectUri) {
      localStorage.removeItem(SPOTIFY_SETTINGS_KEY);
      return;
    }
    localStorage.setItem(SPOTIFY_SETTINGS_KEY, JSON.stringify({ redirectUri: config.redirectUri }));
  } catch (error) {
    console.warn('Unable to persist Spotify settings', error);
  }
  libraryList.innerHTML = rows;
(function startApp() {
  const notice = document.getElementById('pdf-lib-error');

  const initialize = () => {
    const form = document.getElementById('rebrand-form');
    const pdfInput = document.getElementById('pdf-input');
    const newNameInput =
      document.getElementById('new-name') ||
      document.querySelector('input[name="new-name"], input[data-role="new-name"], input[type="text"]');
    const logoInput = document.getElementById('logo-input');
    const statusPanel = document.getElementById('status');
    const downloadArea = document.getElementById('download-area');
    const downloadLink = document.getElementById('download-link');
    const detectedBrand = document.getElementById('detected-brand');
    const detectedBrandValue = document.getElementById('detected-brand-value');
    const manualBrandGroup = document.getElementById('manual-brand');
    const manualBrandInput = document.getElementById('manual-brand-input');
    const manualBrandHint = manualBrandGroup ? manualBrandGroup.querySelector('.form__hint') : null;

    if (!newNameInput) {
      throw new Error('Missing the “New Company Name” field in the interface.');
    }

    let cachedPdfBuffer = null;
    let cachedPdfSignature = null;
    let cachedDetectedName = null;
    let detectionRequestId = 0;

    hideManualBrandInput();
    setDetectionState('idle', 'Select a PDF to begin.');

    pdfInput.addEventListener('change', () => {
      detectionRequestId += 1;
      const currentRequest = detectionRequestId;

      cachedPdfBuffer = null;
      cachedPdfSignature = null;
      cachedDetectedName = null;
      hideManualBrandInput();

      if (!pdfInput.files.length) {
        setDetectionState('idle', 'Select a PDF to begin.');
        return;
      }

      const file = pdfInput.files[0];
      const signature = getFileSignature(file);
      setDetectionState('loading', 'Detecting company name…');

      readFileAsArrayBuffer(file)
        .then(async (buffer) => {
          if (currentRequest !== detectionRequestId) {
            return;
          }

          cachedPdfBuffer = buffer;
          cachedPdfSignature = signature;

          const pdfDoc = await PDFLib.PDFDocument.load(new Uint8Array(buffer), { ignoreEncryption: true });
          const detectedName = detectCompanyName({ pdfDoc });

          if (currentRequest !== detectionRequestId) {
            return;
          }

          cachedDetectedName = detectedName || null;
          if (detectedName) {
            hideManualBrandInput();
            setDetectionState('success', detectedName);
          } else {
            setDetectionState('error', 'We couldn’t identify a consistent company name in this PDF. Enter it below.');
            showManualBrandInput('We couldn’t detect the original brand. Enter it below to continue.');
          }
        })
        .catch((error) => {
          console.error(error);
          if (currentRequest !== detectionRequestId) {
            return;
          }
          cachedPdfBuffer = null;
          cachedPdfSignature = null;
          cachedDetectedName = null;
          setDetectionState('error', 'We couldn’t analyse this PDF. Try another file.');
        });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!pdfInput.files.length || !logoInput.files.length) {
        return;
      }

      const file = pdfInput.files[0];
      const signature = getFileSignature(file);

      const messages = [];
      const updateStatus = () => renderStatus(messages);
      const reset = () => {
        statusPanel.classList.remove('status--visible');
        statusPanel.innerHTML = '';
        downloadArea.hidden = true;
        if (downloadLink.href) {
          URL.revokeObjectURL(downloadLink.href);
          downloadLink.removeAttribute('href');
        }
      };

      reset();

      try {
        const newName = newNameInput.value.trim();

        if (!newName) {
          throw new Error('The new company name is required.');
        }

        messages.push('Reading PDF document…');
        updateStatus();
        const pdfBuffer = cachedPdfSignature === signature && cachedPdfBuffer
          ? cachedPdfBuffer
          : await readFileAsArrayBuffer(file);

        if (cachedPdfSignature !== signature) {
          cachedPdfSignature = signature;
          cachedPdfBuffer = pdfBuffer;
          cachedDetectedName = null;
        }

        const pdfDoc = await PDFLib.PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });

        messages.push('Detecting current company name…');
        updateStatus();

        let currentName = cachedDetectedName;
        if (!currentName && manualBrandInput) {
          const manualValue = manualBrandInput.value.trim();
          if (manualValue) {
            currentName = manualValue;
            cachedDetectedName = manualValue;
          }
        }

        if (!currentName) {
          currentName = detectCompanyName({ pdfDoc });
          cachedDetectedName = currentName || null;
        }

        if (!currentName) {
          setDetectionState('error', 'We couldn’t identify a consistent company name in this PDF. Enter it below.');
          showManualBrandInput('Enter the original company name so we can update it throughout the document.');
          throw new Error('Unable to detect the existing company name. Enter it manually when prompted.');
        }

        setDetectionState('success', currentName);
        hideManualBrandInput();
        messages.push(`Detected existing company name: "${currentName}".`);
        updateStatus();

        messages.push(`Replacing company name "${currentName}" with "${newName}"…`);
        updateStatus();

        messages.push('Preparing logo replacement…');
        updateStatus();
        const logoBuffer = await readFileAsArrayBuffer(logoInput.files[0]);

        const {
          pdfBytes: updatedPdfBytes,
          replacements,
          imageReplaced
        } = await rebrandPdf({
          pdfDoc,
          logoBuffer,
          currentName,
          newName,
          logoMimeType: logoInput.files[0].type
        });

        messages.push(replacements
          ? `Updated ${replacements} occurrence${replacements === 1 ? '' : 's'} of the company name.`
          : 'No occurrences of the current company name were found in the document.');
        updateStatus();

        messages.push(imageReplaced ? 'Replaced the first detected logo image in the PDF.' : 'No embedded images were replaced.');
        updateStatus();

        const blob = new Blob([updatedPdfBytes], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);

        downloadLink.href = objectUrl;
        downloadLink.download = buildDownloadName(pdfInput.files[0].name, newName);
        downloadArea.hidden = false;
        messages.push('Rebranding complete. Download your updated PDF below.');
        updateStatus();
      } catch (error) {
        console.error(error);
        messages.push(`Error: ${error.message}`);
        updateStatus();
      }
    });

    function showManualBrandInput(message) {
      if (!manualBrandGroup || !manualBrandInput) {
        return;
      }
      manualBrandGroup.hidden = false;
      manualBrandInput.required = true;
      if (message && manualBrandHint) {
        manualBrandHint.textContent = message;
      } else if (manualBrandHint) {
        manualBrandHint.textContent = 'We couldn’t detect the original brand. Provide it manually to continue.';
      }
      const focusField = () => manualBrandInput.focus();
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(focusField);
      } else {
        setTimeout(focusField, 0);
      }
    }

    function hideManualBrandInput() {
      if (!manualBrandGroup || !manualBrandInput) {
        return;
      }
      manualBrandGroup.hidden = true;
      manualBrandInput.required = false;
      manualBrandInput.value = '';
      if (manualBrandHint) {
        manualBrandHint.textContent = 'We couldn’t detect the original brand. Provide it manually to continue.';
      }
    }

    function setDetectionState(state, message) {
      if (!detectedBrand || !detectedBrandValue) {
        return;
      }
      detectedBrand.dataset.state = state;
      detectedBrandValue.textContent = message;
    }

    function getFileSignature(file) {
      return `${file.name}::${file.size}::${file.lastModified}`;
    }

    function renderStatus(messages) {
      statusPanel.classList.add('status--visible');
      statusPanel.innerHTML = '';
      const list = document.createElement('ul');
      list.className = 'status__log';
      messages.forEach((message) => {
        const item = document.createElement('li');
        item.textContent = message;
        list.appendChild(item);
      });
      statusPanel.appendChild(list);
    }

    function readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read the selected file.'));
        reader.readAsArrayBuffer(file);
      });
    }

    function buildDownloadName(originalName, brandName) {
      const base = originalName.replace(/\.pdf$/i, '');
      const sanitizedBrand = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return `${base}-${sanitizedBrand || 'rebranded'}.pdf`;
    }
  };

  const handleFailure = (error) => {
    console.error(error);
    if (notice) {
      notice.hidden = false;
    }
    const submitButton = document.querySelector('.form__submit');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Unavailable';
    }
  };

  if (window.pdfLibReady && typeof window.pdfLibReady.then === 'function') {
    window.pdfLibReady.then(initialize).catch(handleFailure);
  } else if (typeof PDFLib !== 'undefined') {
    initialize();
  } else {
    handleFailure(new Error('The PDF processing tools failed to load. Please refresh the page and try again.'));
  }
}());

async function rebrandPdf({ pdfDoc, logoBuffer, currentName, newName, logoMimeType }) {
const form = document.getElementById('rebrand-form');
const pdfInput = document.getElementById('pdf-input');
const currentNameInput = document.getElementById('current-name');
const newNameInput = document.getElementById('new-name');
const logoInput = document.getElementById('logo-input');
const statusPanel = document.getElementById('status');
const downloadArea = document.getElementById('download-area');
const downloadLink = document.getElementById('download-link');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!pdfInput.files.length || !logoInput.files.length) {
    return;
  }

  const messages = [];
  const updateStatus = () => renderStatus(messages);
  const reset = () => {
    statusPanel.classList.remove('status--visible');
    statusPanel.innerHTML = '';
    downloadArea.hidden = true;
    if (downloadLink.href) {
      URL.revokeObjectURL(downloadLink.href);
      downloadLink.removeAttribute('href');
    }
  };

  reset();

  try {
    const oldName = currentNameInput.value.trim();
    const newName = newNameInput.value.trim();

    if (!oldName || !newName) {
      throw new Error('Both the current and new company names are required.');
    }

    messages.push('Reading PDF document…');
    updateStatus();
    const pdfBuffer = await readFileAsArrayBuffer(pdfInput.files[0]);

    messages.push(`Replacing company name "${oldName}" with "${newName}"…`);
    updateStatus();

    messages.push('Preparing logo replacement…');
    updateStatus();
    const logoBuffer = await readFileAsArrayBuffer(logoInput.files[0]);

    const {
      pdfBytes,
      replacements,
      imageReplaced
    } = await rebrandPdf({
      pdfBuffer,
      logoBuffer,
      currentName: oldName,
      newName,
      logoMimeType: logoInput.files[0].type
    });

    messages.push(replacements
      ? `Updated ${replacements} occurrence${replacements === 1 ? '' : 's'} of the company name.`
      : 'No occurrences of the current company name were found in the document.');
    updateStatus();

    messages.push(imageReplaced ? 'Replaced the first detected logo image in the PDF.' : 'No embedded images were replaced.');
    updateStatus();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    downloadLink.href = objectUrl;
    downloadLink.download = buildDownloadName(pdfInput.files[0].name, newName);
    downloadArea.hidden = false;
    messages.push('Rebranding complete. Download your updated PDF below.');
    updateStatus();
  } catch (error) {
    console.error(error);
    messages.push(`Error: ${error.message}`);
    updateStatus();
  }
});

function renderStatus(messages) {
  statusPanel.classList.add('status--visible');
  statusPanel.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'status__log';
  messages.forEach((message) => {
    const item = document.createElement('li');
    item.textContent = message;
    list.appendChild(item);
  });
  statusPanel.appendChild(list);
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsArrayBuffer(file);
  });
}

function buildDownloadName(originalName, brandName) {
  const base = originalName.replace(/\.pdf$/i, '');
  const sanitizedBrand = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${base}-${sanitizedBrand || 'rebranded'}.pdf`;
}

async function rebrandPdf({ pdfBuffer, logoBuffer, currentName, newName, logoMimeType }) {
  if (typeof PDFLib === 'undefined') {
    throw new Error('The PDF processing tools failed to load. Please refresh the page and try again.');
  }

  const logoBytes = new Uint8Array(logoBuffer);
  const pdfBytes = new Uint8Array(pdfBuffer);
  const logoBytes = new Uint8Array(logoBuffer);
  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const replacements = replaceContentStreams({ pdfDoc, currentName, newName });
  const imageReplaced = await replaceFirstImageStream({ pdfDoc, logoBytes, logoMimeType });
  const updatedPdfBytes = await pdfDoc.save();

  return {
    pdfBytes: updatedPdfBytes,
    replacements,
    imageReplaced
  };
}

function detectCompanyName({ pdfDoc }) {
  const decoder = new TextDecoder('utf-8');
  const candidatePattern = /([A-Za-z][A-Za-z0-9&'.-]*(?:\s+[A-Za-z][A-Za-z0-9&'.-]*){0,3})/g;
  const stopWords = new Set(['the', 'and', 'with', 'from', 'project', 'section', 'page', 'document', 'company', 'client', 'sheet']);
  const candidates = new Map();

  for (const [, object] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFLib.PDFStream)) {
      continue;
    }

    const subtype = object.dict.get(PDFLib.PDFName.of('Subtype'));
    if (subtype && subtype.toString() === '/Image') {
      continue;
    }

    let decoded;
    try {
      decoded = object.decode();
    } catch (error) {
      continue;
    }

    let text;
    try {
      text = decoder.decode(decoded);
    } catch (error) {
      continue;
    }

    const searchable = text
      .replace(/[\u0000-\u001F]+/g, ' ')
      .replace(/\s{2,}/g, ' ');

    let match;
    while ((match = candidatePattern.exec(searchable)) !== null) {
      const candidate = match[1].trim();
      if (!isValidCandidate(candidate, stopWords)) {
        continue;
      }

      const normalizedCandidate = candidate.replace(/\s+/g, ' ');
      const key = normalizedCandidate.toLowerCase();
      const weight = computeCandidateWeight(normalizedCandidate);

      if (candidates.has(key)) {
        const entry = candidates.get(key);
        entry.count += 1;
        entry.weight = Math.max(entry.weight, weight);
        if (normalizedCandidate.length > entry.text.length) {
          entry.text = normalizedCandidate;
        }
      } else {
        candidates.set(key, {
          text: normalizedCandidate,
          count: 1,
          weight
        });
      }
    }

    candidatePattern.lastIndex = 0;
  }

  const ranked = Array.from(candidates.values())
    .map((entry) => ({
      ...entry,
      score: entry.count * 12 + entry.weight
    }))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return null;
  }

  const repeated = ranked.find((entry) => entry.count > 1);
  return (repeated || ranked[0]).text;
}

function isValidCandidate(value, stopWords) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 3 || cleaned.length > 60) {
    return false;
  }
  if (!/[A-Za-z]/.test(cleaned)) {
    return false;
  }
  if (!/[A-Z]/.test(cleaned)) {
    return false;
  }
  if (/^[A-Za-z]{1,3}$/.test(cleaned)) {
    return false;
  }

  const lower = cleaned.toLowerCase();
  if (stopWords.has(lower)) {
    return false;
  }

  const words = cleaned.split(/\s+/);
  if (words.length === 1 && cleaned.length < 6 && !/[-&]/.test(cleaned)) {
    return false;
  }

  return true;
}

function computeCandidateWeight(value) {
  const words = value.split(/\s+/);
  const uppercaseWords = words.filter((word) => /^[A-Z0-9&'.-]+$/.test(word));
  const capitalizedWords = words.filter((word) => /^[A-Z]/.test(word));
  const characterScore = Math.min(40, value.replace(/\s+/g, '').length);
  return uppercaseWords.length * 12 + capitalizedWords.length * 6 + characterScore + words.length * 4;
}

function replaceContentStreams({ pdfDoc, currentName, newName }) {
  const escaped = escapeRegExp(currentName);
  const searchPattern = new RegExp(escaped, 'g');
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  let totalReplacements = 0;

  for (const [ref, object] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFLib.PDFStream)) {
      continue;
    }

    const subtype = object.dict.get(PDFLib.PDFName.of('Subtype'));
    if (subtype && subtype.toString() === '/Image') {
      continue;
    }

    let decoded;
    try {
      decoded = object.decode();
    } catch (error) {
      continue;
    }

    let text;
    try {
      text = decoder.decode(decoded);
    } catch (error) {
      continue;
    }

    const matches = text.match(searchPattern);
    if (!matches) {
      searchPattern.lastIndex = 0;
      continue;
    }

    totalReplacements += matches.length;
    const updatedText = text.replace(searchPattern, newName);
    searchPattern.lastIndex = 0;
    const encoded = encoder.encode(updatedText);
    const stream = createRawStream({ context: pdfDoc.context, template: object, contents: encoded, removeFilters: true });
    pdfDoc.context.assign(ref, stream);
  }

  return totalReplacements;
}

async function replaceFirstImageStream({ pdfDoc, logoBytes, logoMimeType }) {
  const embeddedLogo = await embedLogo({ pdfDoc, logoBytes, logoMimeType });
  if (!embeddedLogo) {
    return false;
  }

  const { stream: logoStream, ref: logoRef } = embeddedLogo;
  const logoContents = extractStreamContents(logoStream);
  const logoTemplate = createRawStream({ context: pdfDoc.context, template: logoStream, contents: logoContents });
  let replaced = false;

  for (const [ref, object] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFLib.PDFStream)) {
      continue;
    }

    const subtype = object.dict.get(PDFLib.PDFName.of('Subtype'));
    if (subtype && subtype.toString() === '/Image') {
      pdfDoc.context.assign(ref, logoTemplate);
      replaced = true;
      break;
    }
  }

  pdfDoc.context.delete(logoRef);
  return replaced;
}

async function embedLogo({ pdfDoc, logoBytes, logoMimeType }) {
  try {
    const mimeType = normalizeMimeType(logoMimeType);
    let image;
    if (mimeType === 'image/png') {
      image = await pdfDoc.embedPng(logoBytes);
    } else {
      image = await pdfDoc.embedJpg(logoBytes);
    }

    const stream = pdfDoc.context.lookup(image.ref);
    if (!(stream instanceof PDFLib.PDFStream)) {
      return null;
    }

    return {
      ref: image.ref,
      stream
    };
  } catch (error) {
    console.error(error);
    throw new Error('Unable to process the uploaded logo image.');
  }
}

function normalizeMimeType(type) {
  if (type === 'image/png' || type === 'image/jpeg') {
    return type;
  }
  if (type === 'image/jpg') {
    return 'image/jpeg';
  }
  return 'image/png';
}

function createRawStream({ context, template, contents, removeFilters = false }) {
  const normalizedContents = toUint8Array(contents);
  const dict = template.dict.clone(context);
  dict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(normalizedContents.length));
  if (removeFilters) {
    dict.delete(PDFLib.PDFName.of('Filter'));
    dict.delete(PDFLib.PDFName.of('DecodeParms'));
  }
  return PDFLib.PDFRawStream.of(dict, normalizedContents);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractStreamContents(stream) {
  if (stream && typeof stream.getContents === 'function') {
    return stream.getContents();
  }
  if (stream && stream.contents) {
    return stream.contents;
  }
  return new Uint8Array();
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return new Uint8Array();
}
