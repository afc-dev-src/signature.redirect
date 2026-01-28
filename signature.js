<script>
/* AFC-branded signature app (half navy/red bg, white pad, transparent export, Close Tab) */
(function () {
  // ---------- Inject styles (no HTML edits required) ----------
  const styleTag = document.createElement('style');
  styleTag.setAttribute('data-afc-style', 'true');
  styleTag.textContent = `
    :root {
      --afc-blue: #0B1D39;  /* navy */
      --afc-red:  #C62828;  /* red */
    }
    /* Full-page half navy/half red (diagonal) */
    body {
      background: linear-gradient(135deg, var(--afc-blue) 0 50%, var(--afc-red) 50% 100%) !important;
      min-height: 100vh;
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
    }
    /* Make the canvas look white without baking it into the PNG */
    #pad {
      background: #ffffff !important;         /* visual only */
      border-radius: 12px;
      box-shadow: 0 4px 18px rgba(0,0,0,.15);
      touch-action: none;                     /* better ink on touch */
      width: 100%;
      max-width: 720px;
      height: 340px;                          /* visual height; JS sets pixel ratio */
      display: block;
      margin: 24px auto;
    }
    /* Optional toolbar styling */
    .toolbar {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin: 8px 16px 24px;
    }
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
    #savePNG {
      background: var(--afc-red);
      border-color: var(--afc-red);
      color: #fff;
    }
    #savePNG:hover { filter: brightness(0.95); }
  `;
  document.head.appendChild(styleTag);

  // ---------- Elements ----------
  const canvas    = document.getElementById('pad');
  const undoBtn   = document.getElementById('undoBtn');
  const clearBtn  = document.getElementById('clearBtn');
  const savePNG   = document.getElementById('savePNG');
  const returnBtn = document.getElementById('returnBtn'); // will become "Close Tab"

  if (!canvas) {
    console.error('[AFC Sign] #pad canvas not found.');
    return;
  }

  // ---------- Close Tab helpers ----------
  // Note: window.close() only works if this tab was script-opened (e.g., window.open or target="_blank" from a click).
  function tryCloseTab() {
    // Attempt 1
    window.close();

    // Attempt 2 (some engines require self-open before close)
    setTimeout(() => {
      try {
        window.open('', '_self'); 
        window.close();
      } catch {}
    }, 50);
  }

  function promptCloseAfterSave() {
    // Prompt the user; if OK, attempt to close the tab.
    if (confirm('Signature saved. Close this tab now?')) {
      tryCloseTab();
    }
  }

  // ---------- Signature Pad (transparent export) ----------
  // DO NOT set backgroundColor; keeps PNG background transparent.
  const signaturePad = new SignaturePad(canvas, {
    penColor: '#0B1D39',  // dark blue ink
    minWidth: 0.5,
    maxWidth: 2.5
  });

  // ---------- Responsive canvas with HiDPI support ----------
  function resizeCanvas() {
    const data  = signaturePad.toData();                     // preserve strokes through resize
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect  = canvas.getBoundingClientRect();

    // Match the CSS height (340px) & current width
    canvas.width  = Math.floor(rect.width  * ratio);
    canvas.height = Math.floor(340 * ratio);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);              // scale once

    signaturePad.clear();
    if (data && data.length) signaturePad.fromData(data);
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
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
    const url = signaturePad.toDataURL('image/png'); // transparent PNG
    download(url, `afc-signature-${Date.now()}.png`);
    // Prompt to close after saving
    setTimeout(() => promptCloseAfterSave(), 300);
  });

  // Replace "Return to Form" with "Close Tab"
  if (returnBtn) {
    returnBtn.textContent = 'Close Tab';
    returnBtn.addEventListener('click', (e) => {
      e.preventDefault();
      tryCloseTab();
    });
  }
})();
</script>