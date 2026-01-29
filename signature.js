// signature.js — AFC SME Finance Inc.
// Works with index.html that includes:
// - <canvas id="pad">, and buttons: undoBtn, clearBtn, savePNG, returnBtn
// - Signature Pad UMD from jsDelivr (window.SignaturePad)

(function () {
  'use strict';

  // ---- Element hooks ----
  const canvas   = document.getElementById('pad');
  const undoBtn  = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const saveBtn  = document.getElementById('savePNG');
  const returnBtn= document.getElementById('returnBtn');

  if (!canvas) {
    console.error('[Signature] <canvas id="pad"> not found.');
    return;
  }
  if (!window.SignaturePad) {
    console.error('[Signature] SignaturePad library not loaded. Check CDN <script>.');
    return;
  }

  // ---- Create pad ----
  const pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // transparent
    penColor: '#0B1D39', // AFC dark blue to match your palette
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });

  // ---- High-DPI / responsive canvas sizing ----
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    // Keep CSS size (set by your CSS) but scale the bitmap for crisp lines.
    const { width, height } = canvas.getBoundingClientRect();
    // Guard: if element not laid out yet, skip
    if (width === 0 || height === 0) return;

    canvas.width  = Math.floor(width  * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    // IMPORTANT: SignaturePad needs a reset after resize to avoid distortions.
    // To preserve drawing when resizing, we’d need to save+restore; for now
    // we clear only if it was empty (no need to redraw).
    pad.clear();
  }

  // Resize on load and on orientation/resize
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  // Defer initial resize to after layout
  setTimeout(resizeCanvas, 0);

  // ---- Controls ----
  clearBtn?.addEventListener('click', () => pad.clear());

  undoBtn?.addEventListener('click', () => {
    const data = pad.toData();
    if (data && data.length) {
      data.pop(); // remove last stroke
      pad.fromData(data);
    }
  });

  saveBtn?.addEventListener('click', () => {
    if (pad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    try {
      // Transparent PNG
      const dataURL = pad.toDataURL('image/png'); // default is transparent if backgroundColor is transparent
      // Trigger download
      downloadDataURL(dataURL, makeFileName());
      // After download, optionally offer to return
      const ret = getReturnUrl();
      if (ret) {
        const go = confirm('Signature saved.\nReturn to your form now?');
        if (go) window.location.href = ret;
      }
    } catch (e) {
      console.error('[Signature] Failed to save PNG:', e);
      alert('Could not save the PNG. See console for details.');
    }
  });

  returnBtn?.addEventListener('click', () => {
    const ret = getReturnUrl();
    if (!ret) {
      alert('No return URL provided. Append ?form=https://… or ?return=https://… to the page URL.');
      return;
    }
    window.location.href = ret;
  });

  // ---- Helpers ----
  function makeFileName() {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return `signature-${ts}.png`;
  }

  function downloadDataURL(dataURL, filename) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename || 'signature.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ?form=... or ?return=...
  function getReturnUrl() {
    const p = new URLSearchParams(window.location.search);
    return p.get('form') || p.get('return') || '';
  }
})();