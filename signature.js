// signature.js
// Transparent export by default; visible pad and toolbar are white via CSS.
// Handles missing return URL by posting message to opener (if present) or showing an alert.

(function () {
  'use strict';

  const DOWNLOAD_CLOSE_DELAY_MS = 800;

  const canvas       = document.getElementById('pad');
  const undoBtn      = document.getElementById('undoBtn');
  const clearBtn     = document.getElementById('clearBtn');
  const saveBtn      = document.getElementById('savePNG');
  const modal        = document.getElementById('confirmModal');
  const refreshModal = document.getElementById('refreshModal');
  const refreshMsg   = document.getElementById('refreshMessage');
  const confirmBtn   = document.getElementById('confirmBtn');
  const cancelBtn    = document.getElementById('cancelBtn');
  const refreshBtn   = document.getElementById('refreshBtn');

  let isConfirmed = false;
  let padReady = false;
  let pad = null;

  function setPadInteractivity(enabled) {
    if (!canvas) return;
    canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    canvas.style.opacity = enabled ? '1' : '0.5';
    if (undoBtn) undoBtn.disabled = !enabled;
    if (clearBtn) clearBtn.disabled = !enabled;
    if (saveBtn) saveBtn.disabled = !enabled;
  }

  // Disable canvas and controls initially until confirmation
  setPadInteractivity(false);

  // Confirmation Modal - wire this before SignaturePad checks so buttons always work.
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (!padReady) {
        modal?.classList.add('hidden');
        if (refreshMsg) {
          refreshMsg.textContent = 'Signature pad failed to load. Please check your internet connection and refresh the page.';
        }
        refreshModal?.classList.remove('hidden');
        return;
      }
      isConfirmed = true;
      modal?.classList.add('hidden');
      setPadInteractivity(true);
      canvas.focus();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal?.classList.add('hidden');
      if (refreshMsg) {
        refreshMsg.textContent = 'You must confirm to use the signature pad. Please refresh the page and try again.';
      }
      refreshModal?.classList.remove('hidden');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      location.reload();
    });
  }

  if (!canvas) { console.error('[Signature] <canvas id="pad"> not found.'); return; }
  if (!window.SignaturePad) { console.error('[Signature] SignaturePad UMD not loaded.'); return; }

  // Set backgroundColor to transparent so exported PNG is transparent.
  pad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgba(0,0,0,0)', // transparent export
    penColor: '#0B1D39',
    minWidth: 0.8,
    maxWidth: 2.2,
    throttle: 16
  });
  padReady = true;

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

  if (isConfirmed) setPadInteractivity(true);

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
    
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to submit your signature? Please confirm to proceed.');
    if (!confirmed) {
      return;
    }
    
    try {
      const dataURL = pad.toDataURL('image/png'); // transparent PNG
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const name = `signature-${dateStr}.png`;
      triggerDownload(dataURL, name);

      const toast = showToast('Signature saved. Closing this tab...');
      setTimeout(() => {
        try { window.close(); } catch (e) { /* ignore */ }
        setTimeout(() => toast?.remove(), 500);
      }, DOWNLOAD_CLOSE_DELAY_MS);

    } catch (e) {
      console.error('[Signature] Failed to save PNG:', e);
      alert('Could not save the PNG. See console for details.');
    }
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
        background: 'rgba(7,10,20,.92)',
        color: '#f5f2ea',
        border: '1px solid rgba(215,181,109,.35)',
        padding: '10px 14px',
        borderRadius: '8px',
        font: '600 14px/1.2 "Space Grotesk", "Segoe UI", sans-serif',
        zIndex: 9999,
        boxShadow: '0 10px 24px rgba(0,0,0,.35)'
      });
      document.body.appendChild(el);
      return el;
    } catch { return null; }
  }
})();
