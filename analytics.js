(() => {
  'use strict';
  const root = document.getElementById('analyticsExperience');
  if (!root) return;
  const endpoint = root.dataset.endpoint;
  const refreshButton = document.getElementById('refreshAnalytics');
  const updateStatus = document.getElementById('updateStatus');
  const updatedAt = document.getElementById('updatedAt');
  const sourceBadge = document.getElementById('sourceBadge');
  const notice = document.getElementById('analyticsNotice');
  let hasRenderedData = false;
  const number = new Intl.NumberFormat('en-US');
  const date = new Intl.DateTimeFormat('en-US', { dateStyle:'medium', timeStyle:'short' });

  function validate(data) {
    const tiktok = data?.platforms?.tiktok;
    const instagram = data?.platforms?.instagram;
    const facebook = data?.platforms?.facebook;
    const required = [tiktok?.followers,tiktok?.engagementRate,tiktok?.impressions,tiktok?.averageViews,instagram?.followers,instagram?.engagementRate,instagram?.impressions,instagram?.reach30d,facebook?.followers,facebook?.engagementRate,facebook?.impressions,facebook?.reach30d];
    if (!data?.updatedAt || required.some(value => !Number.isFinite(value))) throw new Error('Incomplete analytics response.');
    return data;
  }
  function setMetric(key,value,suffix='') {
    const element = root.querySelector(`[data-metric="${key}"]`);
    if (element) element.textContent = `${number.format(value)}${suffix}`;
  }
  function showNotice(message,type) {
    notice.textContent = message;
    notice.className = `analytics-notice ${type}`;
    notice.hidden = !message;
  }
  function render(data) {
    const { tiktok,instagram,facebook } = data.platforms;
    setMetric('tiktok.followers',tiktok.followers);
    setMetric('tiktok.engagementRate',tiktok.engagementRate,'%');
    setMetric('tiktok.impressions',tiktok.impressions);
    setMetric('tiktok.averageViews',tiktok.averageViews);
    setMetric('instagram.followers',instagram.followers);
    setMetric('instagram.engagementRate',instagram.engagementRate,'%');
    setMetric('instagram.impressions',instagram.impressions);
    setMetric('instagram.reach30d',instagram.reach30d);
    setMetric('facebook.followers',facebook.followers);
    setMetric('facebook.engagementRate',facebook.engagementRate,'%');
    setMetric('facebook.impressions',facebook.impressions);
    setMetric('facebook.reach30d',facebook.reach30d);
    root.querySelector('[data-note="tiktok"]').textContent = 'Sanitized aggregate metrics';
    root.querySelector('[data-note="instagram"]').textContent = 'Sanitized aggregate metrics';
    root.querySelector('[data-note="facebook"]').textContent = 'Sanitized aggregate metrics';
    document.getElementById('combinedFollowers').textContent = number.format(tiktok.followers + instagram.followers + facebook.followers);
    const timestamp = new Date(data.updatedAt);
    const ageHours = (Date.now() - timestamp.getTime()) / 36e5;
    const source = ['live','cached','demo'].includes(data.source) ? data.source : 'cached';
    sourceBadge.textContent = source === 'demo' ? 'Demo data' : source === 'live' ? 'Live data' : 'Cached data';
    sourceBadge.className = `source-badge ${source}`;
    updatedAt.textContent = `Updated ${date.format(timestamp)}`;
    updateStatus.textContent = ageHours > 48 ? 'Showing the latest saved snapshot' : 'Analytics are up to date';
    showNotice(ageHours > 48 ? 'These figures are more than 48 hours old. The latest saved snapshot remains visible while the connection catches up.' : '','stale');
    hasRenderedData = true;
    window.dispatchEvent(new CustomEvent('analytics:updated',{ detail:{ data,source,stale:ageHours > 48 } }));
  }
  async function loadAnalytics() {
    root.classList.add('is-loading');
    root.setAttribute('aria-busy','true');
    refreshButton.disabled = true;
    updateStatus.textContent = hasRenderedData ? 'Checking for updates…' : 'Loading analytics…';
    if (!hasRenderedData) showNotice('','');
    try {
      const response = await fetch(endpoint,{ cache:'no-store',headers:{ Accept:'application/json' } });
      if (!response.ok) throw new Error(`Analytics request failed (${response.status}).`);
      render(validate(await response.json()));
    } catch (error) {
      updateStatus.textContent = hasRenderedData ? 'Refresh unsuccessful' : 'Analytics unavailable';
      showNotice(hasRenderedData ? 'We could not refresh just now. The last successful figures are still shown.' : 'The analytics preview could not load. Start the included local web server and try again.','error');
    } finally {
      root.classList.remove('is-loading');
      root.setAttribute('aria-busy','false');
      refreshButton.disabled = false;
    }
  }
  refreshButton.addEventListener('click',loadAnalytics);
  loadAnalytics();
})();
