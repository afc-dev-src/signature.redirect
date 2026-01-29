// signature.js — AFC SME Finance Inc. (Signature app)
// Matches index.html IDs: pad, undoBtn, clearBtn, savePNG, returnBtn
// Requires Signature Pad UMD bundle (window.SignaturePad) to be loaded first.

(function () {
  'use strict';

  // --- Config ---
  // Delay after triggering the download before attempting window.close().
  // Increase to ~1200–1500 ms if some browsers close too quickly.
  const DOWNLOAD_CLOSE_DELAY_MS = 800;

  // --- Elements ---
  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const saveBtn   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  if (!canvas) {
    console.error('[Signature] <canvas id="pad"> not found.');
    return;
  }
  if (!window.SignaturePad) {
    console.error('[Signature] SignaturePad library not loaded. Check CDN <script>.');
    return;
  }

  // --- Initialize pad ---
  const pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // keep PNG transparent
    penColor: '#0B1D39',              // AFC dark blue
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });

  // --- DPI-aware canvas sizing ---
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    // Scale the bitmap to device pixels while keeping CSS size.
    canvas.width  = Math.floor(box.width  * ratio);
    canvas.height = Math.floor(box.height * ratio);
    canvas.getContext('2d').scale(ratio, ratio);

    // Clearing after resize avoids distortions.
    // (To preserve strokes across resize/orientation changes, you'd need to
    //  save pad.toData() and reapply pad.fromData(data) with care.)
    pad.clear();
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  // Run after layout so getBoundingClientRect() has correct values.
  setTimeout(resizeCanvas, 0);

  // --- Controls ---
  clearBtn?.addEventListener('click', () => pad.clear());

  undoBtn?.addEventListener('click', () => {
    const data = pad.toData();
    if (data && data.length) {
      data.pop();       // remove last stroke
      pad.fromData(data);
    }
  });

  // Save → download → attempt to close tab (no auto-redirect)
  saveBtn?.addEventListener('click', () => {
    if (pad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    try {
      const dataURL = pad.toDataURL('image/png'); // transparent PNG
      const name = `signature-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      triggerDownload(dataURL, name);

      // Optional mini-toast for clarity (auto-removed).
      const toast = showToast('Signature saved. Closing this tab…');

      setTimeout(() => {
        window.close();

        // If the tab wasn't script-opened, browsers block close().
        // Remove toast quietly and let the user close or use Return.
        setTimeout(() => toast?.remove(), 500);
      }, DOWNLOAD_CLOSE_DELAY_MS);

    } catch (e) {
      console.error('[Signature] Failed to save PNG:', e);
      alert('Could not save the PNG. See console for details.');
    }
  });

  // Return button → navigate only when clicked
  returnBtn?.addEventListener('click', () => {
    const ret = getReturnUrl();
    if (ret) {
      window.location.href = ret;
    } else {
      alert('No return URL provided. Append ?form=https://… or ?return=https://… to the page URL.');
    }
  });

  // (Optional) Hide Return when no URL is present
  // const ret = getReturnUrl();
  // if (returnBtn && !ret) returnBtn.style.display = 'none';

  // --- Helpers ---
  function triggerDownload(dataURL, filename) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename || 'signature.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function getReturnUrl() {
    const p = new URLSearchParams(window.location.search);
    return p.get('form') || p.get('return') || '';
  }

  function showToast(text) {
    try {
      const el = document.createElement('div');
      el.textContent = text;
      Object.assign(el.style, {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        background: 'rgba(11,29,57,.9)',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '8px',
        font: '600 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,.25)'
      });
      document.body.appendChild(el);
      return el;
    } catch {
      return null;
    }
  }
})();