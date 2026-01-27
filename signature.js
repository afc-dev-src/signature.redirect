// AFC-branded minimal signature app (transparent PNG + Smart Return)
// Author: Jon Renzo Policarpio (AFC SME Finance Inc.) + M365 Copilot
// Notes:
// - Transparent PNG export (no background color set).
// - "Return to Form" prioritizes: history.back() → document.referrer (cached) → ?form=/ ?return= param → Forms home.

(function () {
  // ---- Elements ----
  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const savePNG   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  // ---- Capture referrer once per session (helps if the page reloads) ----
  try {
    if (document.referrer) sessionStorage.setItem('afc_sig_referrer', document.referrer);
  } catch { /* ignore storage issues */ }

  // ---- Optional explicit return URL via query (?form= or ?return=) ----
  const params      = new URLSearchParams(location.search);
  const paramReturn = params.get('form') || params.get('return') || null;

  function getCachedReferrer() {
    try { return sessionStorage.getItem('afc_sig_referrer'); }
    catch { return null; }
  }

  // ---- Determine where to go when "Return" is pressed ----
  function getReturnTarget() {
    // 1) If user navigated here from the form in the same tab, use browser history
    if (window.history.length > 1) return '__HISTORY__';

    // 2) Use referrer if present (live or cached)
    if (document.referrer) return document.referrer;
    const cached = getCachedReferrer();
    if (cached) return cached;

    // 3) Use explicit query param (safety net)
    if (paramReturn) return paramReturn;

    // 4) Last fallback: Microsoft Forms home
    return 'https://forms.office.com/';
  }

  function doReturn() {
    const target = getReturnTarget();
    if (target === '__HISTORY__') {
      window.history.back();
      return;
    }
    // Guard to avoid navigating to non-HTTP(S) URLs
    try {
      if (/^https?:\/\//i.test(target)) {
        location.href = target;
      } else {
        location.href = 'https://forms.office.com/';
      }
    } catch {
      location.href = 'https://forms.office.com/';
    }
  }

  // ---- Signature Pad init (transparent background) ----
  const signaturePad = new SignaturePad(canvas, {
    // Do NOT set backgroundColor to keep export transparent
    penColor: '#0B1D39', // AFC dark blue
    minWidth: 0.5,
    maxWidth: 2.5
  });

  // ---- Responsive canvas with high-DPI support ----
  function resizeCanvas() {
    const data  = signaturePad.toData();                     // Preserve strokes
    const ratio = Math.max(window.devicePixelRatio || 1, 1); // HiDPI safety
    const rect  = canvas.getBoundingClientRect();

    canvas.width  = rect.width * ratio;
    canvas.height = 340 * ratio; // match CSS height
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    signaturePad.clear();
    if (data && data.length) signaturePad.fromData(data);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ---- Controls ----
  undoBtn?.addEventListener('click', () => {
    const data = signaturePad.toData();
    if (data.length) {
      data.pop(); // remove last stroke
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
    // Transparent PNG (no backgroundColor set)
    const url = signaturePad.toDataURL('image/png');
    download(url, `afc-signature-${Date.now()}.png`);

    // Optional: offer to return immediately
    setTimeout(() => {
      if (confirm('Signature saved. Do you want to return to the form now?')) {
        doReturn();
      }
    }, 300);
  });

  returnBtn?.addEventListener('click', doReturn);

  // ---- Optional: tweak Return button label if history is available ----
  try {
    if (returnBtn && window.history.length > 1) {
      returnBtn.textContent = 'Back to Previous Page';
    }
  } catch { /* ignore */ }
})();