// AFC-branded signature app (transparent PNG + Smart Return + styled background)
// Visuals requested:
//  - Pad (drawing area) appears WHITE (CSS-only) but export remains TRANSPARENT
//  - Page background NAVY with a RED diagonal half (slanted)
//  - Minimal controls: Undo, Clear, Save PNG (Transparent), Return to Form

(function () {
  // ---------- Inject page-wide styles (no HTML edits required) ----------
  const styleTag = document.createElement('style');
  styleTag.setAttribute('data-afc-style', 'true');
  styleTag.textContent = `
    :root {
      --afc-blue: #0B1D39;  /* navy */
      --afc-red:  #C62828;  /* red */
      --afc-text: #0B1D39;
    }

    /* Full-page navy background with diagonal half red slant */
    /* Adjust the angle/stop to taste */
    body {
      background: linear-gradient(135deg, var(--afc-blue) 0 50%, var(--afc-red) 50% 100%) !important;
      color: var(--afc-text);
      min-height: 100vh;
    }

    /* Make the "pad" surface look white without baking it into the PNG */
    /* We target the canvas by its #pad id; the white is visual only */
    #pad {
      background: #ffffff !important; /* visual white surface */
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,.12);
    }

    /* Optional: make the panel transparent so the diagonal shows through */
    /* If you have a .panel container in your HTML */
    .panel {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* Toolbar buttons contrast well on the navy/red background */
    .toolbar button {
      border-radius: 10px;
      padding: 10px 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      color: #0B1D39;
      background: #ffffff;
      transition: .15s ease;
    }
    .toolbar button:hover { filter: brightness(0.97); }
    .toolbar #savePNG {
      background: var(--afc-red);
      border-color: var(--afc-red);
      color: #fff;
    }
    .toolbar #savePNG:hover { filter: brightness(0.95); }

    /* Optional: lighten hint text if you have one */
    .hint { color: #f3f4f6 !important; }
    .brand h1 { color: #ffffff !important; }
  `;
  document.head.appendChild(styleTag);

  // ---------- Elements ----------
  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const savePNG   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  // ---------- Smart Return: history → referrer (cached) → ?form/ ?return → Forms home ----------
  try {
    if (document.referrer) sessionStorage.setItem('afc_sig_referrer', document.referrer);
  } catch { /* ignore */ }

  const params      = new URLSearchParams(location.search);
  const paramReturn = params.get('form') || params.get('return') || null;

  function cachedReferrer() {
    try { return sessionStorage.getItem('afc_sig_referrer'); }
    catch { return null; }
  }

  function getReturnTarget() {
    if (window.history.length > 1) return '__HISTORY__';
    if (document.referrer) return document.referrer;
    const cached = cachedReferrer(); if (cached) return cached;
    if (paramReturn) return paramReturn;
    return 'https://forms.office.com/';
  }

  function doReturn() {
    const target = getReturnTarget();
    if (target === '__HISTORY__') { window.history.back(); return; }
    try {
      if (/^https?:\/\//i.test(target)) location.href = target;
      else location.href = 'https://forms.office.com/';
    } catch {
      location.href = 'https://forms.office.com/';
    }
  }

  // ---------- Signature Pad init (keep export transparent) ----------
  // DO NOT set backgroundColor; this keeps the PNG background transparent.
  const signaturePad = new SignaturePad(canvas, {
    penColor: '#0B1D39',  // dark blue ink
    minWidth: 0.5,
    maxWidth: 2.5
  });

  // ---------- Responsive canvas with HiDPI support ----------
  function resizeCanvas() {
    const data  = signaturePad.toData();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect  = canvas.getBoundingClientRect();

    canvas.width  = rect.width * ratio;
    canvas.height = 340 * ratio; // match CSS height used in your page
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    signaturePad.clear();
    if (data && data.length) signaturePad.fromData(data);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ---------- Controls ----------
  undoBtn?.addEventListener('click', () => {
    const data = signaturePad.toData();
    if (data.length) {
      data.pop();
      signaturePad.fromData(data);
    }
  });

  clearBtn?.addEventListener('click', () => signaturePad.clear());

  function download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  savePNG?.addEventListener('click', () => {
    if (signaturePad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    // Transparent PNG because we didn't set signaturePad.backgroundColor
    const url = signaturePad.toDataURL('image/png');
    download(url, `afc-signature-${Date.now()}.png`);

    setTimeout(() => {
      if (confirm('Signature saved. Do you want to return to the form now?')) {
        doReturn();
      }
    }, 300);
  });

  returnBtn?.addEventListener('click', doReturn);

  // Optional: label change when history is available
  try {
    if (returnBtn && window.history.length > 1) {
      returnBtn.textContent = 'Back to Previous Page';
    }
  } catch {}
})();
