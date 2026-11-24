/* Hydrates display copy from the Sanity-backed /api/sanity-content function. */
(function () {
  'use strict';

  if (window.__CNN_SANITY_HYDRATE_READY__) return;
  window.__CNN_SANITY_HYDRATE_READY__ = true;

  var ENDPOINT = '/api/sanity-content';
  var POLL_MS = 2000;

  var FALLBACK = {
    headline: 'Iranian-Linked Hackers Breach Edward Jones in Louisiana',
    dek: 'Elderly Americans targeted in a campaign that began last month. Louisiana branches now under heavy FTC and IRS audit — with advisor Beau Wilson under investigation — as reported losses climb upwards of $1.3 billion.',
    advisorName: 'Beau Wilson',
    location: '',
    byline: 'Maya Chen and Jordan Hale',
    publishedDisplay: 'August 16, 2026',
    updatedDisplay: '4:18 p.m. ET',
    lossesShort: '$1.3B+',
    lossesLong: 'upwards of $1.3 billion',
    lossesLongDisplay: 'Upwards of $1.3 billion',
    firmName: 'Edward Jones',
    kicker: 'Breaking',
    readTime: '8 min read',
    editorNote: 'Developing report on alleged compromises involving Edward Jones in Louisiana, Iranian-linked hackers, and elderly U.S. targets. Advisor Beau Wilson is under investigation. Activity began last month. Reported losses: upwards of $1.3 billion. Affected branches are under heavy FTC and IRS audit. If you are facing something similar, do not be afraid, refrain from contacting advisors, and file with the FTC at ReportFraud.ftc.gov.',
    bottomLineHeading: '$1.3B. Report to the FTC.',
    bottomLineBody: 'Iranian-linked hackers, Edward Jones in Louisiana, and a deliberate focus on elderly Americans — with advisor Beau Wilson under investigation, the campaign underway since last month, and losses climbing upwards of $1.3 billion. Those branches are under heavy FTC and IRS audit. If you are facing something similar, do not be afraid. Refrain from contacting advisors. File a report at the FTC instead.',
    protectBlurb: 'Do not be afraid. Compromised Edward Jones branches are under heavy FTC and IRS audit. Advisor Beau Wilson is under investigation. Losses are upwards of $1.3 billion. Refrain from contacting advisors — file a report with the FTC instead.',
    guidanceBlurb: 'Louisiana Edward Jones branches are under heavy FTC and IRS investigation. Advisor Beau Wilson is under probe after losses upwards of $1.3 billion.',
    heroCaption: 'Authorities move in as the Louisiana Edward Jones probe widens — advisor Beau Wilson is among those under investigation.',
    newsletterBlurb: 'Get updates when the FTC, IRS, or investigators issue new guidance for affected clients.',
    stats: [
      { k: 'Losses', v: '$1.3B+' },
      { k: 'Firm', v: 'Edward Jones' },
      { k: 'Under probe', v: 'Beau Wilson' },
      { k: 'Action', v: 'File w/ FTC' }
    ],
    tickerItems: [
      'BREAKING: Edward Jones Louisiana branches compromised',
      'Advisor Beau Wilson under investigation',
      'Iranian-linked actors suspected in elder-targeted campaign',
      'Reported losses upwards of $1.3 billion',
      'FTC and IRS open heavy audits of affected branches',
      'Officials urge clients: file with FTC — do not contact advisors'
    ],
    relatedStories: [
      { tag: 'Consumer Alert', time: '5 min', title: 'How to file a strong FTC fraud report', href: '#' },
      { tag: 'Investigation', time: '6 min', title: 'Who is Beau Wilson?', href: '#' },
      { tag: 'Markets', time: '7 min', title: 'Inside the $1.3 billion loss estimate', href: '#' },
      { tag: 'Guides', time: '4 min', title: 'Why seniors should skip advisor calls during a probe', href: '#' }
    ],
    scopeItems: [
      'Edward Jones',
      'Louisiana branches',
      'Beau Wilson under investigation',
      'Iranian-linked hackers',
      'Elderly Americans targeted',
      'Losses upwards of $1.3B',
      'FTC & IRS audits ongoing',
      'Report to FTC, not advisors'
    ]
  };

  var LOAD_PROMISE = null;
  var CURRENT = null;
  var LAST_APPLIED = null;
  var POLL_TIMER = null;
  var POLLING = false;

  function normalize(content) {
    var merged = {};
    Object.keys(FALLBACK).forEach(function (key) { merged[key] = FALLBACK[key]; });
    if (content && typeof content === 'object') {
      Object.keys(content).forEach(function (key) {
        if (content[key] !== undefined && content[key] !== null) merged[key] = content[key];
      });
    }
    return merged;
  }

  function fetchContent() {
    return fetch(ENDPOINT + '?_=' + Date.now(), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('sanity content request failed: ' + response.status);
        return response.json();
      });
  }

  function load() {
    if (!LOAD_PROMISE) {
      LOAD_PROMISE = fetchContent()
        .then(function (content) {
          CURRENT = normalize(content);
          return CURRENT;
        })
        .catch(function () {
          CURRENT = normalize(null);
          return CURRENT;
        });
    }
    return LOAD_PROMISE;
  }

  function refresh() {
    return fetchContent()
      .then(function (content) {
        var next = normalize(content);
        var previous = LAST_APPLIED || normalize(null);
        CURRENT = next;
        if (signature(next) !== signature(previous)) {
          applyAll(document, next, previous, true);
          LAST_APPLIED = next;
          document.dispatchEvent(new CustomEvent('cnn-sanity:changed', {
            detail: { previous: previous, content: next }
          }));
        }
        return next;
      })
      .catch(function () {
        return CURRENT || normalize(null);
      });
  }

  function signature(content) {
    try { return JSON.stringify(content); } catch (_) { return String(content); }
  }

  function getPath(object, path) {
    try {
      return path.split('.').reduce(function (value, key) {
        return value === undefined || value === null ? undefined : value[key];
      }, object);
    } catch (_) {
      return undefined;
    }
  }

  function hide(node, shouldHide) {
    if (!node) return;
    node.hidden = !!shouldHide;
    node.style.display = shouldHide ? 'none' : '';
  }

  function renderText(text, rules, bindingKey) {
    var output = String(text || '');
    (rules || []).forEach(function (rule) {
      if (bindingKey) {
        var leaf = String(rule.path || '').split('.').pop();
        if (leaf === bindingKey) return;
      }
      if (output.indexOf(rule.from) === -1) return;
      var pattern = new RegExp(escapeRegExp(rule.from), 'gi');
      output = output.replace(pattern, function (match) {
        return rule.exact ? rule.to : caseLike(match, rule.to);
      });
    });
    return output;
  }

  function applyBindings(root, content, rules) {
    if (!root || !root.querySelectorAll) return;

    var bound = root.querySelectorAll('[data-sanity]');
    Array.prototype.forEach.call(bound, function (node) {
      var key = node.getAttribute('data-sanity');
      var value = getPath(content, key);
      var text = value === undefined || value === null ? '' : String(value);
      text = renderText(text, rules, key);
      var template = node.getAttribute('data-sanity-template') || '{{value}}';
      var output = template.replace(/\{\{\s*value\s*\}\}/g, text);
      var attribute = node.getAttribute('data-sanity-attr');

      if (attribute) node.setAttribute(attribute, output);
      else node.textContent = output;

      if (node.hasAttribute('data-sanity-hide-when-empty')) hide(node, !text);
    });

    var hideEmpty = root.querySelectorAll('[data-sanity-hide-when-empty]');
    Array.prototype.forEach.call(hideEmpty, function (node) {
      var key = node.getAttribute('data-sanity-hide-when-empty');
      var value = getPath(content, key);
      hide(node, !value && value !== 0);
    });

    if (document.body && document.body.hasAttribute('data-sanity-document-title')) {
      document.title = content.headline ? 'CNN — ' + renderText(content.headline, rules, 'headline') : document.title;
    }
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function capFirst(value) {
    var text = String(value || '');
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  function caseLike(match, replacement) {
    var text = String(replacement || '');
    if (!text) return '';
    if (match === match.toUpperCase() && /[A-Z]/.test(match)) return text.toUpperCase();
    if (/^[A-Z]/.test(match) && !/^[A-Z]{2}/.test(match)) return capFirst(text);
    return text;
  }

  function bareLoss(value) {
    return String(value || '').replace(/\+/g, '');
  }

  function bareBillion(value) {
    return String(value || '').replace(/^\s*upwards\s+of\s+/i, '');
  }

  function flattenStrings(value, prefix, output) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      output[prefix] = value;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item, index) {
        flattenStrings(item, prefix ? prefix + '.' + index : String(index), output);
      });
      return;
    }
    if (typeof value === 'object') {
      Object.keys(value).forEach(function (key) {
        flattenStrings(value[key], prefix ? prefix + '.' + key : key, output);
      });
    }
  }

  function rulesBetween(previous, current, exact) {
    var from = {};
    var to = {};
    flattenStrings(previous || {}, '', from);
    flattenStrings(current || {}, '', to);
    var rules = [];
    var seen = {};
    Object.keys(from).forEach(function (path) {
      if (!(path in to)) return;
      var before = from[path];
      var after = to[path];
      if (typeof before !== 'string' || typeof after !== 'string') return;
      if (before.length < 3 || before === after) return;
      var key = before + '\u0000' + after;
      if (seen[key]) return;
      seen[key] = true;
      rules.push({ path: path, from: before, to: after, exact: !!exact });
    });
    return rules;
  }

  function applyTextRules(root, rules) {
    if (!root || !rules || !rules.length) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script, style, noscript, [data-sanity-no-replace]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var text = renderText(node.nodeValue, rules);
      if (text !== node.nodeValue) node.nodeValue = text;
    });
  }

  function applyText(root, content, previous, exact) {
    applyTextRules(root, rulesBetween(previous || FALLBACK, content, exact));
  }

  function applyAll(root, content, previous, exact) {
    var resolved = normalize(content || CURRENT || FALLBACK);
    var rules = rulesBetween(previous || FALLBACK, resolved, exact);
    applyTextRules(root, rules);
    applyBindings(root, resolved, rules);
    return resolved;
  }

  function overlayArticle(article, content) {
    var sanity = normalize(content || CURRENT || FALLBACK);
    var result = Object.assign({}, article || {});

    result.kicker = sanity.kicker || result.kicker;
    result.title = sanity.headline || result.title;
    result.headline = sanity.headline || result.headline;
    result.dek = sanity.dek || result.dek;
    result.subhead = sanity.dek || result.subhead;
    result.byline = sanity.byline || result.byline;
    result.author = sanity.byline || result.author;
    result.published = sanity.publishedDisplay || result.published;
    result.updated = sanity.updatedDisplay || result.updated;
    result.updatedAt = sanity.updatedDisplay || result.updatedAt;
    result.readTime = sanity.readTime || result.readTime;
    result.editorNote = sanity.editorNote || result.editorNote;
    result.bottomLineHeading = sanity.bottomLineHeading || result.bottomLineHeading;
    result.bottomLineBody = sanity.bottomLineBody || result.bottomLineBody;
    result.protectBlurb = sanity.protectBlurb || result.protectBlurb;
    result.guidanceBlurb = sanity.guidanceBlurb || result.guidanceBlurb;
    result.heroCaption = sanity.heroCaption || result.heroCaption;
    result.newsletterBlurb = sanity.newsletterBlurb || result.newsletterBlurb;
    result.tickerItems = sanity.tickerItems && sanity.tickerItems.length ? sanity.tickerItems : result.tickerItems;
    result.relatedStories = sanity.relatedStories && sanity.relatedStories.length ? sanity.relatedStories : result.relatedStories;
    result.scopeItems = sanity.scopeItems && sanity.scopeItems.length ? sanity.scopeItems : result.scopeItems;

    if (sanity.stats && sanity.stats.length) {
      result.stats = sanity.stats.map(function (stat) {
        return { k: stat.k || '', v: stat.v || '' };
      });
    }

    if (Array.isArray(result.keyFacts)) {
      result.keyFacts = result.keyFacts
        .map(function (fact) {
          var label = String(fact.label || '');
          var copy = Object.assign({}, fact);
          if (/firm/i.test(label)) copy.value = sanity.firmName;
          if (/advisor/i.test(label)) copy.value = sanity.advisorName;
          if (/loss/i.test(label)) copy.value = capFirst(sanity.lossesLong);
          if (/location/i.test(label)) copy.value = sanity.location;
          return copy;
        })
        .filter(function (fact) {
          return !/location/i.test(String(fact.label || '')) || !!sanity.location;
        });
    }

    return result;
  }

  var api = {
    load: load,
    refresh: refresh,
    applyBindings: applyBindings,
    applyText: applyText,
    applyAll: applyAll,
    overlayArticle: overlayArticle
  };

  Object.defineProperty(api, 'current', {
    get: function () { return CURRENT || FALLBACK; }
  });

  window.CNNSanityHydrate = api;

  function startPolling() {
    if (POLL_TIMER) return;
    POLL_TIMER = window.setInterval(function () {
      if (POLLING || document.hidden) return;
      POLLING = true;
      refresh().then(
        function () { POLLING = false; },
        function () { POLLING = false; }
      );
    }, POLL_MS);
  }

  function init() {
    var hasTargets = document.querySelector('[data-sanity], [data-sanity-hide-when-empty], [data-sanity-document-title], #article-root');
    if (!hasTargets) return;

    load().then(function (content) {
      applyAll(document, content, FALLBACK, true);
      LAST_APPLIED = content;
      document.dispatchEvent(new CustomEvent('cnn-sanity:ready', { detail: content }));
      startPolling();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
