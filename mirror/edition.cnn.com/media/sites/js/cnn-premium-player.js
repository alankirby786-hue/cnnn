/* CNN premium video player UI. No video sources are read or replaced. */
(function () {
  'use strict';

  var READY_KEY = '__CNN_PREMIUM_PLAYER_UI_READY__';
  if (window[READY_KEY]) return;
  window[READY_KEY] = true;

  var SELECTOR = '.cnn-top-video, .interactive-video__player';
  var HIDE_DELAY = 2500;
  var SPEEDS = [0.75, 1, 1.25, 1.5, 2];

  var ICONS = {
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    rewind: '<path d="M4.2 9.2A8 8 0 1 1 4 15"/><path d="M3.5 4.5v4.8h4.8"/><text x="12" y="15.7" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">5</text>',
    forward: '<path d="M19.8 9.2A8 8 0 1 0 20 15"/><path d="M20.5 4.5v4.8h-4.8"/><text x="12" y="15.7" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">5</text>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    muted: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/>',
    captions: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M9.5 10.5a2.5 2.5 0 1 0 0 3"/><path d="M17.5 10.5a2.5 2.5 0 1 0 0 3"/>',
    settings: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="#000"/><circle cx="15" cy="12" r="2" fill="#000"/><circle cx="10" cy="17" r="2" fill="#000"/>',
    fullscreen: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    fullscreenExit: '<path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>';
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function fmtTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var s = Math.floor(seconds);
    var m = Math.floor(s / 60);
    return m + ':' + ('0' + (s % 60)).slice(-2);
  }

  function isNavStopped(video) {
    return video && video.getAttribute('data-cnn-stop-for-nav') === '1';
  }

  function isUserPaused(video) {
    return video && video.getAttribute('data-cnn-user-paused') === '1';
  }

  function isUserMuted(video) {
    return video && video.getAttribute('data-cnn-user-muted') === '1';
  }

  function getDuration(video) {
    return isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  }

  function wrapVideo(video) {
    var parent = video.parentElement;
    if (!parent) return null;
    if (parent.classList && parent.classList.contains('cnn-premium-player-shell')) return parent;
    var shell = document.createElement('div');
    shell.className = 'cnn-premium-player-shell';
    shell.setAttribute('data-cnn-premium-player', '1');
    parent.insertBefore(shell, video);
    shell.appendChild(video);
    return shell;
  }

  function buildUI(isTop) {
    var ui = document.createElement('div');
    ui.className = 'cnn-player-ui';
    ui.setAttribute('data-state', 'paused');
    ui.innerHTML =
      '<div class="cnn-player-ui__center" aria-hidden="true">' + icon('play') + '</div>' +
      '<div class="cnn-player-ui__spinner" aria-hidden="true"></div>' +
      '<div class="cnn-player-ui__bar">' +
        '<div class="cnn-player-ui__progress-row">' +
          '<div class="cnn-player-ui__progress" role="slider" tabindex="0" aria-label="Seek video" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0:00 of 0:00">' +
            '<div class="cnn-player-ui__progress-buffer"></div>' +
            '<div class="cnn-player-ui__progress-played"></div>' +
            '<div class="cnn-player-ui__progress-knob"></div>' +
          '</div>' +
        '</div>' +
        '<div class="cnn-player-ui__controls">' +
          '<div class="cnn-player-ui__group cnn-player-ui__group--left">' +
            '<button type="button" class="cnn-player-ui__btn" data-action="toggle" aria-label="Play">' + icon('play') + '</button>' +
            '<button type="button" class="cnn-player-ui__btn cnn-player-ui__btn--secondary" data-action="rewind" aria-label="Rewind 5 seconds" title="Rewind 5 seconds">' + icon('rewind') + '</button>' +
            '<button type="button" class="cnn-player-ui__btn cnn-player-ui__btn--secondary" data-action="forward" aria-label="Forward 5 seconds" title="Forward 5 seconds">' + icon('forward') + '</button>' +
            '<button type="button" class="cnn-player-ui__btn" data-action="mute" aria-label="Mute">' + icon('volume') + '</button>' +
            '<span class="cnn-player-ui__time" aria-live="off"><span data-time="current">0:00</span><span class="cnn-player-ui__time-sep">/</span><span data-time="duration">0:00</span></span>' +
          '</div>' +
          '<div class="cnn-player-ui__group cnn-player-ui__group--right">' +
            '<button type="button" class="cnn-player-ui__btn cnn-player-ui__btn--secondary" data-action="captions" aria-label="Turn captions on" hidden>' + icon('captions') + '</button>' +
            '<button type="button" class="cnn-player-ui__btn" data-action="settings" aria-label="Playback settings" aria-expanded="false" aria-haspopup="true">' + icon('settings') + '</button>' +
            '<button type="button" class="cnn-player-ui__btn" data-action="fullscreen" aria-label="Enter fullscreen">' + icon('fullscreen') + '</button>' +
            '<div class="cnn-player-ui__settings-menu" role="menu" aria-label="Playback settings">' +
              '<button type="button" data-setting="rewind" role="menuitem">Rewind 5 seconds</button>' +
              '<button type="button" data-setting="forward" role="menuitem">Forward 5 seconds</button>' +
              '<button type="button" data-setting="captions" role="menuitem" hidden>Turn captions on</button>' +
              '<div class="cnn-player-ui__settings-label" role="presentation">Playback speed</div>' +
              SPEEDS.map(function (rate) {
                return '<button type="button" data-speed="' + rate + '" role="menuitemradio" aria-checked="' + (rate === 1 ? 'true' : 'false') + '">' + rate + '×</button>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (isTop) ui.setAttribute('data-cnn-player', 'top');
    return ui;
  }

  function fullscreenApi(video, shell) {
    if (shell.requestFullscreen || shell.webkitRequestFullscreen) {
      var req = shell.requestFullscreen || shell.webkitRequestFullscreen;
      var exit = document.exitFullscreen || document.webkitExitFullscreen || function () {};
      return {
        enter: function () { return req.call(shell); },
        exit: function () { return exit.call(document); },
        active: function () { return document.fullscreenElement === shell || document.webkitFullscreenElement === shell; },
        events: ['fullscreenchange', 'webkitfullscreenchange']
      };
    }
    if (video.webkitEnterFullscreen) {
      return {
        enter: function () { return video.webkitEnterFullscreen(); },
        exit: function () { return video.webkitExitFullscreen ? video.webkitExitFullscreen() : null; },
        active: function () { return !!video.webkitDisplayingFullscreen; },
        events: ['webkitbeginfullscreen', 'webkitendfullscreen']
      };
    }
    return null;
  }

  function createPlayer(video) {
    if (video.getAttribute('data-cnn-premium-ready') === '1') return;
    video.setAttribute('data-cnn-premium-ready', '1');

    var isTop = video.classList.contains('cnn-top-video');
    var shell = wrapVideo(video);
    if (!shell) return;

    video.removeAttribute('controls');
    video.controls = false;
    if (!video.hasAttribute('tabindex')) video.setAttribute('tabindex', '0');
    if (!video.getAttribute('aria-label')) video.setAttribute('aria-label', 'Video player');

    var ui = buildUI(isTop);
    shell.appendChild(ui);

    var refs = {
      toggle: ui.querySelector('[data-action="toggle"]'),
      rewind: ui.querySelector('[data-action="rewind"]'),
      forward: ui.querySelector('[data-action="forward"]'),
      mute: ui.querySelector('[data-action="mute"]'),
      captions: ui.querySelector('[data-action="captions"]'),
      settings: ui.querySelector('[data-action="settings"]'),
      fullscreen: ui.querySelector('[data-action="fullscreen"]'),
      menu: ui.querySelector('.cnn-player-ui__settings-menu'),
      progress: ui.querySelector('.cnn-player-ui__progress'),
      played: ui.querySelector('.cnn-player-ui__progress-played'),
      buffer: ui.querySelector('.cnn-player-ui__progress-buffer'),
      knob: ui.querySelector('.cnn-player-ui__progress-knob'),
      current: ui.querySelector('[data-time="current"]'),
      duration: ui.querySelector('[data-time="duration"]')
    };

    var state = {
      video: video,
      shell: shell,
      ui: ui,
      refs: refs,
      isTop: isTop,
      state: '',
      dragging: false,
      settingsOpen: false,
      hideTimer: null,
      bufferTimer: null,
      fsApi: fullscreenApi(video, shell)
    };

    function updateSizeVar() {
      var h = Math.round(shell.getBoundingClientRect().height);
      ui.style.setProperty('--cnn-player-height', Math.max(0, h) + 'px');
    }

    function setState(next) {
      if (state.state === next) return;
      state.state = next;
      ui.setAttribute('data-state', next);
      if (video.setAttribute) video.setAttribute('aria-busy', next === 'buffering' ? 'true' : 'false');
    }

    function clearBufferTimer() {
      if (state.bufferTimer) { clearTimeout(state.bufferTimer); state.bufferTimer = null; }
    }

    function beginBuffering(delay) {
      clearBufferTimer();
      state.bufferTimer = setTimeout(function () {
        state.bufferTimer = null;
        if (!video.paused) setState('buffering');
      }, delay || 0);
    }

    function syncPlaybackState() {
      if (video.paused || video.ended) {
        clearBufferTimer();
        setState('paused');
      } else if (video.readyState < 3) {
        beginBuffering(120);
      } else {
        clearBufferTimer();
        setState('playing');
      }
      updateToggle();
    }

    function updateToggle() {
      var paused = video.paused || video.ended;
      refs.toggle.innerHTML = icon(paused ? 'play' : 'pause');
      refs.toggle.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      refs.toggle.setAttribute('title', paused ? 'Play' : 'Pause');
    }

    function updateMute() {
      var muted = video.muted || video.volume === 0;
      refs.mute.innerHTML = icon(muted ? 'muted' : 'volume');
      refs.mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
      refs.mute.setAttribute('title', muted ? 'Unmute' : 'Mute');
    }

    function updateCaptions() {
      var hasTracks = !!(video.textTracks && video.textTracks.length);
      refs.captions.hidden = !hasTracks;
      var menuCaptions = refs.menu.querySelector('[data-setting="captions"]');
      if (menuCaptions) menuCaptions.hidden = !hasTracks;
      if (!hasTracks) return;
      var enabled = false;
      try {
        for (var i = 0; i < video.textTracks.length; i++) {
          if (video.textTracks[i].mode === 'showing') { enabled = true; break; }
        }
      } catch (e) {}
      var label = enabled ? 'Turn captions off' : 'Turn captions on';
      refs.captions.setAttribute('aria-label', label);
      refs.captions.setAttribute('title', label);
      if (menuCaptions) menuCaptions.textContent = label;
    }

    function updateTime() {
      var duration = getDuration(video);
      var current = video.currentTime || 0;
      refs.current.textContent = fmtTime(current);
      refs.duration.textContent = duration ? fmtTime(duration) : '0:00';

      var pct = duration ? clamp((current / duration) * 100, 0, 100) : 0;
      refs.played.style.width = pct + '%';
      refs.knob.style.left = pct + '%';

      var bufferedPct = 0;
      if (duration && video.buffered && video.buffered.length) {
        for (var i = video.buffered.length - 1; i >= 0; i--) {
          var end = video.buffered.end(i);
          if (end >= current - 0.25) { bufferedPct = clamp((end / duration) * 100, 0, 100); break; }
        }
      }
      refs.buffer.style.width = bufferedPct + '%';

      refs.progress.setAttribute('aria-valuemax', duration ? String(Math.round(duration)) : '0');
      refs.progress.setAttribute('aria-valuenow', String(Math.round(current)));
      refs.progress.setAttribute('aria-valuetext', fmtTime(current) + ' of ' + fmtTime(duration));
      refs.progress.classList.toggle('is-disabled', !duration);
    }

    function updateFullscreen() {
      if (!state.fsApi) {
        refs.fullscreen.hidden = true;
        return;
      }
      var active = false;
      try { active = state.fsApi.active(); } catch (e) {}
      refs.fullscreen.innerHTML = icon(active ? 'fullscreenExit' : 'fullscreen');
      refs.fullscreen.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
      refs.fullscreen.setAttribute('title', active ? 'Exit fullscreen' : 'Enter fullscreen');
    }

    function closeSettings() {
      if (!state.settingsOpen) return;
      state.settingsOpen = false;
      refs.menu.classList.remove('is-open');
      refs.settings.setAttribute('aria-expanded', 'false');
      scheduleHide();
    }

    function openSettings() {
      state.settingsOpen = true;
      clearTimeout(state.hideTimer);
      refs.menu.classList.add('is-open');
      refs.settings.setAttribute('aria-expanded', 'true');
    }

    function hideControls() {
      if (video.paused || state.settingsOpen || state.dragging) return;
      ui.classList.remove('is-visible');
    }

    function scheduleHide() {
      clearTimeout(state.hideTimer);
      if (video.paused || state.settingsOpen || state.dragging) return;
      state.hideTimer = setTimeout(function () {
        var hovered = false;
        try { hovered = ui.matches(':hover'); } catch (e) {}
        if (!video.paused && !state.settingsOpen && !state.dragging && !hovered) hideControls();
      }, HIDE_DELAY);
    }

    function showControls(allowHide) {
      ui.classList.add('is-visible');
      clearTimeout(state.hideTimer);
      if (allowHide !== false) scheduleHide();
    }

    function play() {
      if (isNavStopped(video)) return;
      showControls();
      if (isTop && !isUserMuted(video)) {
        video.muted = false;
        video.volume = 1;
      }
      if (isTop) video.removeAttribute('data-cnn-user-paused');
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {
          if (isTop && !isUserMuted(video)) {
            video.muted = true;
            var p2 = video.play();
            if (p2 && p2.catch) p2.catch(function () { syncPlaybackState(); });
          } else {
            syncPlaybackState();
          }
        });
      }
    }

    function pause() {
      video.pause();
      if (isTop) video.setAttribute('data-cnn-user-paused', '1');
      showControls(false);
      syncPlaybackState();
    }

    function togglePlay() {
      if (video.paused || video.ended) play(); else pause();
    }

    function seekBy(delta) {
      var duration = getDuration(video);
      var next = (video.currentTime || 0) + delta;
      if (duration) next = clamp(next, 0, duration);
      else next = Math.max(0, next);
      try { video.currentTime = next; } catch (e) {}
      updateTime();
      showControls();
    }

    function seekToClientX(clientX) {
      var duration = getDuration(video);
      if (!duration) return;
      var rect = refs.progress.getBoundingClientRect();
      if (!rect.width) return;
      var fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
      try { video.currentTime = fraction * duration; } catch (e) {}
      updateTime();
      showControls(false);
    }

    function toggleMute() {
      var muted = video.muted || video.volume === 0;
      video.muted = !muted;
      if (!muted) video.volume = 1;
      if (isTop) {
        if (muted) video.removeAttribute('data-cnn-user-muted');
        else video.setAttribute('data-cnn-user-muted', '1');
      }
      updateMute();
      showControls();
    }

    function toggleCaptions() {
      if (!video.textTracks || !video.textTracks.length) return;
      var showing = false;
      try {
        for (var i = 0; i < video.textTracks.length; i++) {
          if (video.textTracks[i].mode === 'showing') { showing = true; break; }
        }
        for (var j = 0; j < video.textTracks.length; j++) {
          video.textTracks[j].mode = showing ? 'disabled' : (j === 0 ? 'showing' : 'disabled');
        }
      } catch (e) {}
      updateCaptions();
      showControls();
    }

    function toggleFullscreen() {
      if (!state.fsApi) return;
      closeSettings();
      try {
        var result = state.fsApi.active() ? state.fsApi.exit() : state.fsApi.enter();
        if (result && result.catch) result.catch(function () {});
      } catch (e) {}
      setTimeout(updateFullscreen, 80);
    }

    function bindProgress() {
      function down(e) {
        if (getDuration(video) <= 0) return;
        state.dragging = true;
        refs.progress.classList.add('is-dragging');
        clearTimeout(state.hideTimer);
        if (e.pointerId !== undefined && refs.progress.setPointerCapture) {
          try { refs.progress.setPointerCapture(e.pointerId); } catch (err) {}
        }
        seekToClientX(e.clientX);
        e.preventDefault();
      }
      function move(e) {
        if (!state.dragging) return;
        seekToClientX(e.clientX);
        e.preventDefault();
      }
      function up(e) {
        if (!state.dragging) return;
        state.dragging = false;
        refs.progress.classList.remove('is-dragging');
        if (e.pointerId !== undefined && refs.progress.releasePointerCapture) {
          try { refs.progress.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        updateTime();
        showControls();
      }

      if (window.PointerEvent) {
        refs.progress.addEventListener('pointerdown', down);
        refs.progress.addEventListener('pointermove', move);
        refs.progress.addEventListener('pointerup', up);
        refs.progress.addEventListener('pointercancel', up);
      } else {
        refs.progress.addEventListener('mousedown', down);
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        refs.progress.addEventListener('touchstart', function (e) { down(e.touches[0]); }, { passive: false });
        refs.progress.addEventListener('touchmove', function (e) { move(e.touches[0]); e.preventDefault(); }, { passive: false });
        refs.progress.addEventListener('touchend', function (e) { up(e.changedTouches[0] || { clientX: 0 }); });
      }

      refs.progress.addEventListener('keydown', function (e) {
        var handled = true;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') seekBy(-5);
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') seekBy(5);
        else if (e.key === 'PageDown') seekBy(-10);
        else if (e.key === 'PageUp') seekBy(10);
        else if (e.key === 'Home') { try { video.currentTime = 0; } catch (err) {} updateTime(); }
        else if (e.key === 'End') { var d = getDuration(video); if (d) { try { video.currentTime = d - 0.01; } catch (err) {} } updateTime(); }
        else if (e.key === 'Enter' || e.key === ' ') togglePlay();
        else handled = false;
        if (handled) { e.preventDefault(); e.stopPropagation(); showControls(); }
      });
    }

    function bindEvents() {
      ui.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('button[data-action], button[data-setting], button[data-speed]') : null;
        if (!btn) {
          if (e.target.closest && e.target.closest('.cnn-player-ui__settings-menu')) e.stopPropagation();
          return;
        }
        e.preventDefault();
        e.stopPropagation();

        if (btn.hasAttribute('data-speed')) {
          var rate = parseFloat(btn.getAttribute('data-speed'));
          try { video.playbackRate = rate; } catch (err) {}
          refs.menu.querySelectorAll('[data-speed]').forEach(function (node) {
            node.setAttribute('aria-checked', parseFloat(node.getAttribute('data-speed')) === rate ? 'true' : 'false');
          });
          showControls();
          return;
        }
        if (btn.hasAttribute('data-setting')) {
          var setting = btn.getAttribute('data-setting');
          if (setting === 'rewind') seekBy(-5);
          else if (setting === 'forward') seekBy(5);
          else if (setting === 'captions') toggleCaptions();
          closeSettings();
          return;
        }

        var action = btn.getAttribute('data-action');
        if (action === 'toggle') togglePlay();
        else if (action === 'rewind') seekBy(-5);
        else if (action === 'forward') seekBy(5);
        else if (action === 'mute') toggleMute();
        else if (action === 'captions') toggleCaptions();
        else if (action === 'settings') {
          if (state.settingsOpen) closeSettings(); else openSettings();
        } else if (action === 'fullscreen') toggleFullscreen();
      });

      ui.addEventListener('focusin', function () { showControls(false); });
      ui.addEventListener('focusout', function () { scheduleHide(); });
      shell.addEventListener('pointermove', function () { showControls(); scheduleHide(); });
      shell.addEventListener('pointerleave', function () { scheduleHide(); });
      shell.addEventListener('touchstart', function () { showControls(); scheduleHide(); }, { passive: true });

      shell.addEventListener('click', function (e) {
        if (e.defaultPrevented) return;
        if (e.target.closest && e.target.closest('.cnn-player-ui')) return;
        if (e.target.closest && e.target.closest('a')) return;
        if (e.target !== video && e.target !== shell) return;
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      });

      shell.addEventListener('keydown', function (e) {
        if (e.target !== video) return;
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'k') { e.preventDefault(); togglePlay(); }
        else if (e.key === 'm') { e.preventDefault(); toggleMute(); }
        else if (e.key === 'f') { e.preventDefault(); toggleFullscreen(); }
      });

      document.addEventListener('click', function (e) {
        if (state.settingsOpen && !e.target.closest('.cnn-player-ui__settings-menu') && e.target !== refs.settings) closeSettings();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && state.settingsOpen) { closeSettings(); refs.settings.focus(); }
      });

      video.addEventListener('play', function () { syncPlaybackState(); showControls(); });
      video.addEventListener('playing', function () { clearBufferTimer(); syncPlaybackState(); showControls(); });
      video.addEventListener('pause', function () { syncPlaybackState(); showControls(false); });
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('durationchange', updateTime);
      video.addEventListener('loadedmetadata', function () { updateTime(); updateCaptions(); });
      video.addEventListener('progress', updateTime);
      video.addEventListener('seeking', function () { if (!video.paused) beginBuffering(80); updateTime(); showControls(false); });
      video.addEventListener('seeked', function () { clearBufferTimer(); syncPlaybackState(); updateTime(); showControls(); });
      video.addEventListener('waiting', function () { beginBuffering(140); showControls(false); });
      video.addEventListener('stalled', function () { beginBuffering(140); });
      video.addEventListener('loadstart', function () { if (!video.paused) beginBuffering(180); });
      video.addEventListener('canplay', function () { clearBufferTimer(); syncPlaybackState(); });
      video.addEventListener('error', function () { clearBufferTimer(); setState('paused'); updateToggle(); showControls(false); });
      video.addEventListener('volumechange', function () { updateMute(); updateTime(); });
      video.addEventListener('ratechange', function () {
        refs.menu.querySelectorAll('[data-speed]').forEach(function (node) {
          node.setAttribute('aria-checked', parseFloat(node.getAttribute('data-speed')) === (video.playbackRate || 1) ? 'true' : 'false');
        });
      });
      if (video.textTracks && video.textTracks.addEventListener) video.textTracks.addEventListener('change', updateCaptions);

      if (state.fsApi) {
        state.fsApi.events.forEach(function (name) {
          document.addEventListener(name, function () { updateFullscreen(); updateSizeVar(); });
          video.addEventListener(name, function () { updateFullscreen(); updateSizeVar(); });
        });
      }
      window.addEventListener('resize', updateSizeVar);
    }

    bindProgress();
    bindEvents();
    syncPlaybackState();
    updateMute();
    updateTime();
    updateCaptions();
    updateFullscreen();
    updateSizeVar();
    showControls(false);
    if (!video.paused) scheduleHide();
  }

  function init() {
    var videos = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < videos.length; i++) createPlayer(videos[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
