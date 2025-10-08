(function startApp() {
  const notice = document.getElementById('pdf-lib-error');

  const initialize = () => {
    const form = document.getElementById('rebrand-form');
    const pdfInput = document.getElementById('pdf-input');
    const newNameInput = document.getElementById('new-name');
    const logoInput = document.getElementById('logo-input');
    const statusPanel = document.getElementById('status');
    const downloadArea = document.getElementById('download-area');
    const downloadLink = document.getElementById('download-link');
    const detectedBrand = document.getElementById('detected-brand');
    const detectedBrandValue = document.getElementById('detected-brand-value');

    let cachedPdfBuffer = null;
    let cachedPdfSignature = null;
    let cachedDetectedName = null;
    let detectionRequestId = 0;

    setDetectionState('idle', 'Select a PDF to begin.');

    pdfInput.addEventListener('change', () => {
      detectionRequestId += 1;
      const currentRequest = detectionRequestId;

      cachedPdfBuffer = null;
      cachedPdfSignature = null;
      cachedDetectedName = null;

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
            setDetectionState('success', detectedName);
          } else {
            setDetectionState('error', 'We couldn’t identify a consistent company name in this PDF.');
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
        if (!currentName) {
          currentName = detectCompanyName({ pdfDoc });
          cachedDetectedName = currentName || null;
        }

        if (!currentName) {
          setDetectionState('error', 'We couldn’t identify a consistent company name in this PDF.');
          throw new Error('Unable to detect the existing company name. Make sure the brand appears consistently in the document.');
        }

        setDetectionState('success', currentName);
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
  if (typeof PDFLib === 'undefined') {
    throw new Error('The PDF processing tools failed to load. Please refresh the page and try again.');
  }

  const logoBytes = new Uint8Array(logoBuffer);

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
