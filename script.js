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

