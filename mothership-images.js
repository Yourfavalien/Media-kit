(function () {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  const publicBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const slotMap = new Map((cfg.slots || []).map(slot => [slot.id, slot]));

  function remoteUrl(slotId) {
    const slot = slotMap.get(slotId);
    if (!slot) return null;
    return `${publicBase}${slot.path}?v=${Date.now()}`;
  }

  function applyImage(img) {
    const slotId = img.dataset.yfaImageSlot;
    const url = remoteUrl(slotId);
    if (!url) return;

    const fallback = img.getAttribute('src') || '';
    img.dataset.yfaFallback = fallback;
    img.onerror = function () {
      if (this.src !== fallback) {
        this.onerror = null;
        this.src = fallback;
      }
    };
    img.src = url;
  }

  function applyBackground(el) {
    const slotId = el.dataset.yfaBgSlot;
    const url = remoteUrl(slotId);
    if (!url) return;

    const probe = new Image();
    probe.onload = () => {
      el.style.backgroundImage = `url("${url}")`;
    };
    probe.src = url;
  }

  function boot() {
    document.querySelectorAll('[data-yfa-image-slot]').forEach(applyImage);
    document.querySelectorAll('[data-yfa-bg-slot]').forEach(applyBackground);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
