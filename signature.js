<script>
(function () {
  // ---------- Inject page-wide styles (keep yours as-is) ----------
  // ... your existing style injection remains unchanged ...

  // ---------- Elements ----------
  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const savePNG   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn');

  // Flag window name so we can detect this tab in some cases
  try { if (!window.name) window.name = 'afc_signature_tab'; } catch {}

  // ---------- Close Tab Helper ----------
  function canLikelyClose() {
    // If opened by script or has an opener, it usually can be closed.
    // Some environments also allow close if window.name is set by the app.
    return !!(window.opener || window.top !== window || window.name);
  }

  function tryCloseTab() {
    // Attempt 1: normal close (works if script-opened)
    window.close();

    // If still not closed, some browsers need a self-targeted open first
    setTimeout(() => {
      // Detect if still visible (crude, but avoids double-closing)
      const stillHere = !document.hidden || !!document.body;
      if (stillHere) {
        try {
          window.open('', '_self');  // detach from opener in some engines
          window.close();
        } catch {}

        // Last fallback: do nothing (avoid history.back to prevent extra tabs)
        // You may optionally show a non-blocking toast instead of alert:
        setTimeout(() => {
          const reallyStillHere = !document.hidden || !!document.body;
          if (reallyStillHere) {
            // Optional: minimal notification that the browser blocked closing.
            // Comment out if you prefer pure silence.
            console.warn('Browser blocked window.close(); the tab was likely not script-opened.');
          }
        }, 150);
      }
    }, 100);
  }

  // Replace your previous "doReturn" behavior with close-first
  function doCloseOrReturn() {
    // Prefer closing the tab to avoid creating duplicate tabs via history
    tryCloseTab();
  }

  // ---------- Signature Pad init (unchanged except we keep transparent export) ----------
  const signaturePad = new SignaturePad(canvas, {
    penColor: '#0B1D39',
    minWidth: 0.5,
    maxWidth: 2.5
  });

  // ---------- Responsive canvas (unchanged) ----------
  function resizeCanvas() {
    const data  = signaturePad.toData();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect  = canvas.getBoundingClientRect();

    canvas.width  = rect.width * ratio;
    canvas.height = 340 * ratio; // keep your chosen height
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    signaturePad.clear();
    if (data && data.length) signaturePad.fromData(data);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ---------- Controls (minor tweak: call doCloseOrReturn) ----------
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
    const url = signaturePad.toDataURL('image/png'); // transparent PNG
    download(url, `afc-signature-${Date.now()}.png`);

    setTimeout(() => {
      // Close automatically, or prompt — your call.
      // If you want a prompt, replace this line with a confirm() and then call doCloseOrReturn().
      doCloseOrReturn();
    }, 300);
  });

  // Change the button text to "Close Tab" and wire it to close
  try {
    if (returnBtn) {
      returnBtn.textContent = 'Close Tab';
      returnBtn.addEventListener('click', doCloseOrReturn, { once: false });
      // Optional: visually disable if we think the browser will block closing
      // (comment out if you don't want this behavior)
      if (!canLikelyClose()) {
        // Keep enabled but you could add a title hint:
        returnBtn.title = 'Your browser may block closing if this tab wasn’t opened by the app.';
      }
    }
  } catch {}

})();
</script>