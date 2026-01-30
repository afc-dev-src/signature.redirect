// signature.js
// Transparent export by default; visible pad and toolbar are white via CSS.
// Handles missing return URL by posting message to opener (if present) or showing an alert.

(function () {
  'use strict';

  const DOWNLOAD_CLOSE_DELAY_MS = 800;

  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const saveBtn   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  if (!canvas) { console.error('[Signature] <canvas id="pad"> not found.'); return; }
  if (!window.SignaturePad) { console.error('[Signature] SignaturePad UMD not loaded.'); return; }

  // Set backgroundColor to transparent so exported PNG is transparent.
  const pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // transparent export
    penColor: '#0B1D39',
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });

  // DPI-aware canvas sizing
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    canvas.width  = Math.floor(box.width  * ratio);
    canvas.height = Math.floor(box.height * ratio);
    canvas.getContext('2d').scale(ratio, ratio);

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
      const dataURL = pad.toDataURL('image/png'); // transparent PNG
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const name = `signature-${dateStr}.png`;
      triggerDownload(dataURL, name);

      const toast = showToast('Signature saved. Closing this tab…');
      setTimeout(() => {
        try { window.close(); } catch (e) { /* ignore */ }
        setTimeout(() => toast?.remove(), 500);
      }, DOWNLOAD_CLOSE_DELAY_MS);

    } catch (e) {
      console.error('[Signature] Failed to save PNG:', e);
      alert('Could not save the PNG. See console for details.');
    }
  });

  // Return to form: redirect if URL provided; otherwise try to postMessage to opener and close.
  returnBtn?.addEventListener('click', () => {
    const ret = getReturnUrl();
    if (ret) {
      // Navigate then attempt to close after a short delay.
      window.location.href = ret;
      setTimeout(() => {
        try { window.close(); } catch (e) { /* ignore */ }
      }, 1000);
      return;
    }

    // No return URL provided — try to send the signature to the opener (if present)
    if (window.opener && !window.opener.closed) {
      if (pad.isEmpty()) {
        // If no signature yet, just notify opener and close
        try {
          window.opener.postMessage({ type: 'signature-no-url', message: 'No return URL provided; signature pad closed.' }, '*');
        } catch (e) { /* ignore */ }
        try { window.close(); } catch (e) { /* ignore */ }
        return;
      }

      try {
        const dataURL = pad.toDataURL('image/png');
        const dateStr = new Date().toISOString().split('T')[0];
        const name = `signature-${dateStr}.png`;
        // Send the data URL and filename to the opener window
        window.opener.postMessage({ type: 'signature-data', filename: name, dataURL: dataURL }, '*');
        const toast = showToast('Signature sent to parent window. Closing…');
        setTimeout(() => {
          try { window.close(); } catch (e) { /* ignore */ }
          setTimeout(() => toast?.remove(), 500);
        }, 800);
        return;
      } catch (e) {
        console.warn('[Signature] postMessage to opener failed:', e);
        alert('No return URL provided and unable to send to opener. Please provide ?form= or ?return= in the URL.');
        return;
      }
    }

    // Final fallback: show clear alert so user knows how to proceed
    alert('No return URL provided. Append ?form=https://example.com or ?return=https://example.com to the page URL, or open this pad from your form so it can receive the signature.');
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