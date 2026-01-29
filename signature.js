// signature.js — AFC SME Finance Inc. (Signature redirect app)

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

  const pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // keep PNG transparent
    penColor: '#0B1D39',
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    canvas.width  = Math.floor(box.width  * ratio);
    canvas.height = Math.floor(box.height * ratio);
    canvas.getContext('2d').scale(ratio, ratio);

    // Clear after resize to avoid distortion before user draws.
    pad.clear();
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  setTimeout(resizeCanvas, 0);

  clearBtn?.addEventListener('click', () => pad.clear());

  undoBtn?.addEventListener('click', () => {
    const data = pad.toData();
    if (data && data.length) {
      data.pop();
      pad.fromData(data);
    }
  });

  // Save → download → close tab (no prompt/redirect)
  saveBtn?.addEventListener('click', () => {
    if (pad.isEmpty()) {
      alert('Please add a signature first.');
      return;
    }
    try {
      const dataURL = pad.toDataURL('image/png'); // transparent PNG
      const name = `signature-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      download(dataURL, name);

      // Attempt to close the tab. If blocked by the browser, show tiny hint.
      setTimeout(() => {
        window.close();
        // If still not closed after a tick, show a non-intrusive hint.
        setTimeout(() => {
          if (!document.hidden) {
            console.info('[Signature] Browser blocked window.close(); tab was not opened by script.');
            // No alert to avoid UX noise; users can close manually.
          }
        }, 250);
      }, 150);
    } catch (e) {
      console.error('[Signature] Failed to save PNG:', e);
      alert('Could not save the PNG. See console for details.');
    }
  });

  // Return button → navigate to provided URL, if any.
  returnBtn?.addEventListener('click', () => {
    const ret = getReturnUrl();
    if (ret) {
      window.location.href = ret;
    } else {
      alert('No return URL provided. Append ?form=https://… or ?return=https://… to the page URL.');
    }
  });

  // Hide the Return button if no return URL is present (optional UX nicety)
  (function toggleReturnBtnVisibility(){
    const ret = getReturnUrl();
    if (returnBtn && !ret) {
      // Keep it visible if you prefer; otherwise uncomment next line to hide.
      // returnBtn.style.display = 'none';
    }
  })();

  function download(dataURL, filename) {
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