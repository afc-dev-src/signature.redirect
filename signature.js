// signature.js — AFC SME Finance Inc. (Signature redirect app)
// Works with index.html that includes:
//  - <canvas id="pad"> and buttons: undoBtn, clearBtn, savePNG, returnBtn
//  - Signature Pad UMD from jsDelivr (window.SignaturePad)

(function () {
  'use strict';

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

  // Initialize the signature pad
  const pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // transparent PNG
    penColor: '#0B1D39',
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });

  // High-DPI / responsive resize (lines stay crisp)
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return; // not laid out yet

    canvas.width  = Math.floor(box.width  * ratio);
    canvas.height = Math.floor(box.height * ratio);
    canvas.getContext('2d').scale(ratio, ratio);

    // Clearing after resize avoids distortion; user hasn’t drawn yet on load.
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

  saveBtn?.addEventListener('click', () => {
    if (pad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    try {
      const dataURL = pad.toDataURL('image/png'); // transparent output
      const name = `signature-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      triggerDownload(dataURL, name);

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

  // Helpers
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
})();