// Live release facts for the download and Studio pages: GitHub (app), crates.io (yana-rt), PyPI (yana-ai).
// The static values in the HTML stay if an API fails. Values are validated and written with textContent only.
(function () {
  'use strict';

  var REPO = 'https://github.com/Horonomos-laps/Yana-studio/releases';
  var APP_API = 'https://api.github.com/repos/Horonomos-laps/Yana-studio/releases?per_page=30';
  var RT_API = 'https://crates.io/api/v1/crates/yana-rt';
  var PYPI_API = 'https://pypi.org/pypi/yana-ai/json';
  var APP_TAG = /^app-v(\d+\.\d+\.\d+)$/;
  var VERSION = /^\d+\.\d+\.\d+$/;
  var DIGEST = /^sha256:([0-9a-f]{64})$/;
  var TIMEOUT_MS = 8000; // a stalled API must not leave "checking" on the page forever
  var LOCALES = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' };
  var PUBLISHED = { vi: 'Phát hành {date}', en: 'Released {date}', ko: '{date} 출시' };

  function assetByExtension(release, extension) {
    var prefix = REPO + '/download/' + release.tag_name + '/';
    return (release.assets || []).filter(function (asset) {
      return asset.name.endsWith(extension) && asset.browser_download_url.indexOf(prefix) === 0;
    })[0];
  }

  // All app facts come from one release, so version, links, size and checksum can never disagree.
  // A release without a .dmg is skipped: the page keeps offering the last one that can be installed.
  function appFacts(releases) {
    if (!Array.isArray(releases)) return null;
    for (var i = 0; i < releases.length; i += 1) {
      var release = releases[i];
      var tag = APP_TAG.exec(release.tag_name || '');
      if (!tag || release.draft || release.prerelease) continue;
      var dmg = assetByExtension(release, '.dmg');
      if (!dmg) continue;
      var zip = assetByExtension(release, '.zip');
      var digest = DIGEST.exec(dmg.digest || '');
      return {
        version: tag[1],
        publishedAt: release.published_at,
        dmgUrl: dmg.browser_download_url,
        zipUrl: zip ? zip.browser_download_url : '',
        notesUrl: REPO + '/tag/' + release.tag_name,
        size: Math.round(dmg.size / 1e6) + ' MB',
        sha256: digest ? digest[1] : ''
      };
    }
    return null;
  }

  function language() {
    var code = (document.documentElement.lang || 'en').slice(0, 2);
    return LOCALES[code] ? code : 'en';
  }

  function each(selector, apply) {
    document.querySelectorAll(selector).forEach(apply);
  }

  function setText(selector, value) {
    each(selector, function (el) { el.textContent = value; });
  }

  function showVersion(key, version, iso) {
    if (!VERSION.test(version)) return;
    setText('[data-ver-num="' + key + '"]', version);
    var when = new Date(iso);
    var known = !isNaN(when);
    var code = language();
    var date = known ? when.toLocaleDateString(LOCALES[code], { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    setText('[data-ver-date="' + key + '"]', known ? PUBLISHED[code].replace('{date}', date) : '');
  }

  function showApp(facts) {
    showVersion('app', facts.version, facts.publishedAt);
    setText('[data-dl-version]', facts.version);
    setText('[data-dl-size]', facts.size);
    each('[data-dl-dmg]', function (el) { el.href = facts.dmgUrl; });
    each('[data-dl-notes]', function (el) { el.href = facts.notesUrl; });
    each('[data-dl-zip]', function (el) { el.href = facts.zipUrl || facts.notesUrl; });
    // Never leave the previous release's checksum next to a new download.
    each('[data-dl-sha]', function (el) {
      el.textContent = facts.sha256 || el.getAttribute('data-sha-missing') || '';
    });
  }

  function getJson(url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    return fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .finally(function () { clearTimeout(timer); });
  }

  function load(key, selector, url, apply) {
    if (!document.querySelector(selector)) return;
    getJson(url).then(apply).catch(function (error) {
      console.warn('release facts unavailable for ' + key + ': ' + error.message);
      each('[data-ver-date="' + key + '"][data-loading]', function (el) { el.textContent = ''; });
    });
  }

  function start() {
    load('app', '[data-ver-num="app"], [data-dl-version]', APP_API, function (list) {
      var facts = appFacts(list);
      if (!facts) throw new Error('no installable app release');
      showApp(facts);
    });
    load('rt', '[data-ver-num="rt"]', RT_API, function (data) {
      showVersion('rt', data.crate.max_stable_version, data.crate.updated_at);
    });
    load('pypi', '[data-ver-num="pypi"]', PYPI_API, function (data) {
      var file = (data.urls || [])[0] || {};
      showVersion('pypi', data.info.version, file.upload_time_iso_8601 || file.upload_time);
    });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { appFacts: appFacts, start: start };
  else start();
})();
