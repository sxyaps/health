/**
 * HealthPulse - Main Application Controller
 * Handles initialization, routing, event binding, screen rendering,
 * check-in flow management, chat logic, and notification scheduling.
 */
(function () {
  'use strict';

  /* ========== Aliases for Modules ========== */
  var Storage = window.HealthStorage;
  var Insights = window.HealthInsights;
  var UI = window.HealthUI;

  /* ========== Feedback Engine (Sound + Vibration + Visual) ========== */

  /** Web Audio context - created lazily on first user gesture */
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

  /** Master volume for feedback sounds (0-1) */
  var FEEDBACK_VOLUME = 0.15;

  /**
   * Play a synthesized tone.
   * @param {number} freq - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} type - Oscillator type: sine, square, triangle, sawtooth
   * @param {number} [vol] - Volume 0-1
   * @param {number} [delay] - Delay before playing in seconds
   */
  function playTone(freq, duration, type, vol, delay) {
    if (Storage.getPref('sounds', true) === false) return;
    try {
      var ctx = getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      var startTime = ctx.currentTime + (delay || 0);
      /* Smooth attack and release to avoid clicks */
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime((vol || FEEDBACK_VOLUME), startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch (e) { /* Audio not available */ }
  }

  /**
   * Spawn a ripple effect on an element.
   * @param {Event|Element} evtOrEl - Click event or element
   */
  function spawnRipple(evtOrEl) {
    var el = evtOrEl.currentTarget || evtOrEl.target || evtOrEl;
    if (!el || !el.getBoundingClientRect) return;
    var rect = el.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'fb-ripple';
    var size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + 'px';
    if (evtOrEl.clientX) {
      ripple.style.left = (evtOrEl.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (evtOrEl.clientY - rect.top - size / 2) + 'px';
    } else {
      ripple.style.left = (rect.width / 2 - size / 2) + 'px';
      ripple.style.top = (rect.height / 2 - size / 2) + 'px';
    }
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 500);
  }

  /**
   * Bounce-scale an element.
   * @param {Element} el - The element to bounce
   * @param {string} [intensity] - 'sm', 'md', 'lg'
   */
  function bounceEl(el, intensity) {
    if (!el) return;
    var cls = 'fb-bounce-' + (intensity || 'sm');
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 400);
  }

  /**
   * Flash-pulse an element with a glow.
   * @param {Element} el - The element to pulse
   */
  function pulseEl(el) {
    if (!el) return;
    el.classList.add('fb-pulse');
    setTimeout(function () { el.classList.remove('fb-pulse'); }, 600);
  }

  /** Combined Haptic feedback object — each method triggers vibration + sound + visual */
  var Haptic = {
    supported: 'vibrate' in navigator,

    /** Light tap — nav, small buttons */
    tap: function (evt) {
      if (this.supported) navigator.vibrate(8);
      playTone(800, 0.06, 'sine', 0.08);
      if (evt) spawnRipple(evt);
    },

    /** Medium tap — rating, checkbox, color pick */
    select: function (evt) {
      if (this.supported) navigator.vibrate(15);
      playTone(900, 0.05, 'sine', 0.1);
      playTone(1200, 0.06, 'sine', 0.1, 0.04);
      if (evt) spawnRipple(evt);
    },

    /** Success — save, complete */
    success: function (el) {
      if (this.supported) navigator.vibrate([20, 40, 20]);
      playTone(660, 0.1, 'sine', 0.12);
      playTone(880, 0.15, 'sine', 0.14, 0.1);
      playTone(1100, 0.12, 'sine', 0.1, 0.22);
      if (el) bounceEl(el, 'md');
    },

    /** Achievement — badge unlocked */
    achievement: function () {
      if (this.supported) navigator.vibrate([30, 50, 30, 50, 60]);
      playTone(523, 0.12, 'triangle', 0.14);
      playTone(659, 0.12, 'triangle', 0.14, 0.12);
      playTone(784, 0.12, 'triangle', 0.14, 0.24);
      playTone(1047, 0.25, 'triangle', 0.18, 0.36);
    },

    /** Celebration — check-in done, confetti */
    celebration: function () {
      if (this.supported) navigator.vibrate([40, 30, 40, 30, 40, 60, 80]);
      playTone(523, 0.1, 'triangle', 0.12);
      playTone(659, 0.1, 'triangle', 0.12, 0.08);
      playTone(784, 0.1, 'triangle', 0.12, 0.16);
      playTone(1047, 0.1, 'triangle', 0.14, 0.24);
      playTone(1319, 0.3, 'sine', 0.16, 0.34);
    },

    /** Error — validation fail */
    error: function (el) {
      if (this.supported) navigator.vibrate([80, 40, 80]);
      playTone(200, 0.15, 'square', 0.08);
      playTone(150, 0.2, 'square', 0.06, 0.12);
      if (el) {
        el.classList.add('fb-shake');
        setTimeout(function () { el.classList.remove('fb-shake'); }, 500);
      }
    },

    /** Breathing exercise phase transition */
    breathe: function () {
      if (this.supported) navigator.vibrate(12);
      playTone(440, 0.3, 'sine', 0.06);
    },

    /** Streak milestone */
    streak: function () {
      if (this.supported) navigator.vibrate([15, 30, 40]);
      playTone(600, 0.08, 'sine', 0.1);
      playTone(900, 0.12, 'sine', 0.12, 0.08);
    }
  };

  /* ========== App State ========== */
  var state = {
    currentScreen: 'home',
    checkinStep: 0,
    checkinData: {},
    chatMessages: [],
    reminderInterval: null,
    petSpeechTimer: null
  };

  /** Check-in steps configuration */
  var CHECKIN_STEPS = [
    { field: 'mood', questionKey: 'checkin_mood', type: 'rating' },
    { field: 'physical', questionKey: 'checkin_physical', type: 'rating' },
    { field: 'sleep', questionKey: 'checkin_sleep', type: 'rating' },
    { field: 'nutrition', questionKey: 'checkin_nutrition', type: 'rating' },
    { field: 'stress', questionKey: 'checkin_stress', type: 'rating' },
    { field: 'symptoms', questionKey: 'checkin_symptoms', type: 'text' }
  ];

  /* ========== Initialization ========== */

  /**
   * Bootstrap the application.
   * Initializes storage, checks onboarding state, registers service worker.
   */
  function init() {
    registerServiceWorker();

    /* Apply saved theme immediately to avoid flash */
    applyTheme();

    /* Keyboard detection for iOS — hide nav bar, resize chat */
    setupKeyboardHandling();

    Storage.init().then(function () {
      var lang = Storage.getPref('language', null);
      var onboarded = Storage.getPref('onboarded', false);

      if (lang && onboarded) {
        UI.setLanguage(lang);
        showApp();
      } else {
        showOnboarding();
      }
    }).catch(function (err) {
      console.error('Failed to initialize database:', err);
    });
  }

  /**
   * Register the service worker for offline support and caching.
   */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function (reg) {
        console.log('Service Worker registered, scope:', reg.scope);
      }).catch(function (err) {
        console.warn('SW registration failed:', err);
      });
    }
  }

  /**
   * Detect virtual keyboard open/close on iOS and Android.
   * Uses the Visual Viewport API to track viewport height changes.
   * When the keyboard opens, adds a 'keyboard-open' class to body
   * and sets a CSS custom property --vv-height for layout adjustments.
   */
  function setupKeyboardHandling() {
    var lastKeyboardState = false;

    function setKeyboardOpen(open) {
      if (open === lastKeyboardState) return;
      lastKeyboardState = open;

      if (open) {
        document.body.classList.add('keyboard-open');
        /* Scroll chat messages to bottom */
        setTimeout(function () {
          var chatMsgs = document.getElementById('chat-messages');
          if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;
        }, 80);
      } else {
        document.body.classList.remove('keyboard-open');
      }
    }

    /* Primary: Visual Viewport API (best on iOS) */
    if (window.visualViewport) {
      var stableHeight = window.visualViewport.height;

      window.visualViewport.addEventListener('resize', function () {
        var vv = window.visualViewport;
        document.documentElement.style.setProperty('--vv-height', vv.height + 'px');

        /* If viewport shrank by > 150px, keyboard is likely open */
        var diff = stableHeight - vv.height;
        if (diff > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
          /* Update stable height when keyboard closes (handles rotation) */
          stableHeight = vv.height;
        }
      });
    }

    /* Fallback: focus/blur detection */
    document.addEventListener('focusin', function (e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        setTimeout(function () {
          var chatMsgs = document.getElementById('chat-messages');
          if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;
        }, 350);
      }
    });

    document.addEventListener('focusout', function () {
      setTimeout(function () {
        var tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          setKeyboardOpen(false);
        }
      }, 150);
    });
  }

  /* ========== Onboarding ========== */

  /**
   * Display the language selection onboarding screen.
   */
  function showOnboarding() {
    document.getElementById('screen-onboarding').classList.add('active');
    document.getElementById('app-shell').classList.remove('visible');

    document.getElementById('btn-lang-en').addEventListener('click', function () {
      selectLanguage('en');
    });
    document.getElementById('btn-lang-nl').addEventListener('click', function () {
      selectLanguage('nl');
    });
  }

  /**
   * Process language selection and transition to the main app.
   * @param {string} lang - Selected language code
   */
  function selectLanguage(lang) {
    Haptic.success();
    UI.setLanguage(lang);
    Storage.setPref('language', lang);
    Storage.setPref('onboarded', true);
    showApp();
  }

  /* ========== App Shell ========== */

  /**
   * Transition from onboarding to the main app shell.
   * Sets up navigation, icons, and renders the home screen.
   */
  function showApp() {
    document.getElementById('screen-onboarding').classList.remove('active');
    var shell = document.getElementById('app-shell');
    shell.classList.add('visible');

    setupNavigation();
    setupHeader();
    navigateTo('home');
    scheduleReminder();
  }

  /**
   * Set up bottom navigation icons and labels.
   */
  function setupNavigation() {
    document.getElementById('nav-icon-home').innerHTML = UI.icon('home');
    document.getElementById('nav-icon-checkin').innerHTML = UI.icon('checkin');
    document.getElementById('nav-icon-mind').innerHTML = UI.icon('mind');
    document.getElementById('nav-icon-insights').innerHTML = UI.icon('insights');
    document.getElementById('nav-icon-chat').innerHTML = UI.icon('chat');

    updateNavLabels();

    var navBtns = document.querySelectorAll('#bottom-nav button');
    for (var i = 0; i < navBtns.length; i++) {
      navBtns[i].addEventListener('click', function (e) {
        var screen = this.getAttribute('data-screen');
        Haptic.tap(e);
        navigateTo(screen);
      });
    }
  }

  /**
   * Update navigation label texts with current language.
   */
  function updateNavLabels() {
    document.getElementById('nav-label-home').textContent = UI.t('nav_home');
    document.getElementById('nav-label-checkin').textContent = UI.t('nav_checkin');
    document.getElementById('nav-label-mind').textContent = UI.t('nav_mind');
    document.getElementById('nav-label-insights').textContent = UI.t('nav_insights');
    document.getElementById('nav-label-chat').textContent = UI.t('nav_chat');
  }

  /**
   * Configure the header settings button.
   */
  function setupHeader() {
    var settingsBtn = document.getElementById('btn-settings');
    settingsBtn.innerHTML = UI.icon('settings');
    settingsBtn.addEventListener('click', function () {
      navigateTo('settings');
    });
  }

  /**
   * Navigate to a specific screen. Renders the screen content and updates UI.
   * @param {string} screenId - Target screen identifier
   */
  function navigateTo(screenId) {
    state.currentScreen = screenId;
    UI.showScreen(screenId);

    /* Lock outer scroll when on chat screen, unlock for everything else */
    if (screenId === 'chat') {
      document.body.classList.add('chat-active');
      document.documentElement.classList.add('chat-active-html');
    } else {
      document.body.classList.remove('chat-active');
      document.documentElement.classList.remove('chat-active-html');
    }

    var renderers = {
      home: renderHome,
      checkin: renderCheckin,
      mind: renderMind,
      insights: renderInsights,
      chat: renderChat,
      settings: renderSettings,
      reports: renderReports
    };

    if (renderers[screenId]) {
      renderers[screenId]();
    }
  }

  /* ========== Home / Dashboard Screen ========== */

  /**
   * Render the home dashboard with stats, chart, and recent entries.
   */
  function renderHome() {
    var container = document.getElementById('screen-home');

    Promise.all([
      Storage.getTodayCheckIn(),
      Storage.getStreak(),
      Storage.getCheckInCount(),
      Storage.getCheckIns(7),
      Storage.getCheckIns(30),
      Storage.getMetrics(),
      Storage.getCheckIns(),
      Storage.getTodayMetric()
    ]).then(function (results) {
      var todayCheckIn = results[0];
      var streak = results[1];
      var totalCount = results[2];
      var weekCheckins = results[3];
      var recentCheckins = results[4];
      var allMetrics = results[5];
      var allCheckins = results[6];
      var todayMetric = results[7];

      var isDone = !!todayCheckIn;
      var greeting = UI.t(UI.getGreetingKey());

      /* Gamification data */
      var wellnessScore = Insights.calculateWellnessScore(allCheckins);
      var scoreColor = Insights.getScoreColor(wellnessScore);
      var level = Insights.getLevel(totalCount);
      var petState = Insights.getPetState(todayCheckIn, wellnessScore);
      var petSpeech = Insights.getPetSpeech(petState, UI.getLang());
      var streakMult = Insights.getStreakMultiplier(streak);

      /* Quests */
      var quests = Insights.generateDailyQuests();
      var questStatus = Insights.checkQuestCompletion(quests, todayCheckIn, todayMetric);
      var completedQuests = questStatus.filter(function (q) { return q.completed; }).length;
      var totalQuestXP = 0;
      for (var qi = 0; qi < questStatus.length; qi++) totalQuestXP += questStatus[qi].xp;

      /* Achievement data */
      var avgMood = 0, avgStress = 0, avgSleep = 0;
      if (allCheckins.length > 0) {
        var ms = 0, ss = 0, sls = 0;
        for (var c = 0; c < allCheckins.length; c++) {
          ms += allCheckins[c].mood || 0;
          ss += allCheckins[c].stress || 0;
          sls += allCheckins[c].sleep || 0;
        }
        avgMood = ms / allCheckins.length;
        avgStress = ss / allCheckins.length;
        avgSleep = sls / allCheckins.length;
      }
      var achievements = Insights.checkAchievements({
        total: totalCount, streak: streak, metricsCount: allMetrics.length,
        avgMood: avgMood, avgStress: avgStress, avgSleep: avgSleep
      });
      var quote = Insights.getDailyQuote(UI.getLang());

      var html = '';

      /* ---- Greeting ---- */
      html += '<div class="greeting-section">';
      html += '<div class="greeting-text">' + greeting + '</div>';
      html += '<div class="checkin-status ' + (isDone ? 'done' : '') + '">';
      html += isDone
        ? UI.t('mood_emoji_' + (todayCheckIn.mood || 3)) + ' ' + UI.t('dashboard_checkin_done')
        : UI.t('dashboard_checkin_pending');
      html += '</div>';
      html += '</div>';

      /* ---- Pet Zone (THE HERO) ---- */
      html += '<div class="pet-zone" id="pet-zone">';
      html += '<div class="pet-container">';
      html += '<div class="pet-speech" id="pet-speech">' + escapeHtml(petSpeech) + '</div>';
      html += '<div class="pet-body ' + petState + '" id="pet-body">';
      html += '<div class="pet-eyes"><div class="pet-eye left"></div><div class="pet-eye right"></div></div>';
      html += '<div class="pet-mouth ' + petState + '"></div>';
      html += '<div class="pet-cheeks"><div class="pet-cheek"></div><div class="pet-cheek"></div></div>';
      if (petState === 'sleepy') {
        html += '<span class="pet-zzz">z</span><span class="pet-zzz">z</span><span class="pet-zzz">Z</span>';
      }
      html += '</div>';
      html += '<div class="pet-shadow"></div>';
      html += '<div class="pet-info">';
      html += '<div class="pet-name">' + UI.t('pet_name') + '</div>';
      html += '<div class="pet-status">' + UI.t('pet_' + petState) + '</div>';
      html += '</div>';
      html += '<div class="pet-tap-hint">' + UI.t('pet_tap_hint') + '</div>';
      html += '</div>';
      html += '</div>';

      /* ---- Streak + Multiplier Row ---- */
      html += '<div class="streak-multiplier-row">';
      html += '<div class="streak-card-compact ' + (streak === 0 ? 'no-streak' : '') + '">';
      html += '<span class="streak-fire">\uD83D\uDD25</span>';
      html += '<span class="streak-count">' + streak + '</span>';
      html += '<span class="streak-text">' + UI.t('dashboard_streak') + '</span>';
      html += '</div>';
      html += '<div class="multiplier-card ' + (streakMult.multiplier > 1 ? 'active' : 'inactive') + '">';
      html += '<span class="multiplier-value">' + streakMult.label + '</span>';
      html += '<span class="multiplier-label">' + (streakMult.multiplier > 1 ? UI.t('multiplier_label') : UI.t('multiplier_hint')) + '</span>';
      html += '</div>';
      html += '</div>';

      /* ---- Level / XP Card ---- */
      html += '<div class="level-card">';
      html += '<div class="level-header">';
      html += '<div class="level-info">';
      html += '<span class="level-icon">' + level.icon + '</span>';
      html += '<span class="level-name">' + UI.t('level_title') + ' ' + level.index + ' \u2014 ' + UI.t('level_' + level.index) + '</span>';
      html += '</div>';
      html += '<span class="level-xp">' + level.xp + ' ' + UI.t('xp_label') + '</span>';
      html += '</div>';
      html += '<div class="level-bar"><div class="level-fill" id="level-fill" style="width: 0%"></div></div>';
      if (level.isMax) {
        html += '<span class="level-subtext">' + UI.t('xp_max') + '</span>';
      } else {
        html += '<span class="level-subtext">' + (level.nextXp - level.xp) + ' ' + UI.t('xp_label') + ' ' + UI.t('xp_to_next') + '</span>';
      }
      html += '</div>';

      /* ---- Daily Quests ---- */
      var allQuestsDone = completedQuests === questStatus.length;
      html += '<div class="quests-card ' + (allQuestsDone ? 'all-done' : '') + '">';
      html += '<div class="quests-header">';
      html += '<span class="quests-header-title">\u2694\uFE0F ' + UI.t('quests_title') + '</span>';
      html += '<span class="quests-bonus">' + (allQuestsDone ? '\u2705 ' + UI.t('quests_all_done') : totalQuestXP + ' ' + UI.t('quests_bonus')) + '</span>';
      html += '</div>';
      for (var qj = 0; qj < questStatus.length; qj++) {
        var quest = questStatus[qj];
        html += '<div class="quest-item ' + (quest.completed ? 'completed' : '') + '">';
        html += '<span class="quest-check">' + (quest.completed ? '\u2713' : '') + '</span>';
        html += '<span class="quest-text">' + UI.t(quest.id) + '</span>';
        html += '<span class="quest-xp">+' + quest.xp + '</span>';
        html += '</div>';
      }
      html += '</div>';

      /* ---- Weekly Challenge ---- */
      var weekStart = Insights.getWeekStart();
      var weekCIs = allCheckins.filter(function (ci) { return ci.date >= weekStart; });
      var weekMets = allMetrics.filter(function (mt) { return mt.date >= weekStart; });
      var wcChallenge = Insights.generateWeeklyChallenge();
      var wcProgress = Insights.checkWeeklyChallengeProgress(wcChallenge, weekCIs, weekMets);

      html += '<div class="weekly-challenge-card' + (wcProgress.completed ? ' completed' : '') + '">';
      html += '<div class="wc-header">';
      html += '<span class="wc-header-title">\uD83C\uDFAF ' + UI.t('wc_title') + '</span>';
      html += '<span class="wc-xp">' + (wcProgress.completed ? '\u2705 ' + UI.t('wc_completed') : '+' + wcChallenge.xp + ' ' + UI.t('xp_label')) + '</span>';
      html += '</div>';
      html += '<div class="wc-challenge-text">' + UI.t(wcChallenge.id) + '</div>';
      html += '<div class="wc-progress-bar"><div class="wc-progress-fill" id="wc-fill" style="width: 0%"></div></div>';
      html += '<div class="wc-progress-text"><span>' + wcProgress.current + ' / ' + wcProgress.target + '</span><span>' + wcProgress.percent + '%</span></div>';
      html += '</div>';

      /* ---- Check-in CTA Card ---- */
      if (!isDone) {
        html += '<div class="home-cta-card" id="btn-home-checkin">';
        html += '<div class="home-cta-text">';
        html += '<div class="home-cta-title">' + UI.t('dashboard_btn_checkin') + '</div>';
        html += '<div class="home-cta-subtitle">+' + Insights.XP_PER_CHECKIN + ' ' + UI.t('xp_label') + (streakMult.multiplier > 1 ? ' ' + streakMult.label : '') + '</div>';
        html += '</div>';
        html += '<span class="home-cta-arrow">\u2192</span>';
        html += '</div>';
      } else {
        html += '<button class="btn-secondary" id="btn-home-checkin" style="margin-bottom: var(--space-md);">' + UI.t('dashboard_btn_update') + '</button>';
      }

      /* ---- Mood Week Row ---- */
      html += '<div class="mood-week-card">';
      html += '<div class="mood-week-title">' + UI.t('mood_this_week') + '</div>';
      html += buildMoodWeek(weekCheckins);
      html += '</div>';

      /* ---- Sleep Score ---- */
      var latestSleepQ = todayCheckIn ? (todayCheckIn.sleep || 0) : 0;
      var latestSleepH = todayMetric ? (todayMetric.sleepHours || 0) : 0;
      if (latestSleepQ > 0 || latestSleepH > 0) {
        var sleepScore = Insights.calculateSleepScore(latestSleepQ, latestSleepH);
        var sleepColor = Insights.getScoreColor(sleepScore);
        var sleepTip = Insights.getSleepTips(sleepScore, latestSleepQ, latestSleepH, UI.getLang());
        var sleepCirc = 201.06;
        var sleepOffset = sleepCirc - (sleepCirc * sleepScore / 100);

        html += '<div class="sleep-score-card">';
        html += '<div class="sleep-score-ring">';
        html += '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" class="ring-bg"/>';
        html += '<circle cx="40" cy="40" r="32" class="ring-score" id="sleep-ring" style="stroke: ' + sleepColor + '; stroke-dashoffset: ' + sleepCirc + ';" data-target="' + sleepOffset + '"/>';
        html += '</svg>';
        html += '<div class="sleep-score-number" style="color: ' + sleepColor + '">' + sleepScore + '</div>';
        html += '</div>';
        html += '<div class="sleep-score-info">';
        html += '<div class="sleep-score-title">\uD83D\uDE34 ' + UI.t('sleep_score_title') + '</div>';
        html += '<div class="sleep-score-details">';
        if (latestSleepQ > 0) html += UI.t('sleep_score_quality') + ': ' + latestSleepQ + '/5';
        if (latestSleepQ > 0 && latestSleepH > 0) html += ' \u00b7 ';
        if (latestSleepH > 0) html += UI.t('sleep_score_hours') + ': ' + latestSleepH + 'h';
        html += '</div>';
        html += '<div class="sleep-score-tip">' + escapeHtml(sleepTip) + '</div>';
        html += '</div>';
        html += '</div>';
      }

      /* ---- Achievements ---- */
      html += '<div class="achievements-section">';
      html += '<div class="achievements-header">';
      html += '<span class="achievements-header-title">\uD83C\uDFC6 ' + UI.t('achievements_title') + '</span>';
      html += '<span class="achievements-count">' + achievements.unlocked.length + '/' + (achievements.unlocked.length + achievements.locked.length) + '</span>';
      html += '</div>';
      html += '<div class="achievements-scroll">';
      for (var u = 0; u < achievements.unlocked.length; u++) {
        html += '<div class="achievement-badge unlocked"><span class="achievement-icon">' + achievements.unlocked[u].icon + '</span><span class="achievement-name">' + UI.t('achievement_' + achievements.unlocked[u].id) + '</span></div>';
      }
      for (var la = 0; la < achievements.locked.length; la++) {
        html += '<div class="achievement-badge locked"><span class="achievement-icon">\uD83D\uDD12</span><span class="achievement-name">' + UI.t('achievement_' + achievements.locked[la].id) + '</span></div>';
      }
      html += '</div>';
      html += '</div>';

      /* ---- Quote Card ---- */
      html += '<div class="quote-card">';
      html += '<span class="quote-icon">\u201C</span>';
      html += '<div class="quote-label">' + UI.t('daily_quote') + '</div>';
      html += '<div class="quote-text">' + escapeHtml(quote) + '</div>';
      html += '</div>';

      /* ---- Metrics (collapsible) ---- */
      html += '<div class="metrics-card-toggle" id="metrics-toggle">';
      html += '<span class="metrics-card-toggle-text">\uD83D\uDCCA ' + UI.t('dashboard_metrics_title') + '</span>';
      html += '<span class="metrics-card-toggle-icon" id="metrics-toggle-icon">\u25BC</span>';
      html += '</div>';
      html += '<div class="metrics-card-body hidden" id="metrics-body">';
      html += '<div class="metrics-form" id="metrics-form">';
      html += '<div class="form-group"><label class="form-label">' + UI.t('metrics_weight') + '</label><input type="number" step="0.1" min="0" max="500" id="input-weight" placeholder="0.0"></div>';
      html += '<div class="form-group"><label class="form-label">' + UI.t('metrics_sleep_hours') + '</label><input type="number" step="0.5" min="0" max="24" id="input-sleep-hours" placeholder="0"></div>';
      html += '<div class="form-group"><label class="form-label">' + UI.t('metrics_workout') + '</label><input type="number" step="1" min="0" max="600" id="input-workout" placeholder="0"></div>';
      html += '<button class="btn-secondary" id="btn-save-metrics" style="margin-top: var(--space-sm);">' + UI.t('metrics_save') + '</button>';
      html += '</div>';
      html += '</div>';

      /* ---- Medication Reminders ---- */
      var meds = JSON.parse(localStorage.getItem('hp_medications') || '[]');
      var todayDate = new Date();
      var medsDateKey = 'hp_meds_taken_' + todayDate.getFullYear() + '-' + String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + String(todayDate.getDate()).padStart(2, '0');
      var medsTaken = JSON.parse(localStorage.getItem(medsDateKey) || '{}');
      var medsTakenCount = 0;
      for (var mi = 0; mi < meds.length; mi++) { if (medsTaken[meds[mi].id]) medsTakenCount++; }
      var allMedsDone = meds.length > 0 && medsTakenCount === meds.length;

      html += '<div class="meds-card-toggle" id="meds-toggle">';
      html += '<span class="meds-card-toggle-text">\uD83D\uDC8A ' + UI.t('meds_title') + '</span>';
      if (meds.length > 0) {
        html += '<span class="meds-card-toggle-badge' + (allMedsDone ? ' all-done' : '') + '">' + (allMedsDone ? '\u2705 ' + UI.t('meds_all_taken') : medsTakenCount + '/' + meds.length + ' ' + UI.t('meds_taken')) + '</span>';
      }
      html += '<span class="meds-card-toggle-icon" id="meds-toggle-icon">\u25BC</span>';
      html += '</div>';
      html += '<div class="meds-card-body hidden" id="meds-body">';
      if (meds.length === 0) {
        html += '<div class="meds-empty">' + UI.t('meds_empty') + '</div>';
      } else {
        for (var mj = 0; mj < meds.length; mj++) {
          var med = meds[mj];
          var isTaken = !!medsTaken[med.id];
          html += '<div class="med-item' + (isTaken ? ' taken' : '') + '" data-med-id="' + med.id + '">';
          html += '<div class="med-check' + (isTaken ? ' taken' : '') + '" data-med-toggle="' + med.id + '">' + (isTaken ? '\u2713' : '') + '</div>';
          html += '<div class="med-info">';
          html += '<div class="med-name">' + escapeHtml(med.name) + '</div>';
          html += '<div class="med-detail">' + escapeHtml(med.dose) + ' \u00b7 ' + med.time + '</div>';
          html += '</div>';
          html += '<button class="med-delete" data-med-delete="' + med.id + '">' + UI.icon('trash') + '</button>';
          html += '</div>';
        }
      }
      html += '<button class="meds-add-btn" id="btn-add-med">+ ' + UI.t('meds_add') + '</button>';
      html += '<div class="hidden" id="med-add-form-container"></div>';
      html += '</div>';

      /* ---- Recent Entries ---- */
      if (recentCheckins.length > 0) {
        html += '<div class="card" style="margin-top: var(--space-md);">';
        html += '<div class="card-title">' + UI.t('dashboard_recent') + '</div>';
        html += '<ul class="entry-list">';
        var recent = recentCheckins.slice(-5).reverse();
        for (var j = 0; j < recent.length; j++) {
          var entry = recent[j];
          html += '<li class="entry-item">';
          html += '<span class="entry-emoji">' + UI.t('mood_emoji_' + (entry.mood || 3)) + '</span>';
          html += '<div class="entry-info"><div class="entry-date">' + UI.formatDate(entry.date) + '</div>';
          html += '<div class="entry-summary">' + UI.t('mood_' + entry.mood) + ' \u00b7 ' + UI.t('sleep_' + entry.sleep) + ' \u00b7 ' + UI.t('stress_' + entry.stress) + '</div></div>';
          html += '</li>';
        }
        html += '</ul></div>';
      }

      container.innerHTML = html;

      /* ---- Bind events ---- */
      document.getElementById('btn-home-checkin').addEventListener('click', function () {
        navigateTo('checkin');
      });

      /* Pet tap interaction */
      document.getElementById('pet-zone').addEventListener('click', function () {
        var body = document.getElementById('pet-body');
        var speech = document.getElementById('pet-speech');
        body.classList.remove('tapped');
        void body.offsetWidth;
        body.classList.add('tapped');
        speech.textContent = Insights.getPetTapSpeech(UI.getLang());
        speech.classList.add('visible');
        if (navigator.vibrate) navigator.vibrate(30);
        clearTimeout(state.petSpeechTimer);
        state.petSpeechTimer = setTimeout(function () {
          speech.classList.remove('visible');
        }, 3000);
      });

      /* Show pet speech on load with a delay */
      setTimeout(function () {
        var speech = document.getElementById('pet-speech');
        if (speech) {
          speech.classList.add('visible');
          setTimeout(function () { speech.classList.remove('visible'); }, 4000);
        }
      }, 600);

      /* Metrics toggle */
      document.getElementById('metrics-toggle').addEventListener('click', function () {
        var body = document.getElementById('metrics-body');
        var icon = document.getElementById('metrics-toggle-icon');
        body.classList.toggle('hidden');
        icon.classList.toggle('open');
      });

      var saveBtn = document.getElementById('btn-save-metrics');
      if (saveBtn) saveBtn.addEventListener('click', saveMetrics);

      /* Pre-fill metrics */
      if (todayMetric) {
        var wEl = document.getElementById('input-weight');
        var sEl = document.getElementById('input-sleep-hours');
        var wkEl = document.getElementById('input-workout');
        if (wEl && todayMetric.weight) wEl.value = todayMetric.weight;
        if (sEl && todayMetric.sleepHours) sEl.value = todayMetric.sleepHours;
        if (wkEl && todayMetric.workoutMinutes) wkEl.value = todayMetric.workoutMinutes;
      }

      /* Animate level bar */
      setTimeout(function () {
        var fill = document.getElementById('level-fill');
        if (fill) fill.style.width = Math.round(level.progress * 100) + '%';
      }, 200);

      /* Animate weekly challenge bar */
      setTimeout(function () {
        var wcFill = document.getElementById('wc-fill');
        if (wcFill) wcFill.style.width = wcProgress.percent + '%';
      }, 300);

      /* Animate sleep score ring */
      setTimeout(function () {
        var sleepRing = document.getElementById('sleep-ring');
        if (sleepRing) sleepRing.style.strokeDashoffset = sleepRing.getAttribute('data-target');
      }, 400);

      /* Meds toggle */
      document.getElementById('meds-toggle').addEventListener('click', function () {
        var body = document.getElementById('meds-body');
        var icon = document.getElementById('meds-toggle-icon');
        body.classList.toggle('hidden');
        icon.classList.toggle('open');
      });

      /* Meds checkboxes */
      var medChecks = document.querySelectorAll('[data-med-toggle]');
      for (var mc = 0; mc < medChecks.length; mc++) {
        medChecks[mc].addEventListener('click', function (e) {
          var medId = this.getAttribute('data-med-toggle');
          var taken = JSON.parse(localStorage.getItem(medsDateKey) || '{}');
          taken[medId] = !taken[medId];
          Haptic.select(e);
          localStorage.setItem(medsDateKey, JSON.stringify(taken));
          renderHome();
        });
      }

      /* Med delete buttons */
      var medDeletes = document.querySelectorAll('[data-med-delete]');
      for (var md = 0; md < medDeletes.length; md++) {
        medDeletes[md].addEventListener('click', function (e) {
          e.stopPropagation();
          var medId = this.getAttribute('data-med-delete');
          var curMeds = JSON.parse(localStorage.getItem('hp_medications') || '[]');
          curMeds = curMeds.filter(function (m) { return m.id !== medId; });
          localStorage.setItem('hp_medications', JSON.stringify(curMeds));
          renderHome();
        });
      }

      /* Add medication button */
      var addMedBtn = document.getElementById('btn-add-med');
      if (addMedBtn) {
        addMedBtn.addEventListener('click', function () {
          var formContainer = document.getElementById('med-add-form-container');
          if (formContainer.classList.contains('hidden')) {
            formContainer.classList.remove('hidden');
            formContainer.innerHTML = '<div class="med-add-form">' +
              '<input type="text" id="med-input-name" placeholder="' + UI.t('meds_name') + '">' +
              '<div class="med-add-form-row">' +
              '<input type="text" id="med-input-dose" placeholder="' + UI.t('meds_dose') + '">' +
              '<input type="time" id="med-input-time" value="09:00" style="max-width: 120px;">' +
              '</div>' +
              '<div class="med-add-form-actions">' +
              '<button class="btn-secondary" id="med-cancel">' + UI.t('btn_cancel') + '</button>' +
              '<button class="btn-primary" id="med-save">' + UI.t('meds_save') + '</button>' +
              '</div></div>';

            document.getElementById('med-cancel').addEventListener('click', function () {
              formContainer.classList.add('hidden');
              formContainer.innerHTML = '';
            });

            document.getElementById('med-save').addEventListener('click', function () {
              var name = document.getElementById('med-input-name').value.trim();
              var dose = document.getElementById('med-input-dose').value.trim();
              var time = document.getElementById('med-input-time').value;
              if (!name) return;
              var curMeds = JSON.parse(localStorage.getItem('hp_medications') || '[]');
              curMeds.push({ id: 'med_' + Date.now(), name: name, dose: dose || '-', time: time || '09:00' });
              localStorage.setItem('hp_medications', JSON.stringify(curMeds));
              Haptic.success();
              UI.showToast(UI.t('meds_added'), 'success');
              renderHome();
            });
          } else {
            formContainer.classList.add('hidden');
            formContainer.innerHTML = '';
          }
        });
      }
    });
  }

  /**
   * Build the mood week row showing each day of the current week with mood emoji dots.
   * @param {Array} weekCheckins - This week's check-in records
   * @returns {string} HTML string for the mood week row
   */
  function buildMoodWeek(weekCheckins) {
    var dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    var moodColors = ['', '#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
    var dateMap = {};

    for (var i = 0; i < weekCheckins.length; i++) {
      dateMap[weekCheckins[i].date] = weekCheckins[i];
    }

    /* Get the Monday of the current week */
    var today = new Date();
    var todayDay = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - ((todayDay + 6) % 7));

    var html = '<div class="mood-week-row">';

    for (var d = 0; d < 7; d++) {
      var date = new Date(monday);
      date.setDate(monday.getDate() + d);
      var year = date.getFullYear();
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var day = String(date.getDate()).padStart(2, '0');
      var dateStr = year + '-' + month + '-' + day;
      var dayOfWeek = date.getDay();
      var isToday = dateStr === (today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'));
      var checkin = dateMap[dateStr];

      html += '<div class="mood-day-item">';
      if (checkin && checkin.mood) {
        var bgColor = moodColors[checkin.mood] || '#ccc';
        html += '<div class="mood-day-circle filled' + (isToday ? ' today' : '') + '" style="background: ' + bgColor + '">';
        html += UI.t('mood_emoji_' + checkin.mood);
        html += '</div>';
      } else {
        html += '<div class="mood-day-circle empty' + (isToday ? ' today' : '') + '">';
        html += isToday ? '\u2022' : '';
        html += '</div>';
      }
      html += '<span class="mood-day-name' + (isToday ? ' today' : '') + '">' + UI.t(dayKeys[dayOfWeek]) + '</span>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Save metrics from the dashboard quick-input form.
   */
  function saveMetrics() {
    var weightEl = document.getElementById('input-weight');
    var sleepEl = document.getElementById('input-sleep-hours');
    var workoutEl = document.getElementById('input-workout');
    if (!weightEl) return;

    var weight = parseFloat(weightEl.value) || 0;
    var sleepHours = parseFloat(sleepEl.value) || 0;
    var workoutMinutes = parseInt(workoutEl.value, 10) || 0;

    if (weight === 0 && sleepHours === 0 && workoutMinutes === 0) return;

    Storage.saveMetric({
      weight: weight,
      sleepHours: sleepHours,
      workoutMinutes: workoutMinutes
    }).then(function () {
      Haptic.success();
      UI.showToast(UI.t('metrics_saved'), 'success');
    });
  }

  /* ========== Check-in Flow ========== */

  /**
   * Render the check-in screen. Starts or continues the step-by-step flow.
   */
  function renderCheckin() {
    state.checkinStep = 0;
    state.checkinData = {};
    renderCheckinStep();
  }

  /**
   * Render a single step of the check-in flow.
   */
  function renderCheckinStep() {
    var container = document.getElementById('screen-checkin');
    var step = CHECKIN_STEPS[state.checkinStep];
    var totalSteps = CHECKIN_STEPS.length;
    var progress = Math.round(((state.checkinStep + 1) / totalSteps) * 100);

    var html = '';

    /* Progress Bar */
    html += '<div class="checkin-progress">';
    html += '<div class="progress-bar"><div class="progress-fill" style="width: ' + progress + '%"></div></div>';
    html += '<span class="progress-text">' + UI.t('checkin_step') + ' ' + (state.checkinStep + 1) + ' ' + UI.t('checkin_of') + ' ' + totalSteps + '</span>';
    html += '</div>';

    /* Question */
    html += '<h2 class="checkin-question">' + UI.t(step.questionKey) + '</h2>';

    /* Input Area */
    if (step.type === 'rating') {
      html += UI.createRatingSelector(step.field, state.checkinData[step.field]);
    } else if (step.type === 'text') {
      var val = state.checkinData[step.field] || '';
      html += '<textarea id="checkin-textarea" placeholder="' + UI.t('checkin_symptoms_placeholder') + '">' + escapeHtml(val) + '</textarea>';
    }

    /* Navigation Buttons */
    html += '<div class="checkin-nav">';
    if (state.checkinStep > 0) {
      html += '<button class="btn-secondary" id="btn-checkin-prev">' + UI.t('checkin_prev') + '</button>';
    } else {
      html += '<button class="btn-secondary" id="btn-checkin-cancel">' + UI.t('checkin_cancel') + '</button>';
    }

    if (state.checkinStep < totalSteps - 1) {
      html += '<button class="btn-primary" id="btn-checkin-next">' + UI.t('checkin_next') + '</button>';
    } else {
      html += '<button class="btn-primary" id="btn-checkin-submit">' + UI.t('checkin_submit') + '</button>';
    }
    html += '</div>';

    container.innerHTML = html;

    /* Bind events */
    bindRatingButtons();

    var prevBtn = document.getElementById('btn-checkin-prev');
    var nextBtn = document.getElementById('btn-checkin-next');
    var submitBtn = document.getElementById('btn-checkin-submit');
    var cancelBtn = document.getElementById('btn-checkin-cancel');

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        Haptic.tap(e);
        saveCurrentStepData();
        state.checkinStep--;
        renderCheckinStep();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        if (validateCurrentStep()) {
          Haptic.tap(e);
          saveCurrentStepData();
          state.checkinStep++;
          renderCheckinStep();
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        Haptic.select(e);
        saveCurrentStepData();
        submitCheckIn();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        navigateTo('home');
      });
    }
  }

  /**
   * Bind click handlers to rating selector buttons.
   */
  function bindRatingButtons() {
    var ratingBtns = document.querySelectorAll('.rating-btn');
    for (var i = 0; i < ratingBtns.length; i++) {
      ratingBtns[i].addEventListener('click', function (e) {
        var value = parseInt(this.getAttribute('data-value'), 10);
        var selector = this.closest('.rating-selector');
        var field = selector.getAttribute('data-field');

        /* Deselect all */
        var siblings = selector.querySelectorAll('.rating-btn');
        for (var j = 0; j < siblings.length; j++) {
          siblings[j].classList.remove('selected');
        }
        this.classList.add('selected');
        state.checkinData[field] = value;
        Haptic.select(e);
      });
    }
  }

  /**
   * Save the current step's data to the check-in state.
   */
  function saveCurrentStepData() {
    var step = CHECKIN_STEPS[state.checkinStep];
    if (step.type === 'text') {
      var textarea = document.getElementById('checkin-textarea');
      if (textarea) {
        state.checkinData[step.field] = textarea.value;
      }
    }
  }

  /**
   * Validate the current check-in step has required data.
   * @returns {boolean} True if valid
   */
  function validateCurrentStep() {
    var step = CHECKIN_STEPS[state.checkinStep];
    if (step.type === 'rating' && !state.checkinData[step.field]) {
      UI.showToast(UI.t(step.questionKey), 'info');
      var stepCard = document.querySelector('.checkin-step-card') || document.getElementById('app-content');
      Haptic.error(stepCard);
      return false;
    }
    return true;
  }

  /**
   * Submit the completed check-in to storage and show celebration.
   */
  function submitCheckIn() {
    /* Capture pre-submission achievements for comparison */
    var prevAchievements = null;

    Promise.all([
      Storage.getStreak(),
      Storage.getCheckInCount(),
      Storage.getCheckIns(),
      Storage.getMetrics()
    ]).then(function (before) {
      var prevStreak = before[0];
      var prevTotal = before[1];
      var prevCheckins = before[2];
      var prevMetrics = before[3];

      var prevAvgMood = 0, prevAvgStress = 0, prevAvgSleep = 0;
      if (prevCheckins.length > 0) {
        var ms = 0, ss = 0, sls = 0;
        for (var i = 0; i < prevCheckins.length; i++) {
          ms += prevCheckins[i].mood || 0;
          ss += prevCheckins[i].stress || 0;
          sls += prevCheckins[i].sleep || 0;
        }
        prevAvgMood = ms / prevCheckins.length;
        prevAvgStress = ss / prevCheckins.length;
        prevAvgSleep = sls / prevCheckins.length;
      }

      prevAchievements = Insights.checkAchievements({
        total: prevTotal,
        streak: prevStreak,
        metricsCount: prevMetrics.length,
        avgMood: prevAvgMood,
        avgStress: prevAvgStress,
        avgSleep: prevAvgSleep
      });

      return Storage.saveCheckIn(state.checkinData);
    }).then(function () {
      state.checkinData = {};
      state.checkinStep = 0;

      /* Get post-submission data for celebration */
      return Promise.all([
        Storage.getStreak(),
        Storage.getCheckInCount(),
        Storage.getCheckIns(),
        Storage.getMetrics()
      ]);
    }).then(function (after) {
      var newStreak = after[0];
      var newTotal = after[1];
      var newCheckins = after[2];
      var newMetrics = after[3];

      var newAvgMood = 0, newAvgStress = 0, newAvgSleep = 0;
      if (newCheckins.length > 0) {
        var ms2 = 0, ss2 = 0, sls2 = 0;
        for (var k = 0; k < newCheckins.length; k++) {
          ms2 += newCheckins[k].mood || 0;
          ss2 += newCheckins[k].stress || 0;
          sls2 += newCheckins[k].sleep || 0;
        }
        newAvgMood = ms2 / newCheckins.length;
        newAvgStress = ss2 / newCheckins.length;
        newAvgSleep = sls2 / newCheckins.length;
      }

      var newAchievementsList = Insights.checkAchievements({
        total: newTotal,
        streak: newStreak,
        metricsCount: newMetrics.length,
        avgMood: newAvgMood,
        avgStress: newAvgStress,
        avgSleep: newAvgSleep
      });

      /* Find newly unlocked achievements */
      var prevIds = {};
      if (prevAchievements) {
        for (var p = 0; p < prevAchievements.unlocked.length; p++) {
          prevIds[prevAchievements.unlocked[p].id] = true;
        }
      }
      var newBadges = [];
      for (var n = 0; n < newAchievementsList.unlocked.length; n++) {
        if (!prevIds[newAchievementsList.unlocked[n].id]) {
          newBadges.push(newAchievementsList.unlocked[n]);
        }
      }

      var wellnessScore = Insights.calculateWellnessScore(newCheckins);

      renderCelebration({
        streak: newStreak,
        xpEarned: Insights.XP_PER_CHECKIN,
        totalXp: newTotal * Insights.XP_PER_CHECKIN,
        wellnessScore: wellnessScore,
        newBadges: newBadges,
        isFirst: newTotal === 1
      });
    });
  }

  /**
   * Render a full-screen celebration overlay after a check-in.
   * Shows XP earned, streak, wellness score, and any new badges.
   * @param {Object} data - Celebration data
   */
  function renderCelebration(data) {
    var overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.id = 'celebration-overlay';

    var moodEmoji = '\uD83C\uDF89';
    var subtitle = UI.t('celebration_great');
    if (data.isFirst) {
      subtitle = UI.t('celebration_first');
      moodEmoji = '\uD83C\uDF1F';
    } else if (data.streak >= 7) {
      subtitle = UI.t('celebration_keep_going');
      moodEmoji = '\uD83D\uDE80';
    }

    var scoreColor = Insights.getScoreColor(data.wellnessScore);

    var html = '';
    html += '<div class="celebration-emoji">' + moodEmoji + '</div>';
    html += '<h2 class="celebration-title">' + UI.t('celebration_title') + '</h2>';
    html += '<p class="celebration-subtitle">' + subtitle + '</p>';

    html += '<div class="celebration-stats">';
    html += '<div class="celebration-stat">';
    html += '<span class="celebration-stat-icon">\u2728</span>';
    html += '<span class="celebration-stat-value">+' + data.xpEarned + '</span>';
    html += '<span class="celebration-stat-label">' + UI.t('celebration_xp_earned') + '</span>';
    html += '</div>';
    html += '<div class="celebration-stat">';
    html += '<span class="celebration-stat-icon">\uD83D\uDD25</span>';
    html += '<span class="celebration-stat-value">' + data.streak + '</span>';
    html += '<span class="celebration-stat-label">' + UI.t('celebration_streak') + '</span>';
    html += '</div>';
    if (data.wellnessScore > 0) {
      html += '<div class="celebration-stat">';
      html += '<span class="celebration-stat-icon">\u2764\uFE0F</span>';
      html += '<span class="celebration-stat-value" style="color: ' + scoreColor + '">' + data.wellnessScore + '</span>';
      html += '<span class="celebration-stat-label">' + UI.t('wellness_score') + '</span>';
      html += '</div>';
    }
    html += '</div>';

    /* New achievement badges */
    if (data.newBadges && data.newBadges.length > 0) {
      html += '<div class="celebration-badge-section">';
      html += '<div class="celebration-badge-title">' + UI.t('celebration_new_badge') + '</div>';
      for (var b = 0; b < data.newBadges.length; b++) {
        var badge = data.newBadges[b];
        html += '<div class="celebration-badge-item">';
        html += '<span class="celebration-badge-icon">' + badge.icon + '</span>';
        html += '<span class="celebration-badge-name">' + UI.t('achievement_' + badge.id) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '<button class="celebration-btn" id="celebration-continue">' + UI.t('celebration_continue') + '</button>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    /* Haptic celebration burst */
    if (data.newBadges && data.newBadges.length > 0) {
      Haptic.achievement();
    } else {
      Haptic.celebration();
    }

    /* Launch confetti */
    spawnConfetti();

    /* Bind continue button */
    document.getElementById('celebration-continue').addEventListener('click', function (e) {
      Haptic.tap(e);
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        overlay.remove();
        navigateTo('home');
      }, 300);
    });
  }

  /**
   * Spawn a burst of confetti particles across the screen.
   * Creates CSS-animated div elements that fall and rotate.
   */
  function spawnConfetti() {
    var container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    var colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#2196f3', '#00bcd4', '#4caf50', '#8bc34a', '#ffeb3b', '#ff9800'];

    for (var i = 0; i < 80; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 8 + 5) + 'px';
      piece.style.height = (Math.random() * 8 + 5) + 'px';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      piece.style.animationDelay = (Math.random() * 1.5) + 's';
      if (Math.random() > 0.5) {
        piece.style.borderRadius = '50%';
      }
      container.appendChild(piece);
    }

    setTimeout(function () {
      container.remove();
    }, 5000);
  }

  /* ========== Insights Screen ========== */

  /**
   * Render the insights screen with trends, advice, and patterns.
   */
  function renderInsights() {
    var container = document.getElementById('screen-insights');

    Promise.all([
      Storage.getCheckIns(),
      Storage.getMetrics()
    ]).then(function (results) {
      var checkIns = results[0];
      var metrics = results[1];
      var html = '';

      /* Check minimum data requirement */
      if (checkIns.length < 7) {
        html += '<div class="insight-locked">';
        html += '<div class="insight-locked-icon">' + UI.icon('insights') + '</div>';
        html += '<p class="insight-locked-text">' + UI.t('insights_need_more') + '</p>';
        html += '<p class="insight-locked-count">' + checkIns.length + ' ' + UI.t('insights_checkins_count') + '</p>';
        html += '</div>';
        container.innerHTML = html;
        return;
      }

      var trends = Insights.analyzeTrends(checkIns);
      var advice = Insights.generateAdvice(checkIns, metrics);
      var patterns = Insights.detectPatterns(checkIns);

      /* Trends Section */
      html += '<div class="section-title">' + UI.icon('insights') + ' ' + UI.t('insights_trends') + '</div>';
      var fields = ['mood', 'physical', 'sleep', 'nutrition', 'stress'];
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var trend = trends[field];
        if (!trend || trend.average === 0) continue;

        var dirKey = 'insights_' + trend.direction;
        var dirClass = trend.direction;

        html += '<div class="trend-card">';
        html += '<div class="trend-info">';
        html += '<span class="trend-field">' + field.charAt(0).toUpperCase() + field.slice(1) + '</span>';
        html += '<span class="trend-avg">' + UI.t('insights_avg') + ' ' + trend.average + '/5</span>';
        html += '</div>';
        html += '<span class="trend-badge ' + dirClass + '">' + UI.t(dirKey) + '</span>';
        html += '</div>';
      }

      /* Advice Section */
      if (advice.length > 0) {
        html += '<div class="section-title">' + UI.icon('heart') + ' ' + UI.t('insights_advice') + '</div>';
        for (var a = 0; a < advice.length; a++) {
          html += '<div class="advice-card ' + advice[a].type + '">' + advice[a][UI.getLang()] + '</div>';
        }
      }

      /* Patterns Section */
      if (patterns.length > 0) {
        html += '<div class="section-title">' + UI.icon('info') + ' ' + UI.t('insights_patterns') + '</div>';
        for (var p = 0; p < patterns.length; p++) {
          html += '<div class="advice-card ' + patterns[p].type + '">' + patterns[p][UI.getLang()] + '</div>';
        }
      }

      /* Report Link */
      html += '<div style="margin-top: var(--space-lg);">';
      html += '<button class="btn-secondary" id="btn-view-report">' + UI.t('insights_reports') + '</button>';
      html += '</div>';

      container.innerHTML = html;

      document.getElementById('btn-view-report').addEventListener('click', function () {
        navigateTo('reports');
      });
    });
  }

  /* ========== Chat Screen ========== */

  /**
   * Render the chat interface with message history and input.
   */
  /* ========== Mental Health Screen ========== */

  /**
   * Render the mental health/mind screen with breathing exercise,
   * journaling, grounding, affirmations, and crisis resources.
   */
  function renderMind() {
    var container = document.getElementById('screen-mind');
    var lang = UI.getLang();
    var affirmation = Insights.getDailyAffirmation(lang);

    var html = '';

    /* Affirmation Card */
    html += '<div class="mind-affirmation-card">';
    html += '<div class="mind-affirmation-icon">💜</div>';
    html += '<div class="mind-affirmation-label">' + UI.t('mind_affirmation_title') + '</div>';
    html += '<div class="mind-affirmation-text">"' + escapeHtml(affirmation) + '"</div>';
    html += '</div>';

    /* Breathing Exercise */
    html += '<div class="mind-card">';
    html += '<div class="mind-card-header">';
    html += '<span class="mind-card-icon">' + UI.icon('wind') + '</span>';
    html += '<div class="mind-card-title">' + UI.t('mind_breathing_title') + '</div>';
    html += '</div>';
    html += '<p class="mind-card-desc">' + UI.t('mind_breathing_desc') + '</p>';

    /* Ambient Sound Picker */
    var savedSound = Storage.getPref('ambient_sound', 'off');
    html += '<div class="sound-picker">';
    html += '<div class="sound-picker-label">' + UI.t('mind_sounds_title') + '</div>';
    html += '<div class="sound-options" id="sound-options">';
    var sounds = [
      { id: 'off', emoji: '🔇', key: 'mind_sound_off' },
      { id: 'rain', emoji: '🌧️', key: 'mind_sound_rain' },
      { id: 'ocean', emoji: '🌊', key: 'mind_sound_ocean' },
      { id: 'forest', emoji: '🌲', key: 'mind_sound_forest' }
    ];
    for (var si = 0; si < sounds.length; si++) {
      var snd = sounds[si];
      html += '<button class="sound-option' + (savedSound === snd.id ? ' active' : '') + '" data-sound="' + snd.id + '">';
      html += '<span class="sound-option-emoji">' + snd.emoji + '</span>';
      html += UI.t(snd.key);
      html += '</button>';
    }
    html += '</div>';
    var savedVol = Storage.getPref('ambient_volume', 50);
    html += '<div class="sound-volume-row' + (savedSound === 'off' ? ' hidden' : '') + '" id="sound-volume-row">';
    html += '<label>' + UI.t('mind_sound_volume') + '</label>';
    html += '<input type="range" min="0" max="100" value="' + savedVol + '" id="sound-volume">';
    html += '</div>';
    html += '</div>';

    html += '<div class="breathing-zone hidden" id="breathing-zone">';
    html += '<div class="breathing-circle" id="breathing-circle">';
    html += '<div class="breathing-inner" id="breathing-inner">';
    html += '<span class="breathing-text" id="breathing-text">' + UI.t('mind_get_ready') + '</span>';
    html += '<span class="breathing-timer" id="breathing-timer"></span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<button class="btn-primary mind-btn" id="btn-breathing">' + UI.t('mind_breathing_start') + '</button>';
    html += '</div>';

    /* 5-4-3-2-1 Grounding */
    html += '<div class="mind-card">';
    html += '<div class="mind-card-header">';
    html += '<span class="mind-card-icon">' + UI.icon('shield') + '</span>';
    html += '<div class="mind-card-title">' + UI.t('mind_grounding_title') + '</div>';
    html += '</div>';
    html += '<p class="mind-card-desc">' + UI.t('mind_grounding_desc') + '</p>';
    html += '<div class="grounding-zone hidden" id="grounding-zone">';
    html += '<div class="grounding-step" id="grounding-step"></div>';
    html += '<div class="grounding-progress" id="grounding-progress"></div>';
    html += '<button class="btn-primary mind-btn" id="btn-grounding-next">' + UI.t('mind_grounding_next') + '</button>';
    html += '</div>';
    html += '<button class="btn-primary mind-btn" id="btn-grounding">' + UI.t('mind_grounding_start') + '</button>';
    html += '</div>';

    /* Journal */
    html += '<div class="mind-card">';
    html += '<div class="mind-card-header">';
    html += '<span class="mind-card-icon">' + UI.icon('edit') + '</span>';
    html += '<div class="mind-card-title">' + UI.t('mind_journal_title') + '</div>';
    html += '</div>';
    html += '<p class="mind-card-desc">' + UI.t('mind_journal_desc') + '</p>';
    html += '<textarea class="mind-journal-input" id="journal-input" placeholder="' + UI.t('mind_journal_placeholder') + '" rows="4"></textarea>';
    html += '<button class="btn-secondary mind-btn" id="btn-journal-save">' + UI.t('mind_journal_save') + '</button>';

    /* Journal History */
    var entries = JSON.parse(localStorage.getItem('hp_journal') || '[]');
    if (entries.length > 0) {
      html += '<div class="mind-journal-history">';
      html += '<div class="mind-journal-history-title">' + UI.t('mind_journal_history') + '</div>';
      var recent = entries.slice(-5).reverse();
      for (var je = 0; je < recent.length; je++) {
        html += '<div class="mind-journal-entry">';
        html += '<div class="mind-journal-entry-date">' + UI.formatDate(recent[je].date) + '</div>';
        html += '<div class="mind-journal-entry-text">' + escapeHtml(recent[je].text.substring(0, 120)) + (recent[je].text.length > 120 ? '...' : '') + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    /* Crisis Resources */
    html += '<div class="mind-card mind-crisis-card">';
    html += '<div class="mind-card-header">';
    html += '<span class="mind-card-icon crisis">' + UI.icon('phone') + '</span>';
    html += '<div class="mind-card-title mind-crisis-title">' + UI.t('mind_crisis_title') + '</div>';
    html += '</div>';
    html += '<p class="mind-card-desc">' + UI.t('mind_crisis_desc') + '</p>';
    html += '<div class="mind-crisis-lines">';
    html += '<div class="mind-crisis-line"><span class="mind-crisis-name">' + UI.t('mind_crisis_line1') + '</span><span class="mind-crisis-num">' + UI.t('mind_crisis_line1_num') + '</span></div>';
    html += '<div class="mind-crisis-line"><span class="mind-crisis-name">' + UI.t('mind_crisis_line2') + '</span><span class="mind-crisis-num">' + UI.t('mind_crisis_line2_num') + '</span></div>';
    html += '<div class="mind-crisis-line"><span class="mind-crisis-name">' + UI.t('mind_crisis_line3') + '</span><span class="mind-crisis-num">' + UI.t('mind_crisis_line3_num') + '</span></div>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;

    /* Bind events */
    bindAmbientSounds();
    bindBreathingExercise();
    bindGroundingExercise();
    bindJournal();
  }

  /* ========== Ambient Sound URLs (royalty-free loops) ========== */
  var AMBIENT_URLS = {
    rain: 'https://cdn.pixabay.com/audio/2022/10/30/audio_84f6020c2e.mp3',
    ocean: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3',
    forest: 'https://cdn.pixabay.com/audio/2022/02/23/audio_ea70be6f87.mp3'
  };

  /** Global audio element for ambient sounds */
  var ambientAudio = null;

  /** Start playing the selected ambient sound */
  function startAmbientSound() {
    var soundId = Storage.getPref('ambient_sound', 'off');
    if (soundId === 'off' || !AMBIENT_URLS[soundId]) return;
    stopAmbientSound();
    ambientAudio = new Audio(AMBIENT_URLS[soundId]);
    ambientAudio.loop = true;
    ambientAudio.volume = (Storage.getPref('ambient_volume', 50)) / 100;
    ambientAudio.play().catch(function () { /* autoplay blocked - user needs interaction first */ });
  }

  /** Stop ambient sound playback */
  function stopAmbientSound() {
    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio.src = '';
      ambientAudio = null;
    }
  }

  /** Bind ambient sound picker events */
  function bindAmbientSounds() {
    var options = document.querySelectorAll('#sound-options .sound-option');
    var volumeRow = document.getElementById('sound-volume-row');
    var volumeSlider = document.getElementById('sound-volume');

    for (var i = 0; i < options.length; i++) {
      options[i].addEventListener('click', function () {
        var id = this.getAttribute('data-sound');
        Storage.setPref('ambient_sound', id);
        for (var j = 0; j < options.length; j++) options[j].classList.remove('active');
        this.classList.add('active');
        if (id === 'off') {
          volumeRow.classList.add('hidden');
          stopAmbientSound();
        } else {
          volumeRow.classList.remove('hidden');
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', function () {
        Storage.setPref('ambient_volume', parseInt(this.value, 10));
        if (ambientAudio) ambientAudio.volume = parseInt(this.value, 10) / 100;
      });
    }
  }

  /** Breathing exercise controller */
  function bindBreathingExercise() {
    var btn = document.getElementById('btn-breathing');
    var zone = document.getElementById('breathing-zone');
    var circle = document.getElementById('breathing-circle');
    var text = document.getElementById('breathing-text');
    var timer = document.getElementById('breathing-timer');
    var running = false;
    var breathInterval = null;
    var countInterval = null;

    btn.addEventListener('click', function () {
      if (running) {
        running = false;
        clearInterval(breathInterval);
        clearInterval(countInterval);
        zone.classList.add('hidden');
        btn.textContent = UI.t('mind_breathing_start');
        circle.className = 'breathing-circle';
        stopAmbientSound();
        return;
      }
      running = true;
      zone.classList.remove('hidden');
      btn.textContent = UI.t('mind_breathing_stop');
      startAmbientSound();

      function runCycle() {
        if (!running) return;
        /* Breathe in 4s */
        text.textContent = UI.t('mind_breathe_in');
        circle.className = 'breathing-circle expand';
        Haptic.breathe();
        var count = 4;
        timer.textContent = count;
        countInterval = setInterval(function () {
          count--;
          if (count > 0) timer.textContent = count;
        }, 1000);

        setTimeout(function () {
          if (!running) return;
          clearInterval(countInterval);
          /* Hold 7s */
          text.textContent = UI.t('mind_hold');
          circle.className = 'breathing-circle hold';
          Haptic.breathe();
          count = 7;
          timer.textContent = count;
          countInterval = setInterval(function () {
            count--;
            if (count > 0) timer.textContent = count;
          }, 1000);

          setTimeout(function () {
            if (!running) return;
            clearInterval(countInterval);
            /* Breathe out 8s */
            text.textContent = UI.t('mind_breathe_out');
            circle.className = 'breathing-circle shrink';
            Haptic.breathe();
            count = 8;
            timer.textContent = count;
            countInterval = setInterval(function () {
              count--;
              if (count > 0) timer.textContent = count;
            }, 1000);

            setTimeout(function () {
              if (!running) { clearInterval(countInterval); return; }
              clearInterval(countInterval);
              timer.textContent = '';
              runCycle();
            }, 8000);
          }, 7000);
        }, 4000);
      }

      runCycle();
    });
  }

  /** 5-4-3-2-1 grounding exercise controller */
  function bindGroundingExercise() {
    var btn = document.getElementById('btn-grounding');
    var zone = document.getElementById('grounding-zone');
    var stepEl = document.getElementById('grounding-step');
    var progressEl = document.getElementById('grounding-progress');
    var nextBtn = document.getElementById('btn-grounding-next');
    var steps = [
      { key: 'mind_grounding_5', emoji: '👀', count: 5 },
      { key: 'mind_grounding_4', emoji: '✋', count: 4 },
      { key: 'mind_grounding_3', emoji: '👂', count: 3 },
      { key: 'mind_grounding_2', emoji: '👃', count: 2 },
      { key: 'mind_grounding_1', emoji: '👅', count: 1 }
    ];
    var currentStep = 0;

    function renderStep() {
      if (currentStep >= steps.length) {
        stepEl.innerHTML = '<div class="grounding-done">' +
          '<span class="grounding-done-emoji">🌿</span>' +
          '<span class="grounding-done-text">' + UI.t('mind_grounding_done') + '</span>' +
          '</div>';
        nextBtn.classList.add('hidden');
        var dots = '';
        for (var d = 0; d < steps.length; d++) dots += '<span class="grounding-dot filled"></span>';
        progressEl.innerHTML = dots;
        return;
      }
      var s = steps[currentStep];
      stepEl.innerHTML = '<div class="grounding-current">' +
        '<span class="grounding-emoji">' + s.emoji + '</span>' +
        '<span class="grounding-label">' + UI.t(s.key) + '</span>' +
        '</div>';
      var dots = '';
      for (var d = 0; d < steps.length; d++) {
        dots += '<span class="grounding-dot' + (d <= currentStep ? ' filled' : '') + '"></span>';
      }
      progressEl.innerHTML = dots;
    }

    btn.addEventListener('click', function () {
      currentStep = 0;
      zone.classList.remove('hidden');
      btn.classList.add('hidden');
      nextBtn.classList.remove('hidden');
      renderStep();
    });

    nextBtn.addEventListener('click', function () {
      Haptic.select();
      currentStep++;
      renderStep();
    });
  }

  /** Journal save handler */
  function bindJournal() {
    document.getElementById('btn-journal-save').addEventListener('click', function () {
      var input = document.getElementById('journal-input');
      var text = input.value.trim();
      if (!text) return;

      var entries = JSON.parse(localStorage.getItem('hp_journal') || '[]');
      var today = new Date();
      var dateStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

      entries.push({ date: dateStr, text: text, timestamp: Date.now() });
      localStorage.setItem('hp_journal', JSON.stringify(entries));
      input.value = '';
      Haptic.success();
      UI.showToast(UI.t('mind_journal_saved'), 'success');
      renderMind();
    });
  }

  /* ========== Chat Screen ========== */

  function renderChat() {
    var container = document.getElementById('screen-chat');
    var hasMessages = state.chatMessages.length > 0;

    var html = '<div class="chat-container">';

    /* Messages Area */
    html += '<div class="chat-messages" id="chat-messages">';

    if (!hasMessages) {
      /* Welcome state — centered like ChatGPT */
      html += '<div class="chat-welcome">';
      html += '<div class="chat-welcome-icon">💬</div>';
      html += '<div class="chat-welcome-title">' + UI.t('chat_welcome_title') + '</div>';
      html += '<div class="chat-welcome-subtitle">' + UI.t('chat_welcome_subtitle') + '</div>';
      html += '</div>';
    } else {
      for (var i = 0; i < state.chatMessages.length; i++) {
        var msg = state.chatMessages[i];
        html += buildChatMsgRow(msg.role, msg.text);
      }
    }
    html += '</div>';

    /* Suggestion chips — shown in welcome & above input */
    var chips = UI.getLang() === 'nl'
      ? ['hoe gaat het met me?', 'ik voel me stressed', 'slaaptips', 'ik voel me verdrietig']
      : ['how am i doing?', 'i feel stressed', 'sleep tips', 'i feel sad'];
    html += '<div class="chat-suggestions" id="chat-suggestions">';
    for (var ch = 0; ch < chips.length; ch++) {
      html += '<button class="chat-chip" data-msg="' + escapeHtml(chips[ch]) + '">' + escapeHtml(chips[ch]) + '</button>';
    }
    html += '</div>';

    /* Input bar — ChatGPT-style */
    html += '<div class="chat-input-bar">';
    html += '<input type="text" id="chat-input" placeholder="' + UI.t('chat_placeholder') + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="send">';
    html += '<button class="chat-send-btn" id="btn-chat-send" aria-label="' + UI.t('chat_send') + '">' + UI.icon('send') + '</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;

    /* Scroll to bottom */
    var messagesEl = document.getElementById('chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;

    /* Bind events */
    var sendBtn = document.getElementById('btn-chat-send');
    var chatInput = document.getElementById('chat-input');

    sendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') sendChatMessage();
    });

    /* Activate send button when typing */
    chatInput.addEventListener('input', function () {
      if (this.value.trim()) {
        sendBtn.classList.add('active');
      } else {
        sendBtn.classList.remove('active');
      }
    });

    /* Bind suggestion chips */
    var chipBtns = document.querySelectorAll('.chat-chip');
    for (var cb = 0; cb < chipBtns.length; cb++) {
      chipBtns[cb].addEventListener('click', function (e) {
        Haptic.tap(e);
        document.getElementById('chat-input').value = this.getAttribute('data-msg');
        sendChatMessage();
        var suggestionsEl = document.getElementById('chat-suggestions');
        if (suggestionsEl) suggestionsEl.classList.add('hidden');
      });
    }
  }

  /**
   * Build HTML for a single chat message row.
   * @param {string} role - 'bot' or 'user'
   * @param {string} text - Message text
   * @returns {string} HTML string
   */
  function buildChatMsgRow(role, text) {
    var html = '<div class="chat-msg-row ' + role + '">';
    if (role === 'bot') {
      html += '<div class="chat-avatar"><span class="chat-avatar-emoji">✦</span></div>';
      html += '<div class="chat-msg-content">' + escapeHtml(text) + '</div>';
    } else {
      html += '<div class="chat-msg-content">' + escapeHtml(text) + '</div>';
    }
    html += '</div>';
    return html;
  }

  /**
   * Build a health context summary string from check-in and metric data.
   * Sent to the AI so it can reference the user's actual data.
   */
  function buildHealthContext(checkIns, metrics) {
    if (checkIns.length === 0) return 'No check-in data yet.';

    var trends = Insights.analyzeTrends(checkIns);
    var streak = 0;
    var ctx = 'Total check-ins: ' + checkIns.length + '\n';
    ctx += 'Mood: ' + trends.mood.average + '/5 (' + trends.mood.direction + ')\n';
    ctx += 'Physical: ' + trends.physical.average + '/5 (' + trends.physical.direction + ')\n';
    ctx += 'Sleep: ' + trends.sleep.average + '/5 (' + trends.sleep.direction + ')\n';
    ctx += 'Nutrition: ' + trends.nutrition.average + '/5 (' + trends.nutrition.direction + ')\n';
    ctx += 'Stress: ' + trends.stress.average + '/5 (' + trends.stress.direction + ')\n';

    var latest = checkIns[checkIns.length - 1];
    if (latest && latest.symptoms) {
      ctx += 'Latest symptoms/notes: ' + latest.symptoms + '\n';
    }

    if (metrics.length > 0) {
      var last = metrics[metrics.length - 1];
      if (last.weight) ctx += 'Latest weight: ' + last.weight + ' kg\n';
      if (last.sleepHours) ctx += 'Latest sleep: ' + last.sleepHours + ' hours\n';
      if (last.workoutMinutes) ctx += 'Latest workout: ' + last.workoutMinutes + ' min\n';
    }

    ctx += 'Language: ' + UI.getLang();
    return ctx;
  }

  /**
   * Display a bot response in the chat UI.
   */
  function showBotResponse(messagesEl, typingEl, response) {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    Haptic.tap();
    state.chatMessages.push({ role: 'bot', text: response });

    var tmp = document.createElement('div');
    tmp.innerHTML = buildChatMsgRow('bot', response);
    messagesEl.appendChild(tmp.firstChild);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * Process and send a chat message.
   * Tries OpenAI API first, falls back to rule-based if unavailable.
   */
  function sendChatMessage() {
    var input = document.getElementById('chat-input');
    var text = input.value.trim();
    if (!text) return;

    Haptic.tap();

    /* Hide suggestion chips after first message */
    var suggestionsEl = document.getElementById('chat-suggestions');
    if (suggestionsEl) suggestionsEl.classList.add('hidden');

    /* Add user message */
    state.chatMessages.push({ role: 'user', text: text });
    input.value = '';

    /* Remove welcome state if present */
    var welcomeEl = document.querySelector('.chat-welcome');
    if (welcomeEl) welcomeEl.remove();

    /* Deactivate send button */
    document.getElementById('btn-chat-send').classList.remove('active');

    /* Show user message immediately */
    var messagesEl = document.getElementById('chat-messages');
    var tmp = document.createElement('div');
    tmp.innerHTML = buildChatMsgRow('user', text);
    messagesEl.appendChild(tmp.firstChild);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    /* Show typing indicator */
    var typingEl = document.createElement('div');
    typingEl.className = 'chat-typing-row';
    typingEl.innerHTML = '<div class="chat-avatar"><span class="chat-avatar-emoji">✦</span></div>' +
      '<div class="chat-typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    /* Fetch health data for context */
    Promise.all([
      Storage.getCheckIns(),
      Storage.getMetrics()
    ]).then(function (results) {
      var checkIns = results[0];
      var metrics = results[1];
      var healthContext = buildHealthContext(checkIns, metrics);

      /* Build conversation history (last 20 messages for context window) */
      var history = state.chatMessages.slice(-20);

      /* Try API first */
      var apiBody = JSON.stringify({
        messages: history,
        healthContext: healthContext
      });

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/chat', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 15000;

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.reply) {
              showBotResponse(messagesEl, typingEl, data.reply);
              return;
            }
          } catch (e) { /* fall through to offline */ }
        }
        /* API failed, use offline fallback */
        var fallback = Insights.processChat(text, checkIns, metrics, UI.getLang());
        showBotResponse(messagesEl, typingEl, fallback);
      };

      xhr.onerror = function () {
        var fallback = Insights.processChat(text, checkIns, metrics, UI.getLang());
        showBotResponse(messagesEl, typingEl, fallback);
      };

      xhr.ontimeout = function () {
        var fallback = Insights.processChat(text, checkIns, metrics, UI.getLang());
        showBotResponse(messagesEl, typingEl, fallback);
      };

      xhr.send(apiBody);
    });
  }

  /* ========== Reports Screen ========== */

  /**
   * Render the monthly report screen.
   */
  function renderReports() {
    var container = document.getElementById('screen-reports');

    Promise.all([
      Storage.getCheckIns(),
      Storage.getMetrics()
    ]).then(function (results) {
      var checkIns = results[0];
      var metrics = results[1];
      var html = '';

      /* Back button */
      html += '<button class="btn-outline" id="btn-reports-back" style="margin-bottom: var(--space-md);">' + UI.icon('back') + ' ' + UI.t('settings_back') + '</button>';

      if (checkIns.length < 30) {
        html += '<div class="insight-locked">';
        html += '<div class="insight-locked-icon">' + UI.icon('award') + '</div>';
        html += '<p class="insight-locked-text">' + UI.t('reports_need_more') + '</p>';
        html += '<p class="insight-locked-count">' + checkIns.length + ' ' + UI.t('reports_days_count') + '</p>';
        html += '</div>';
        container.innerHTML = html;
        document.getElementById('btn-reports-back').addEventListener('click', function () {
          navigateTo('insights');
        });
        return;
      }

      var report = Insights.generateReport(checkIns, metrics);
      var lang = UI.getLang();

      /* Habits */
      html += '<div class="report-section">';
      html += '<div class="report-section-title">' + UI.icon('heart') + ' ' + UI.t('reports_habits') + '</div>';
      html += '<div class="card">';
      for (var h = 0; h < report.habits[lang].length; h++) {
        html += '<div class="report-item">' + report.habits[lang][h] + '</div>';
      }
      html += '</div></div>';

      /* Improvements */
      html += '<div class="report-section">';
      html += '<div class="report-section-title" style="color: var(--color-success);">' + UI.icon('award') + ' ' + UI.t('reports_improvements') + '</div>';
      html += '<div class="card">';
      for (var im = 0; im < report.improvements[lang].length; im++) {
        html += '<div class="report-item">' + report.improvements[lang][im] + '</div>';
      }
      html += '</div></div>';

      /* Warnings */
      html += '<div class="report-section">';
      html += '<div class="report-section-title" style="color: var(--color-warning);">' + UI.icon('alert') + ' ' + UI.t('reports_warnings') + '</div>';
      html += '<div class="card">';
      for (var w = 0; w < report.warnings[lang].length; w++) {
        html += '<div class="report-item">' + report.warnings[lang][w] + '</div>';
      }
      html += '</div></div>';

      /* Suggestions */
      html += '<div class="report-section">';
      html += '<div class="report-section-title" style="color: var(--color-info);">' + UI.icon('info') + ' ' + UI.t('reports_suggestions') + '</div>';
      html += '<div class="card">';
      for (var s = 0; s < report.suggestions[lang].length; s++) {
        html += '<div class="report-item">' + report.suggestions[lang][s] + '</div>';
      }
      html += '</div></div>';

      /* Export PDF Button */
      html += '<div style="margin-top: var(--space-lg);">';
      html += '<button class="btn-primary" id="btn-export-pdf">' + UI.icon('pdf') + ' ' + UI.t('reports_export_pdf') + '</button>';
      html += '</div>';

      container.innerHTML = html;

      document.getElementById('btn-reports-back').addEventListener('click', function () {
        navigateTo('insights');
      });

      document.getElementById('btn-export-pdf').addEventListener('click', function () {
        exportReportPDF(report, checkIns, metrics);
      });
    });
  }

  /**
   * Export the monthly report as a formatted PDF via print dialog.
   * Opens a styled HTML document in a new window for the user to print/save.
   */
  function exportReportPDF(report, checkIns, metrics) {
    var lang = UI.getLang();
    var trends = Insights.analyzeTrends(checkIns);
    var wellnessScore = Insights.calculateWellnessScore(checkIns);
    var title = UI.t('reports_pdf_title');
    var now = new Date();
    var dateRange = checkIns[0] ? checkIns[0].date : '' ;
    var dateEnd = checkIns.length > 0 ? checkIns[checkIns.length - 1].date : '';

    var printHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>';
    printHtml += '<style>';
    printHtml += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a2e2a; max-width: 700px; margin: 0 auto; padding: 40px 30px; line-height: 1.6; }';
    printHtml += '.header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #2a9d8f; }';
    printHtml += '.header h1 { font-size: 28px; color: #2a9d8f; margin: 0 0 8px; }';
    printHtml += '.header .date { color: #5a7a74; font-size: 14px; }';
    printHtml += '.header .score { font-size: 48px; font-weight: 800; color: #2a9d8f; margin: 16px 0 4px; }';
    printHtml += '.header .score-label { font-size: 14px; color: #5a7a74; }';
    printHtml += '.section { margin-bottom: 28px; }';
    printHtml += '.section h2 { font-size: 18px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #e8f0ed; }';
    printHtml += '.section h2.green { color: #4caf50; border-bottom-color: #c8e6c9; }';
    printHtml += '.section h2.orange { color: #ff9800; border-bottom-color: #ffe0b2; }';
    printHtml += '.section h2.blue { color: #2196f3; border-bottom-color: #bbdefb; }';
    printHtml += '.item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }';
    printHtml += '.item:last-child { border-bottom: none; }';
    printHtml += '.trends-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }';
    printHtml += '.trend-box { padding: 12px; border-radius: 8px; background: #f8faf9; border: 1px solid #e8f0ed; }';
    printHtml += '.trend-box .label { font-size: 12px; color: #5a7a74; text-transform: uppercase; letter-spacing: 0.5px; }';
    printHtml += '.trend-box .value { font-size: 22px; font-weight: 700; color: #1a2e2a; }';
    printHtml += '.trend-box .dir { font-size: 12px; font-weight: 600; }';
    printHtml += '.dir.improving { color: #4caf50; }';
    printHtml += '.dir.declining { color: #f44336; }';
    printHtml += '.dir.stable { color: #2196f3; }';
    printHtml += '.footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8f0ed; color: #8fa8a2; font-size: 12px; }';
    printHtml += '@media print { body { padding: 20px; } }';
    printHtml += '</style></head><body>';

    /* Header */
    printHtml += '<div class="header">';
    printHtml += '<h1>HealthPulse</h1>';
    printHtml += '<div class="date">' + (dateRange && dateEnd ? dateRange + ' \u2014 ' + dateEnd : now.toLocaleDateString()) + '</div>';
    printHtml += '<div class="score">' + wellnessScore + '</div>';
    printHtml += '<div class="score-label">' + UI.t('wellness_score') + '</div>';
    printHtml += '</div>';

    /* Trends Grid */
    printHtml += '<div class="trends-grid">';
    var fields = ['mood', 'physical', 'sleep', 'nutrition', 'stress'];
    for (var ti = 0; ti < fields.length; ti++) {
      var f = fields[ti];
      var tr = trends[f];
      if (tr && tr.average > 0) {
        printHtml += '<div class="trend-box">';
        printHtml += '<div class="label">' + f.charAt(0).toUpperCase() + f.slice(1) + '</div>';
        printHtml += '<div class="value">' + tr.average + '/5</div>';
        printHtml += '<div class="dir ' + tr.direction + '">' + UI.t('insights_' + tr.direction) + '</div>';
        printHtml += '</div>';
      }
    }
    printHtml += '</div>';

    /* Habits */
    printHtml += '<div class="section"><h2>' + UI.t('reports_habits') + '</h2>';
    for (var rh = 0; rh < report.habits[lang].length; rh++) {
      printHtml += '<div class="item">' + report.habits[lang][rh] + '</div>';
    }
    printHtml += '</div>';

    /* Improvements */
    printHtml += '<div class="section"><h2 class="green">' + UI.t('reports_improvements') + '</h2>';
    for (var ri = 0; ri < report.improvements[lang].length; ri++) {
      printHtml += '<div class="item">' + report.improvements[lang][ri] + '</div>';
    }
    printHtml += '</div>';

    /* Warnings */
    printHtml += '<div class="section"><h2 class="orange">' + UI.t('reports_warnings') + '</h2>';
    for (var rw = 0; rw < report.warnings[lang].length; rw++) {
      printHtml += '<div class="item">' + report.warnings[lang][rw] + '</div>';
    }
    printHtml += '</div>';

    /* Suggestions */
    printHtml += '<div class="section"><h2 class="blue">' + UI.t('reports_suggestions') + '</h2>';
    for (var rs = 0; rs < report.suggestions[lang].length; rs++) {
      printHtml += '<div class="item">' + report.suggestions[lang][rs] + '</div>';
    }
    printHtml += '</div>';

    /* Footer */
    printHtml += '<div class="footer">Generated by HealthPulse &mdash; ' + now.toLocaleDateString() + '</div>';
    printHtml += '</body></html>';

    var printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      setTimeout(function () {
        printWindow.print();
      }, 500);
    }
  }

  /* ========== Settings Screen ========== */

  /** Available accent colors */
  var ACCENT_COLORS = [
    { id: 'teal', hex: '#2a9d8f', r: 42, g: 157, b: 143 },
    { id: 'blue', hex: '#3b82f6', r: 59, g: 130, b: 246 },
    { id: 'purple', hex: '#8b5cf6', r: 139, g: 92, b: 246 },
    { id: 'pink', hex: '#ec4899', r: 236, g: 72, b: 153 },
    { id: 'orange', hex: '#f97316', r: 249, g: 115, b: 22 },
    { id: 'red', hex: '#ef4444', r: 239, g: 68, b: 68 },
    { id: 'green', hex: '#22c55e', r: 34, g: 197, b: 94 }
  ];

  /**
   * Apply theme (dark/light) and accent color to the document.
   */
  function applyTheme() {
    var theme = Storage.getPref('theme', 'light');
    var accentId = Storage.getPref('accent', 'teal');
    var accent = ACCENT_COLORS[0];
    for (var i = 0; i < ACCENT_COLORS.length; i++) {
      if (ACCENT_COLORS[i].id === accentId) { accent = ACCENT_COLORS[i]; break; }
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--color-primary', accent.hex);
    document.documentElement.style.setProperty('--color-primary-light', accent.hex);
    document.documentElement.style.setProperty('--color-primary-dark', accent.hex);
    document.documentElement.style.setProperty('--color-primary-bg', 'rgba(' + accent.r + ',' + accent.g + ',' + accent.b + ',0.08)');
    document.documentElement.style.setProperty('--accent-r', accent.r);
    document.documentElement.style.setProperty('--accent-g', accent.g);
    document.documentElement.style.setProperty('--accent-b', accent.b);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1a1a1a' : accent.hex);
  }

  /**
   * Render the settings screen.
   */
  function renderSettings() {
    var container = document.getElementById('screen-settings');
    var currentLang = UI.getLang();
    var remindersOn = Storage.getPref('reminders', false);
    var reminderTime = Storage.getPref('reminderTime', '09:00');
    var currentTheme = Storage.getPref('theme', 'light');
    var currentAccent = Storage.getPref('accent', 'teal');
    var soundsOn = Storage.getPref('sounds', true);

    var html = '';

    /* Back button */
    html += '<button class="btn-outline" id="btn-settings-back" style="margin-bottom: var(--space-lg);">' + UI.icon('back') + ' ' + UI.t('settings_back') + '</button>';

    /* Appearance */
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + UI.t('settings_appearance') + '</div>';

    /* Theme toggle */
    html += '<div class="settings-item">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + (currentTheme === 'dark' ? UI.icon('moon') : UI.icon('sun')) + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_theme') + '</span></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="settings-theme-row" id="theme-row">';
    html += '<div class="theme-option ' + (currentTheme === 'light' ? 'selected' : '') + '" data-theme="light">';
    html += '<span class="theme-option-icon">☀️</span>';
    html += '<span class="theme-option-label">' + UI.t('settings_theme_light') + '</span>';
    html += '</div>';
    html += '<div class="theme-option ' + (currentTheme === 'dark' ? 'selected' : '') + '" data-theme="dark">';
    html += '<span class="theme-option-icon">🌙</span>';
    html += '<span class="theme-option-label">' + UI.t('settings_theme_dark') + '</span>';
    html += '</div>';
    html += '</div>';

    /* Accent Color */
    html += '<div class="settings-item">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + UI.icon('palette') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_accent') + '</span></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="settings-color-row" id="accent-row">';
    for (var ci = 0; ci < ACCENT_COLORS.length; ci++) {
      var ac = ACCENT_COLORS[ci];
      html += '<div class="color-option ' + (currentAccent === ac.id ? 'selected' : '') + '" data-accent="' + ac.id + '" style="background: ' + ac.hex + ';"></div>';
    }
    html += '</div>';
    html += '</div>';

    /* Sound effects toggle */
    html += '<div class="settings-item" id="settings-sound-toggle">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + (soundsOn ? '🔊' : '🔇') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_sounds') + '</span></div>';
    html += '</div>';
    html += '<div class="toggle ' + (soundsOn ? 'active' : '') + '" id="toggle-sounds"></div>';
    html += '</div>';
    html += '</div>';

    /* Language */
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + UI.t('settings_language') + '</div>';
    html += '<div class="settings-item" id="settings-lang">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + UI.icon('globe') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_language') + '</span></div>';
    html += '</div>';
    html += '<div class="settings-item-right">' + (currentLang === 'en' ? 'English' : 'Nederlands') + '</div>';
    html += '</div>';
    html += '</div>';

    /* Reminders */
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + UI.t('settings_reminders') + '</div>';
    html += '<div class="settings-item" id="settings-reminder-toggle">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + UI.icon('bell') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_reminders') + '</span></div>';
    html += '</div>';
    html += '<div class="toggle ' + (remindersOn ? 'active' : '') + '" id="toggle-reminders"></div>';
    html += '</div>';
    html += '<div class="settings-item">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + UI.icon('bell') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_reminder_time') + '</span></div>';
    html += '</div>';
    html += '<input type="time" id="input-reminder-time" value="' + reminderTime + '" style="width: auto; border: none; text-align: right; color: var(--color-primary); font-weight: 600; background: transparent;">';
    html += '</div>';
    html += '</div>';

    /* Data Management */
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">Data</div>';
    html += '<div class="settings-item" id="settings-export">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + UI.icon('download') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_export') + '</span><span class="settings-item-desc">' + UI.t('settings_export_desc') + '</span></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="settings-item" id="settings-clear">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon danger">' + UI.icon('trash') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title" style="color: var(--color-error);">' + UI.t('settings_clear') + '</span><span class="settings-item-desc">' + UI.t('settings_clear_desc') + '</span></div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    /* About */
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + UI.t('settings_about') + '</div>';
    html += '<div class="settings-item">';
    html += '<div class="settings-item-left">';
    html += '<div class="settings-item-icon">' + UI.icon('info') + '</div>';
    html += '<div class="settings-item-text"><span class="settings-item-title">' + UI.t('settings_about') + '</span><span class="settings-item-desc">' + UI.t('settings_about_text') + '</span></div>';
    html += '</div>';
    html += '<div class="settings-item-right">' + UI.t('settings_version') + '</div>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;

    /* Bind events */
    document.getElementById('btn-settings-back').addEventListener('click', function () {
      navigateTo('home');
    });

    /* Theme toggle */
    var themeOptions = document.querySelectorAll('#theme-row .theme-option');
    for (var ti = 0; ti < themeOptions.length; ti++) {
      themeOptions[ti].addEventListener('click', function (e) {
        Haptic.select(e);
        var newTheme = this.getAttribute('data-theme');
        Storage.setPref('theme', newTheme);
        applyTheme();
        renderSettings();
      });
    }

    /* Accent color picker */
    var colorOptions = document.querySelectorAll('#accent-row .color-option');
    for (var co = 0; co < colorOptions.length; co++) {
      colorOptions[co].addEventListener('click', function (e) {
        Haptic.select(e);
        var newAccent = this.getAttribute('data-accent');
        Storage.setPref('accent', newAccent);
        applyTheme();
        renderSettings();
      });
    }

    document.getElementById('settings-lang').addEventListener('click', function () {
      var newLang = UI.getLang() === 'en' ? 'nl' : 'en';
      UI.setLanguage(newLang);
      Storage.setPref('language', newLang);
      updateNavLabels();
      renderSettings();
    });

    document.getElementById('settings-reminder-toggle').addEventListener('click', function () {
      var newVal = !Storage.getPref('reminders', false);
      Storage.setPref('reminders', newVal);
      if (newVal) {
        requestNotificationPermission();
      }
      renderSettings();
    });

    document.getElementById('input-reminder-time').addEventListener('change', function () {
      Storage.setPref('reminderTime', this.value);
      scheduleReminder();
    });

    document.getElementById('settings-sound-toggle').addEventListener('click', function () {
      var newVal = !Storage.getPref('sounds', true);
      Storage.setPref('sounds', newVal);
      Haptic.select();
      renderSettings();
    });

    document.getElementById('settings-export').addEventListener('click', exportData);
    document.getElementById('settings-clear').addEventListener('click', clearDataWithConfirm);
  }

  /**
   * Export all app data as a downloadable JSON file.
   */
  function exportData() {
    Storage.exportAll().then(function (data) {
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'healthpulse-export-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Show a confirmation dialog and clear all data if confirmed.
   */
  function clearDataWithConfirm() {
    showDialog(UI.t('settings_clear_confirm'), function () {
      Storage.clearAll().then(function () {
        state.chatMessages = [];
        Haptic.error();
        UI.showToast(UI.t('settings_cleared'), 'success');
        navigateTo('home');
      });
    });
  }

  /**
   * Show a confirmation dialog overlay.
   * @param {string} message - Dialog message text
   * @param {Function} onConfirm - Callback when user confirms
   */
  function showDialog(message, onConfirm) {
    var dialogContainer = document.getElementById('dialog-container');
    var html = '<div class="dialog-overlay" id="dialog-overlay">';
    html += '<div class="dialog-box">';
    html += '<p class="dialog-text">' + message + '</p>';
    html += '<div class="dialog-actions">';
    html += '<button class="btn-secondary" id="dialog-cancel">' + UI.t('btn_cancel') + '</button>';
    html += '<button class="btn-danger" id="dialog-confirm" style="flex: 1;">' + UI.t('settings_clear') + '</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    dialogContainer.innerHTML = html;

    document.getElementById('dialog-cancel').addEventListener('click', function () {
      dialogContainer.innerHTML = '';
    });

    document.getElementById('dialog-overlay').addEventListener('click', function (e) {
      if (e.target === this) {
        dialogContainer.innerHTML = '';
      }
    });

    document.getElementById('dialog-confirm').addEventListener('click', function () {
      dialogContainer.innerHTML = '';
      if (onConfirm) onConfirm();
    });
  }

  /* ========== Notifications / Reminders ========== */

  /**
   * Request notification permission from the browser.
   */
  function requestNotificationPermission() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'denied') {
          UI.showToast(UI.t('notification_permission_denied'), 'error');
          Storage.setPref('reminders', false);
        }
      });
    } else if (Notification.permission === 'denied') {
      UI.showToast(UI.t('notification_permission_denied'), 'error');
      Storage.setPref('reminders', false);
    }
  }

  /**
   * Schedule a daily notification reminder.
   * Uses setInterval to check every minute if it's time to notify.
   */
  function scheduleReminder() {
    if (state.reminderInterval) {
      clearInterval(state.reminderInterval);
    }

    if (!Storage.getPref('reminders', false)) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    var reminderTime = Storage.getPref('reminderTime', '09:00');

    state.reminderInterval = setInterval(function () {
      var now = new Date();
      var hours = String(now.getHours()).padStart(2, '0');
      var minutes = String(now.getMinutes()).padStart(2, '0');
      var currentTime = hours + ':' + minutes;

      if (currentTime === reminderTime) {
        Storage.getTodayCheckIn().then(function (today) {
          if (!today) {
            new Notification(UI.t('notification_title'), {
              body: UI.t('notification_body'),
              icon: './icon.svg',
              badge: './icon.svg'
            });
          }
        });
      }
    }, 60000);
  }

  /* ========== Utility Functions ========== */

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str - Raw string
   * @returns {string} Escaped string safe for innerHTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ========== Start Application ========== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
