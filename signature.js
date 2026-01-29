// signature.js — AFC SME Finance Inc. (Signature app)
// Canvas stays transparent; background color is provided by .canvas-wrap in CSS.
// IDs expected in index.html: pad, undoBtn, clearBtn, savePNG, returnBtn
// Requires Signature Pad UMD (window.SignaturePad) loaded before this script.

(function () {
  'use strict';

  const DOWNLOAD_CLOSE_DELAY_MS = 800; // adjust to 1200–1500ms if needed

  // Elements
  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const saveBtn   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  if (!canvas) { console.error('[Signature] <canvas id="pad"> not found.'); return; }
  if (!window.SignaturePad) { console.error('[Signature] SignaturePad UMD not loaded.'); return; }

  // Initialize SignaturePad — transparent PNG output; pen colored, not the background
  const pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // keep PNG transparent
    penColor: '#0B1D39',              // only the ink has color
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });

  // DPI-aware canvas: crisp lines on HiDPI displays
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    canvas.width  = Math.floor(box.width  * ratio);
    canvas.height = Math.floor(box.height * ratio);
    canvas.getContext('2d').scale(ratio, ratio);

    // Clear to avoid distortion after resize (we don't try to preserve strokes here)
    pad.clear();
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  setTimeout(resizeCanvas, 0);

  // Controls
  clearBtn?.addEventListener('click', () => pad.clear());

  undoBtn?.addEventListener('click', () => {
    const data = pad.toData();
    if (data && data.length) {
      data.pop();
      pad.fromData(data);
    }
  });

  // Save → download → attempt to close the tab (no redirect prompt)
  saveBtn?.addEventListener('click', () => {
    if (pad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    try {
      const dataURL = pad.toDataURL('image/png'); // transparent PNG
      const name = `signature-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      triggerDownload(dataURL, name);

      const toast = showToast('Signature saved. Closing this tab…');
      setTimeout(() => {
        window.close();
        setTimeout(() => toast?.remove(), 500);
      }, DOWNLOAD_CLOSE_DELAY_MS);

    } catch (e) {
      console.error('[Signature] Failed to save PNG:', e);
      alert('Could not save the PNG. See console for details.');
    }
  });

  // Return button: navigate only when clicked
  returnBtn?.addEventListener('click', () => {
    const ret = getReturnUrl();
    if (ret) window.location.href = ret;
    else alert('No return URL provided. Append ?form=https://… or ?return=https://… to the page URL.');
  });

  // Helpers
  function triggerDownload(dataURL, filename) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename || 'signature.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Supports ?form=... or ?return=...
  function getReturnUrl() {
    const p = new URLSearchParams(window.location.search);
    const val = p.get('form') || p.get('return') || '';
    return val;
  }

  // Tiny non-blocking toast (auto-removed)
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
    } catch { return null; }
  }
})();