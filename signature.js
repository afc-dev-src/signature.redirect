// AFC-branded minimal signature app (transparent PNG + Return to Form)
(function () {
  const canvas = document.getElementById('pad');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const savePNG = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  // Parse form return URL from query string (?form= or ?return=)
  const params = new URLSearchParams(location.search);
  const formUrl = params.get('form') || params.get('return') || 'https://forms.office.com/';

  const signaturePad = new SignaturePad(canvas, {
    // Transparent background by default (do not set backgroundColor)
    penColor: '#0B1D39', // dark blue ink by default
    minWidth: 0.5,
    maxWidth: 2.5
  });

  function resizeCanvas() {
    const data = signaturePad.toData();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = 340 * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    signaturePad.clear();
    if (data && data.length) signaturePad.fromData(data);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  undoBtn.addEventListener('click', () => {
    const data = signaturePad.toData();
    if (data.length) {
      data.pop();
      signaturePad.fromData(data);
    }
  });

  clearBtn.addEventListener('click', () => signaturePad.clear());

  function download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  savePNG.addEventListener('click', () => {
    if (signaturePad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    const url = signaturePad.toDataURL('image/png'); // transparent PNG
    download(url, `afc-signature-${Date.now()}.png`);
    // After download, guide users to return if they want
    setTimeout(() => {
      if (confirm('Signature saved. Do you want to return to the form now?')) {
        location.href = formUrl;
      }
    }, 300);
  });

  returnBtn.addEventListener('click', () => {
    location.href = formUrl;
  });
})();
