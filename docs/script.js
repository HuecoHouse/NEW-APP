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
