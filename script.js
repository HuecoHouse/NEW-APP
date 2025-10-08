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
    let pdfBinary = arrayBufferToBinaryString(pdfBuffer);

    messages.push(`Replacing company name "${oldName}" with "${newName}"…`);
    updateStatus();
    const { binary: renamedBinary, replacements } = replaceCompanyName(pdfBinary, oldName, newName);
    pdfBinary = renamedBinary;
    messages.push(replacements
      ? `Updated ${replacements} occurrence${replacements === 1 ? '' : 's'} of the company name.`
      : 'No occurrences of the current company name were found in the document.');
    updateStatus();

    messages.push('Preparing logo replacement…');
    updateStatus();
    const logoBuffer = await readFileAsArrayBuffer(logoInput.files[0]);
    const logoBinary = arrayBufferToBinaryString(logoBuffer);

    const { binary: withLogoBinary, replaced } = replaceFirstImage(pdfBinary, logoBinary);
    pdfBinary = withLogoBinary;

    messages.push(replaced ? 'Replaced the first detected logo image in the PDF.' : 'No embedded images were replaced.');
    updateStatus();

    const updatedBytes = binaryStringToUint8Array(pdfBinary);
    const blob = new Blob([updatedBytes], { type: 'application/pdf' });
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

function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return binary;
}

function binaryStringToUint8Array(binary) {
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function replaceCompanyName(pdfBinary, currentName, newName) {
  const escaped = escapeRegExp(currentName);
  const regex = new RegExp(escaped, 'g');
  const matches = pdfBinary.match(regex);
  const replacements = matches ? matches.length : 0;
  const binary = pdfBinary.replace(regex, newName);
  return { binary, replacements };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceFirstImage(pdfBinary, newImageBinary) {
  const marker = '/Subtype /Image';
  const imageIndex = pdfBinary.indexOf(marker);
  if (imageIndex === -1) {
    return { binary: pdfBinary, replaced: false };
  }

  const streamIndex = pdfBinary.indexOf('stream', imageIndex);
  const endstreamIndex = pdfBinary.indexOf('endstream', streamIndex);

  if (streamIndex === -1 || endstreamIndex === -1) {
    return { binary: pdfBinary, replaced: false };
  }

  const streamLineBreakIndex = pdfBinary.indexOf('\n', streamIndex);
  if (streamLineBreakIndex === -1) {
    return { binary: pdfBinary, replaced: false };
  }

  let dataStart = streamLineBreakIndex + 1;
  if (pdfBinary.charCodeAt(streamLineBreakIndex - 1) === 13) {
    // Handles CRLF sequences
    dataStart = streamLineBreakIndex + 1;
  }

  const objectStartIndex = findObjectStart(pdfBinary, imageIndex);
  if (objectStartIndex === -1) {
    return { binary: pdfBinary, replaced: false };
  }

  const header = pdfBinary.slice(objectStartIndex, dataStart);
  const lengthMatch = header.match(/\/Length\s+(\d+)/);
  if (!lengthMatch) {
    return { binary: pdfBinary, replaced: false };
  }

  const beforeObject = pdfBinary.slice(0, objectStartIndex);
  const afterStream = pdfBinary.slice(endstreamIndex);
  const newlineSequence = header.endsWith('\r\n') ? '\r\n' : '\n';
  const updatedHeader = header.replace(/\/Length\s+\d+/, `/Length ${newImageBinary.length}`);
  const updatedBinary = beforeObject + updatedHeader + newImageBinary + newlineSequence + afterStream;
  return { binary: updatedBinary, replaced: true };
}

function findObjectStart(pdfBinary, fromIndex) {
  let searchIndex = fromIndex;
  while (searchIndex > 0) {
    const objIndex = pdfBinary.lastIndexOf('obj', searchIndex);
    if (objIndex === -1) {
      return -1;
    }
    const whitespace = pdfBinary.slice(objIndex - 10, objIndex);
    if (/\d+\s+\d+\s+$/.test(whitespace)) {
      const lineStart = pdfBinary.lastIndexOf('\n', objIndex);
      return lineStart === -1 ? 0 : lineStart + 1;
    }
    searchIndex = objIndex - 3;
  }
  return -1;
}

function buildDownloadName(originalName, brandName) {
  const base = originalName.replace(/\.pdf$/i, '');
  const sanitizedBrand = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${base}-${sanitizedBrand || 'rebranded'}.pdf`;
}
