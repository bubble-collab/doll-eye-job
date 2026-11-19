/* =========================================================
   인형 눈알 붙이기 — app.js
   앱인토스(App in Toss) 미니앱 프로토타입
   - 순수 클라이언트 사이드 (iframe / eval / SSR 사용 없음)
   - 외부 라이브러리·외부 리소스 없음
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. 설정 (앱인토스 콘솔에서 발급받은 값으로 교체하세요)
     --------------------------------------------------------- */
  var CONFIG = {
    appName: '인형 눈알 붙이기',

    // 박스 단위: 10개 = 1박스
    boxSize: 10,

    // 광고 보상
    boostSeconds: 30,      // "30초 일당 2배"
    demoAdSeconds: 5,      // 프로토타입 데모 광고 길이(초)

    // 가상 일당 (게임 내 재화)
    pay: { perfect: 300, good: 180, defect: 60 },
    boxBonus: 2000,
    comboBonus: { per: 10, max: 200 },

    // 정확도 판정 반경 (SVG 좌표 기준)
    accuracy: { perfect: 14, good: 36 },

    // 이 개수까지는 가이드가 진하게 보이고, 이후에는 은은해져요.
    guideStrongDolls: 3,

    storageKey: 'doll-eye-job.v1',

    /* ★ 앱마다 새로 발급받은 광고 그룹 ID를 넣어 주세요.
       - 다른 앱에서 쓰던 ID를 재사용하면 정적 분석에서 반려될 수 있어요.
       - 지금 값은 앱인토스 문서의 테스트용 ID예요. */
    adGroupIds: {
      rewardedDoubleWage: 'ait-ad-test-rewarded-id',
      rewardedRepair: 'ait-ad-test-rewarded-id',
      interstitialBoxComplete: 'ait-ad-test-interstitial-id',
      bannerBottom: 'ait-ad-test-banner-id'
    }
  };

  /* 숙련도 등급 (누적 작업량 기준) */
  var GRADES = [
    { name: '수습생', emoji: '🧵', min: 0,   mult: 1.0 },
    { name: '숙련공', emoji: '🪡', min: 30,  mult: 1.15 },
    { name: '반장',   emoji: '📋', min: 90,  mult: 1.3 },
    { name: '공장장', emoji: '🏭', min: 200, mult: 1.5 }
  ];

  var ACCENTS = ['#ff8e7a', '#6fc9b0', '#ffc24d', '#9da9ff', '#f28fb6'];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------
     2. 인형 그림 (SVG)
     --------------------------------------------------------- */
  function bowMarkup(accent) {
    return '' +
      '<g class="doll-bow">' +
        '<ellipse cx="-19" cy="-1" rx="17" ry="10.5" transform="rotate(-20 -19 -1)" fill="' + accent + '"/>' +
        '<ellipse cx="19" cy="-1" rx="17" ry="10.5" transform="rotate(20 19 -1)" fill="' + accent + '"/>' +
        '<ellipse cx="-19" cy="-1" rx="8" ry="5" transform="rotate(-20 -19 -1)" fill="#000" opacity="0.09"/>' +
        '<ellipse cx="19" cy="-1" rx="8" ry="5" transform="rotate(20 19 -1)" fill="#000" opacity="0.06"/>' +
        '<circle r="6" fill="' + accent + '"/>' +
        '<circle r="6" fill="#000" opacity="0.14"/>' +
      '</g>';
  }

  function bearBody(accent) {
    return '' +
      '<g filter="url(#plushShadow)">' +
        // 왼쪽 귀 + 리본
        '<g>' +
          '<circle cx="84" cy="92" r="37" fill="url(#furBear)"/>' +
          '<circle cx="84" cy="92" r="21" fill="#efc29c"/>' +
          '<path d="M64 78 q18 -12 36 2" fill="none" stroke="#8d5a33" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 6" opacity="0.5"/>' +
        '</g>' +
        // 오른쪽 귀
        '<g>' +
          '<circle cx="236" cy="92" r="37" fill="url(#furBear)"/>' +
          '<circle cx="236" cy="92" r="21" fill="#efc29c"/>' +
          '<path d="M220 74 q18 -10 34 4" fill="none" stroke="#8d5a33" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 6" opacity="0.5"/>' +
        '</g>' +
        // 머리
        '<ellipse cx="160" cy="158" rx="112" ry="104" fill="url(#furBear)"/>' +
        '<ellipse cx="118" cy="96" rx="30" ry="14" fill="#ffffff" opacity="0.08" transform="rotate(-18 118 96)"/>' +
        '<path d="M52 178 q-6 -26 8 -50" fill="none" stroke="#8d5a33" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 7" opacity="0.35"/>' +
        '<path d="M268 178 q6 -26 -8 -50" fill="none" stroke="#8d5a33" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 7" opacity="0.35"/>' +
        // 주둥이
        '<ellipse cx="160" cy="206" rx="54" ry="40" fill="url(#muzzleBear)"/>' +
        '<path d="M146 184 q14 -9 28 0 q-4 15 -14 17 q-10 -2 -14 -17 z" fill="#4b2e22"/>' +
        '<ellipse cx="154" cy="188" rx="4.4" ry="2.6" fill="#ffffff" opacity="0.55"/>' +
        '<path id="dollMouth" d="M160 201 q-12 16 -25 5 M160 201 q12 16 25 5" fill="none" stroke="#6a4028" stroke-width="3.4" stroke-linecap="round"/>' +
        // 볼터치
        '<ellipse cx="88" cy="196" rx="18" ry="10" fill="#f08c82" opacity="0.4"/>' +
        '<ellipse cx="232" cy="196" rx="18" ry="10" fill="#f08c82" opacity="0.4"/>' +
        '<g transform="translate(76 66) rotate(-16) scale(0.62)">' + bowMarkup(accent) + '</g>' +
      '</g>';
  }

  function rabbitBody(accent) {
    return '' +
      '<g filter="url(#plushShadow)">' +
        // 귀 (왼쪽)
        '<g transform="rotate(-9 110 96)">' +
          '<ellipse cx="110" cy="66" rx="28" ry="62" fill="url(#furRabbit)"/>' +
          '<ellipse cx="110" cy="72" rx="13" ry="44" fill="#f8c3cc"/>' +
          '<path d="M97 36 q13 6 26 0" fill="none" stroke="#d9b79e" stroke-width="2" stroke-linecap="round" opacity="0.5"/>' +
        '</g>' +
        // 귀 (오른쪽)
        '<g transform="rotate(9 210 96)">' +
          '<ellipse cx="210" cy="66" rx="28" ry="62" fill="url(#furRabbit)"/>' +
          '<ellipse cx="210" cy="72" rx="13" ry="44" fill="#f8c3cc"/>' +
          '<path d="M197 36 q13 6 26 0" fill="none" stroke="#d9b79e" stroke-width="2" stroke-linecap="round" opacity="0.5"/>' +
        '</g>' +
        // 머리
        '<ellipse cx="160" cy="182" rx="102" ry="90" fill="url(#furRabbit)"/>' +
        '<ellipse cx="120" cy="138" rx="34" ry="17" fill="#ffffff" opacity="0.3" transform="rotate(-16 120 138)"/>' +
        // 주둥이
        '<ellipse cx="160" cy="216" rx="46" ry="31" fill="url(#muzzleRabbit)"/>' +
        '<path d="M151 201 q9 -7 18 0 q-3 9 -9 10 q-6 -1 -9 -10 z" fill="#f08a96"/>' +
        '<path id="dollMouth" d="M160 212 q-10 13 -21 3 M160 212 q10 13 21 3" fill="none" stroke="#8a5a44" stroke-width="3.1" stroke-linecap="round"/>' +
        // 수염
        '<g stroke="#b99a82" stroke-width="2" stroke-linecap="round" opacity="0.5">' +
          '<path d="M114 208 q-22 -5 -34 -11"/>' +
          '<path d="M114 217 q-24 2 -36 0"/>' +
          '<path d="M206 208 q22 -5 34 -11"/>' +
          '<path d="M206 217 q24 2 36 0"/>' +
        '</g>' +
        // 볼터치
        '<ellipse cx="88" cy="204" rx="18" ry="10" fill="#f49aa6" opacity="0.45"/>' +
        '<ellipse cx="232" cy="204" rx="18" ry="10" fill="#f49aa6" opacity="0.45"/>' +
        '<g transform="translate(106 50) rotate(-10) scale(0.56)">' + bowMarkup(accent) + '</g>' +
      '</g>';
  }

  var DOLLS = {
    bear: {
      name: '곰돌이',
      body: bearBody,
      eyes: [{ x: 118, y: 142 }, { x: 202, y: 142 }],
      center: { x: 160, y: 160 },
      hitRadius: 150,
      clamp: { x0: 88, x1: 232, y0: 116, y1: 204 },
      sadMouth: 'M160 201 q-12 -10 -25 -2 M160 201 q12 -10 25 -2'
    },
    rabbit: {
      name: '토끼',
      body: rabbitBody,
      eyes: [{ x: 124, y: 160 }, { x: 196, y: 160 }],
      center: { x: 160, y: 182 },
      hitRadius: 150,
      clamp: { x0: 92, x1: 228, y0: 142, y1: 216 },
      sadMouth: 'M160 212 q-10 -8 -21 -1 M160 212 q10 -8 21 -1'
    }
  };

  /* ---------------------------------------------------------
     3. 사운드 (Web Audio API, 파일 없음)
     --------------------------------------------------------- */
  var SFX = (function () {
    var ctx = null;
    var master = null;
    var noiseBuffer = null;
    var muted = false;
    var unlocked = false;

    function audio() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.75;
        master.connect(ctx.destination);
        var len = Math.floor(ctx.sampleRate * 0.3);
        noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        var data = noiseBuffer.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      } catch (e) {
        ctx = null;
      }
      return ctx;
    }

    // iOS Safari / 토스 웹뷰: 첫 사용자 터치에서 AudioContext를 깨워요.
    function unlock() {
      var c = audio();
      if (!c) return;
      if (c.state === 'suspended' && c.resume) c.resume().catch(function () {});
      if (!unlocked) {
        unlocked = true;
        try {
          var s = c.createBufferSource();
          s.buffer = c.createBuffer(1, 1, c.sampleRate);
          s.connect(c.destination);
          s.start(0);
        } catch (e) { /* noop */ }
      }
    }

    function tone(opt) {
      var c = audio();
      if (!c || muted) return;
      var t0 = c.currentTime + (opt.delay || 0);
      var dur = opt.dur || 0.15;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = opt.type || 'sine';
      osc.frequency.setValueAtTime(opt.freq, t0);
      if (opt.to) osc.frequency.exponentialRampToValueAtTime(Math.max(24, opt.to), t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(opt.gain || 0.2, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    function noise(opt) {
      var c = audio();
      if (!c || muted || !noiseBuffer) return;
      var t0 = c.currentTime + (opt.delay || 0);
      var dur = opt.dur || 0.05;
      var src = c.createBufferSource();
      src.buffer = noiseBuffer;
      var filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(opt.freq || 2000, t0);
      filter.Q.value = opt.q || 1.1;
      var gain = c.createGain();
      gain.gain.setValueAtTime(opt.gain || 0.18, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    var sounds = {
      tok: function () {
        noise({ dur: 0.05, freq: 2400, gain: 0.2 });
        tone({ freq: 900, to: 320, dur: 0.07, gain: 0.16, type: 'sine' });
      },
      pok: function () {
        noise({ dur: 0.06, freq: 900, gain: 0.16 });
        tone({ freq: 420, to: 240, dur: 0.11, gain: 0.16, type: 'triangle' });
      },
      perfect: function () {
        tone({ freq: 987.77, dur: 0.12, gain: 0.18, type: 'sine' });
        tone({ freq: 1318.51, dur: 0.24, gain: 0.15, type: 'sine', delay: 0.085 });
        tone({ freq: 1975.53, dur: 0.18, gain: 0.06, type: 'sine', delay: 0.17 });
      },
      good: function () {
        tone({ freq: 659.25, dur: 0.1, gain: 0.15, type: 'triangle' });
        tone({ freq: 880, dur: 0.16, gain: 0.11, type: 'triangle', delay: 0.08 });
      },
      defect: function () {
        tone({ freq: 240, to: 150, dur: 0.22, gain: 0.17, type: 'sawtooth' });
        tone({ freq: 186, to: 120, dur: 0.26, gain: 0.1, type: 'square', delay: 0.06 });
      },
      combo: function () {
        var base = 659.25;
        [0, '1.26', '1.5'].forEach(function (m, i) {
          var k = typeof m === 'number' ? m : parseFloat(m);
          tone({ freq: base * Math.pow(k, 1), dur: 0.1, gain: 0.12, type: 'triangle', delay: i * 0.055 });
        });
      },
      box: function () {
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          tone({ freq: f, dur: 0.3, gain: 0.14, type: 'triangle', delay: i * 0.09 });
        });
      },
      ui: function () {
        tone({ freq: 720, dur: 0.05, gain: 0.1, type: 'sine' });
      }
    };

    return {
      unlock: unlock,
      play: function (name) {
        if (muted) return;
        var fn = sounds[name];
        if (fn) fn();
      },
      setMuted: function (v) { muted = !!v; },
      isMuted: function () { return muted; },
      resume: function () {
        var c = audio();
        if (c && c.state === 'suspended' && c.resume) c.resume().catch(function () {});
      }
    };
  })();

  /* ---------------------------------------------------------
     4. 상태
     --------------------------------------------------------- */
  var todayKst = function () {
    var d = new Date();
    // 기기 시간대와 무관하게 한국 날짜 기준으로 일당을 초기화해요.
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
    } catch (e) {
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }
  };

  function defaultState() {
    return {
      day: todayKst(),
      doll: 'bear',
      total: 0,
      today: 0,
      combo: 0,
      bestCombo: 0,
      boxNum: 1,
      boxCount: 0,
      defects: 0,
      repaired: 0,
      boxesDone: 0,
      boostUntil: 0,
      guide: true,
      muted: false,
      accentSeed: 0
    };
  }

  var state = defaultState();

  function loadState() {
    var raw = null;
    try { raw = window.localStorage.getItem(CONFIG.storageKey); } catch (e) { raw = null; }
    if (raw) {
      try {
        var saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          for (var k in state) {
            if (Object.prototype.hasOwnProperty.call(state, k) && saved[k] !== undefined) {
              state[k] = saved[k];
            }
          }
        }
      } catch (e) { /* 저장값이 깨졌으면 새로 시작 */ }
    }
    if (state.day !== todayKst()) {
      state.day = todayKst();
      state.today = 0;
      state.combo = 0;
      state.boostUntil = 0;
    }
    if (!DOLLS[state.doll]) state.doll = 'bear';
    state.boxCount = Math.max(0, Math.min(CONFIG.boxSize, Number(state.boxCount) || 0));
    state.total = Math.max(0, Number(state.total) || 0);
    state.today = Math.max(0, Number(state.today) || 0);
    state.defects = Math.max(0, Number(state.defects) || 0);
    state.gradeIndex = gradeIndexFor(state.total);
  }

  var saveTimer = null;
  function saveState() {
    if (saveTimer) return;
    saveTimer = window.setTimeout(function () {
      saveTimer = null;
      try {
        window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
      } catch (e) { /* 저장 공간이 없어도 게임은 계속 */ }
    }, 120);
  }

  function gradeIndexFor(total) {
    var idx = 0;
    for (var i = 0; i < GRADES.length; i++) {
      if (total >= GRADES[i].min) idx = i;
    }
    return idx;
  }

  function isBoosted() {
    return Date.now() < state.boostUntil;
  }

  function won(n) {
    return Math.round(n).toLocaleString('ko-KR') + '원';
  }

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ---------------------------------------------------------
     5. DOM
     --------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  var els = {
    backBtn: $('backBtn'),
    soundBtn: $('soundBtn'),
    totalDolls: $('totalDolls'),
    todayWage: $('todayWage'),
    wageInfoBtn: $('wageInfoBtn'),
    boostChip: $('boostChip'),
    boostTimer: $('boostTimer'),
    gradeEmoji: $('gradeEmoji'),
    gradeName: $('gradeName'),
    gradeNext: $('gradeNext'),
    gradeFill: $('gradeFill'),
    tabBear: $('tabBear'),
    tabRabbit: $('tabRabbit'),
    stage: $('stage'),
    stageHint: $('stageHint'),
    stageCaption: $('stageCaption'),
    guideBtn: $('guideBtn'),
    comboBadge: $('comboBadge'),
    comboValue: $('comboValue'),
    dollSvg: $('dollSvg'),
    bodyLayer: $('bodyLayer'),
    guideLayer: $('guideLayer'),
    eyesLayer: $('eyesLayer'),
    fxLayer: $('fxLayer'),
    verdict: $('verdict'),
    verdictTitle: $('verdictTitle'),
    verdictSub: $('verdictSub'),
    popLayer: $('popLayer'),
    repairOffer: $('repairOffer'),
    repairNow: $('repairNow'),
    repairSkip: $('repairSkip'),
    boxNo: $('boxNo'),
    boxDone: $('boxDone'),
    boxSize: $('boxSize'),
    boxDots: $('boxDots'),
    boostBtn: $('boostBtn'),
    boostLabel: $('boostLabel'),
    repairBtn: $('repairBtn'),
    repairBadge: $('repairBadge'),
    exitModal: $('exitModal'),
    exitTotal: $('exitTotal'),
    exitStay: $('exitStay'),
    exitLeave: $('exitLeave'),
    wageModal: $('wageModal'),
    resetBtn: $('resetBtn'),
    adNoticeModal: $('adNoticeModal'),
    adNoticeTitle: $('adNoticeTitle'),
    adNoticeDesc: $('adNoticeDesc'),
    adConfirm: $('adConfirm'),
    adCancel: $('adCancel'),
    adPlayerModal: $('adPlayerModal'),
    adPlayerKind: $('adPlayerKind'),
    adPlayerLeft: $('adPlayerLeft'),
    adPlayerFill: $('adPlayerFill'),
    boxModal: $('boxModal'),
    boxModalNo: $('boxModalNo'),
    boxModalCount: $('boxModalCount'),
    boxBonusText: $('boxBonusText'),
    boxSummary: $('boxSummary'),
    boxBurst: $('boxBurst'),
    boxSkip: $('boxSkip'),
    boxAd: $('boxAd'),
    toast: $('toast')
  };

  /* ---------------------------------------------------------
     6. 진행 상태 (게임 루프)
     --------------------------------------------------------- */
  var phase = 'left';      // 'left' | 'right' | 'done' | 'locked'
  var taps = [];
  var advanceTimer = null;
  var repairTimer = null;
  var boostInterval = null;
  var boxPending = false;

  var dollsMade = 0; // 이번 실행에서 만든 인형 수(가이드 세기용)

  function nextAccent() {
    var seed = Number(state.accentSeed) || 0;
    state.accentSeed = seed + 1;
    return ACCENTS[seed % ACCENTS.length];
  }

  function bodyMarkup(doll) {
    return DOLLS[doll].body(nextAccent());
  }

  function newDoll() {
    clearTimeout(advanceTimer);
    clearTimeout(repairTimer);
    advanceTimer = null;
    repairTimer = null;
    boxPending = false;

    phase = 'left';
    taps = [];
    els.repairOffer.hidden = true;
    els.verdict.hidden = true;
    els.eyesLayer.innerHTML = '';
    els.fxLayer.innerHTML = '';
    els.bodyLayer.innerHTML = bodyMarkup(state.doll);
    els.dollSvg.classList.remove('is-complete', 'is-happy', 'is-ouch', 'is-float', 'is-peek');
    els.dollSvg.classList.add('is-enter');
    // 등장 애니메이션이 끝나면 둥실둥실
    window.setTimeout(function () {
      els.dollSvg.classList.remove('is-enter');
      els.dollSvg.classList.add('is-float');
    }, 440);

    updateHint('왼쪽 눈부터 톡!');
    setCaption('눈이 없는 인형이에요. <b>왼쪽 눈 → 오른쪽 눈</b> 순서로 톡톡!');
    renderGuide();
    saveState();
  }

  function setCaption(html) {
    els.stageCaption.innerHTML = html;
  }

  function updateHint(text) {
    els.stageHint.textContent = text;
  }

  /* 가이드 링 */
  function renderGuide() {
    els.guideLayer.innerHTML = '';
    if (!state.guide) return;

    var eyes = DOLLS[state.doll].eyes;
    var soft = dollsMade >= CONFIG.guideStrongDolls;

    eyes.forEach(function (pt, i) {
      if (i < taps.length) return;
      var ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('cx', pt.x);
      ring.setAttribute('cy', pt.y);
      ring.setAttribute('r', i === taps.length ? 20 : 17);
      ring.setAttribute('class', 'guide-ring' +
        (i === taps.length ? ' is-active' : '') +
        (soft ? ' is-soft' : ''));
      els.guideLayer.appendChild(ring);
    });
  }

  function nudgeGuide(which) {
    var rings = els.guideLayer.querySelectorAll('.guide-ring');
    if (rings[which]) {
      rings[which].classList.add('is-nudge');
      window.setTimeout(function () {
        if (rings[which]) rings[which].classList.remove('is-nudge');
      }, 1100);
    }
  }

  /* ---------------------------------------------------------
     7. 눈 붙이기
     --------------------------------------------------------- */
  function svgPoint(evt) {
    var svg = els.dollSvg;
    if (svg.createSVGPoint && svg.getScreenCTM) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      var ctm = svg.getScreenCTM();
      if (ctm) {
        var p = pt.matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
      }
    }
    var rect = svg.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) / rect.width) * 320,
      y: ((evt.clientY - rect.top) / rect.height) * 320
    };
  }

  function clampToDoll(p) {
    var c = DOLLS[state.doll].clamp;
    return {
      x: Math.min(c.x1, Math.max(c.x0, p.x)),
      y: Math.min(c.y1, Math.max(c.y0, p.y))
    };
  }

  function classify(d) {
    if (d <= CONFIG.accuracy.perfect) return 'perfect';
    if (d <= CONFIG.accuracy.good) return 'good';
    return 'defect';
  }

  function createEye(pos, kind) {
    var g = document.createElementNS(SVG_NS, 'g');
    var rot = 0;
    var scale = 1;
    var irisX = rand(-2.2, 2.2);
    var irisY = rand(-1.6, 1.6);

    if (kind === 'defect') {
      // 짝눈: 크기·각도·시선이 제멋대로 — 웃기지만 조금 불쌍한 표정
      rot = rand(-20, 20);
      scale = rand(0.66, 1.4);
      irisX = rand(-5.4, 5.4);
      irisY = rand(-5, 5);
    } else if (kind === 'good') {
      rot = rand(-4, 4);
      scale = rand(0.94, 1.06);
    }

    g.setAttribute('class', 'eye');
    g.setAttribute('transform',
      'translate(' + pos.x.toFixed(2) + ' ' + pos.y.toFixed(2) + ') rotate(' + rot.toFixed(1) + ') scale(' + scale.toFixed(2) + ')');

    g.innerHTML =
      '<g class="eye-inner">' +
        '<ellipse cx="0" cy="3" rx="15" ry="8" fill="#8a5a3a" opacity="0.08"/>' +
        '<ellipse class="eye-white" cx="0" cy="0" rx="15.5" ry="16.5"/>' +
        '<circle class="eye-iris" cx="' + irisX.toFixed(2) + '" cy="' + irisY.toFixed(2) + '" r="8.6"/>' +
        '<circle class="eye-glint" cx="' + (irisX - 3.1).toFixed(2) + '" cy="' + (irisY - 3.7).toFixed(2) + '" r="2.9"/>' +
        '<circle class="eye-glint" cx="' + (irisX + 3.4).toFixed(2) + '" cy="' + (irisY + 3.1).toFixed(2) + '" r="1.4" opacity="0.7"/>' +
      '</g>';

    return g;
  }

  function placeEye(index, tapPoint, kind) {
    var target = DOLLS[state.doll].eyes[index];
    var finalPos;

    if (kind === 'perfect') {
      finalPos = { x: target.x + rand(-0.8, 0.8), y: target.y + rand(-0.8, 0.8) };
    } else if (kind === 'good') {
      // 살짝 어긋나지만 귀엽게 보이도록 절반만 반영
      finalPos = { x: lerp(tapPoint.x, target.x, 0.6), y: lerp(tapPoint.y, target.y, 0.6) };
    } else {
      finalPos = tapPoint;
    }

    var eye = createEye(finalPos, kind);
    els.eyesLayer.appendChild(eye);
    SFX.play(kind === 'defect' ? 'pok' : 'tok');
    return eye;
  }

  function onDollPointerDown(evt) {
    if (evt.cancelable) evt.preventDefault();
    SFX.unlock();
    if (phase === 'locked' || phase === 'done') return;

    var p = svgPoint(evt);
    var d = DOLLS[state.doll];
    if (dist(p, d.center) > d.hitRadius) {
      updateHint('인형 얼굴을 톡톡 눌러 주세요!');
      return;
    }

    if (phase === 'left') {
      var dLeft = dist(p, d.eyes[0]);
      var dRight = dist(p, d.eyes[1]);
      // 오른쪽 눈을 먼저 찍으면 살짝 알려 주고 다시 받아요.
      if (dRight < 52 && dLeft > 60) {
        updateHint('왼쪽 눈부터 붙여요!');
        nudgeGuide(1);
        SFX.play('ui');
        shakeStage();
        return;
      }

      var kindL = classify(dLeft);
      var tapL = clampToDoll(p);
      taps.push({ x: tapL.x, y: tapL.y, acc: kindL, d: dLeft });
      placeEye(0, tapL, kindL);
      phase = 'right';
      updateHint(kindL === 'defect' ? '앗, 오른쪽 눈도 붙여요!' : '이제 오른쪽 눈!');
      renderGuide();
      if (kindL === 'defect') {
        // 첫눈부터 삐뚤어졌으면 표정이 조금 불안해져요.
        var mouth = document.getElementById('dollMouth');
        if (mouth) mouth.setAttribute('d', DOLLS[state.doll].sadMouth);
        els.dollSvg.classList.add('is-peek');
      }
      return;
    }

    if (phase === 'right') {
      var dR = dist(p, d.eyes[1]);
      var kindR = classify(dR);
      var tapR = clampToDoll(p);
      taps.push({ x: tapR.x, y: tapR.y, acc: kindR, d: dR });
      placeEye(1, tapR, kindR);
      renderGuide();
      finishDoll();
    }
  }

  function shakeStage() {
    els.stage.classList.remove('is-shake');
    void els.stage.offsetWidth;
    els.stage.classList.add('is-shake');
    window.setTimeout(function () { els.stage.classList.remove('is-shake'); }, 420);
  }

  /* ---------------------------------------------------------
     8. 인형 완성 · 정산
     --------------------------------------------------------- */
  function finishDoll() {
    phase = 'done';

    var allOk = taps.every(function (t) { return t.acc !== 'defect'; });
    var result = 'defect';
    if (allOk) {
      result = taps.every(function (t) { return t.acc === 'perfect'; }) ? 'perfect' : 'good';
    }

    // 콤보
    if (result === 'defect') {
      state.combo = 0;
      state.defects += 1;
    } else {
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
    }

    var grade = GRADES[state.gradeIndex];
    var base = CONFIG.pay[result];
    var boosted = isBoosted();
    var comboBonus = (result === 'defect' || state.combo < 2)
      ? 0
      : Math.min(state.combo * CONFIG.comboBonus.per, CONFIG.comboBonus.max);
    var pay = Math.round((base * grade.mult * (boosted ? 2 : 1)) / 10) * 10 + comboBonus;

    state.today += pay;
    state.total += 1;
    dollsMade += 1;

    // 박스 진행
    state.boxCount += 1;
    var boxFilled = state.boxCount >= CONFIG.boxSize;

    // 등급 변동
    var newGrade = gradeIndexFor(state.total);
    var gradeUp = newGrade !== state.gradeIndex;
    state.gradeIndex = newGrade;

    // 표정/연출
    els.dollSvg.classList.remove('is-float', 'is-peek');
    if (result === 'defect') {
      els.dollSvg.classList.add('is-ouch');
      var mouth = document.getElementById('dollMouth');
      if (mouth) mouth.setAttribute('d', DOLLS[state.doll].sadMouth);
      addSweatDrop();
      SFX.play('defect');
      shakeStage();
    } else {
      els.dollSvg.classList.add('is-happy');
      SFX.play(result === 'perfect' ? 'perfect' : 'good');
      if (state.combo > 0 && state.combo % 5 === 0) {
        SFX.play('combo');
        spawnConfetti(10);
      }
    }

    updateHint(result === 'defect' ? '짝눈 완성…' : '완성!');
    showVerdict(result, pay);
    floatPay(pay, boosted);
    setCaption(result === 'defect'
      ? '짝눈이 되어 버렸어요. <b>광고로 수선</b>하면 일당이 복구돼요!'
      : (result === 'perfect' ? '<b>완벽해요!</b> 다음 인형을 준비하고 있어요…' : '<b>좋아요!</b> 다음 인형을 준비하고 있어요…'));
    render();

    if (gradeUp) {
      window.setTimeout(function () {
        toast('숙련도 상승! ' + GRADES[state.gradeIndex].emoji + ' ' + GRADES[state.gradeIndex].name + '이 되었어요');
        SFX.play('combo');
      }, 650);
    }

    saveState();

    if (result === 'defect') {
      // 수선 제안 (8초)
      window.setTimeout(function () {
        if (boxFilled) return; // 박스 모달이 먼저 뜨는 경우는 넘어감
        openRepairOffer();
      }, 700);
    }

    // 다음 인형 / 박스 완성
    if (boxFilled) {
      boxPending = true;
      window.setTimeout(showBoxModal, 1150);
    } else {
      advanceTimer = window.setTimeout(newDoll, result === 'defect' ? 2600 : 1150);
    }
  }

  function showVerdict(result, pay) {
    els.verdict.hidden = false;
    els.verdict.className = 'verdict' +
      (result === 'good' ? ' is-good' : '') +
      (result === 'defect' ? ' is-defect' : '');
    els.verdictTitle.textContent = result === 'perfect' ? 'PERFECT!' : (result === 'good' ? 'GOOD' : '짝눈!');
    els.verdictSub.textContent = '+' + won(pay) + (result === 'defect' ? ' · 불량' : '');
    window.setTimeout(function () {
      if (phase !== 'done') return;
      els.verdict.hidden = true;
    }, 1500);
  }

  function floatPay(pay, boosted) {
    var el = document.createElement('span');
    el.className = 'float-text';
    el.textContent = '+' + won(pay) + (boosted ? ' (×2)' : '');
    el.style.left = '50%';
    el.style.top = '72%';
    els.popLayer.appendChild(el);
    window.setTimeout(function () { el.remove(); }, 1200);
  }

  function addSweatDrop() {
    var g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'sweat-drop');
    g.innerHTML =
      '<path d="M252 132 q9 14 0 20 q-9 -6 0 -20 z" fill="#8fd3f4" opacity="0.9" stroke="#5fb4dd" stroke-width="1.2"/>';
    els.fxLayer.appendChild(g);
  }

  function spawnConfetti(n) {
    var colors = ['#ff8e7a', '#ffc94d', '#6fc9b0', '#9da9ff', '#f28fb6'];
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i');
      b.className = 'confetti';
      b.style.left = rand(6, 92) + '%';
      b.style.top = rand(-4, 18) + '%';
      b.style.background = colors[Math.floor(Math.random() * colors.length)];
      b.style.animationDelay = (Math.random() * 0.3).toFixed(2) + 's';
      b.style.transform = 'rotate(' + rand(-40, 40) + 'deg)';
      els.popLayer.appendChild(b);
      (function (node) {
        window.setTimeout(function () { node.remove(); }, 1900);
      })(b);
    }
  }

  /* ---------------------------------------------------------
     9. 짝눈 수선
     --------------------------------------------------------- */
  function openRepairOffer() {
    if (state.defects <= 0) return;
    els.repairOffer.hidden = false;
    updateHint('광고로 수선할까요?');
    clearTimeout(advanceTimer);
    advanceTimer = window.setTimeout(function () {
      els.repairOffer.hidden = true;
      newDoll();
    }, 8000);
  }

  els.repairNow.addEventListener('click', function () {
    SFX.unlock();
    askAd({
      title: '짝눈 1회 수선',
      desc: '광고 시청 후 <b>짝눈 불량 1개</b>가 수선되고 일당이 복구돼요.',
      confirm: '광고 보고 수선',
      kind: 'rewardedRepair',
      onReward: function () {
        els.repairOffer.hidden = true;
        clearTimeout(advanceTimer);
        repairCurrentDefect(true);
        advanceTimer = window.setTimeout(newDoll, 1200);
      }
    });
  });

  els.repairSkip.addEventListener('click', function () {
    els.repairOffer.hidden = true;
    clearTimeout(advanceTimer);
    newDoll();
  });

  els.repairBtn.addEventListener('click', function () {
    SFX.unlock();
    if (state.defects <= 0) {
      toast('수선할 짝눈 불량이 없어요');
      return;
    }
    askAd({
      title: '짝눈 1회 수선',
      desc: '광고 시청 후 <b>짝눈 불량 1개</b>가 수선되고 일당이 복구돼요.',
      confirm: '광고 보고 수선',
      kind: 'rewardedRepair',
      onReward: function () {
        els.repairOffer.hidden = true;
        repairCurrentDefect(phase === 'done' && taps.some(function (t) { return t.acc === 'defect'; }));
      }
    });
  });

  function repairCurrentDefect(visual) {
    if (state.defects <= 0) return;
    state.defects -= 1;
    state.repaired += 1;

    var grade = GRADES[state.gradeIndex];
    var gap = (CONFIG.pay.perfect - CONFIG.pay.defect) * grade.mult * (isBoosted() ? 2 : 1);
    gap = Math.round(gap / 10) * 10;
    state.today += gap;

    if (visual) {
      animateRepair();
      els.verdict.hidden = false;
      els.verdict.className = 'verdict is-repair';
      els.verdictTitle.textContent = '수선 완료!';
      els.verdictSub.textContent = '+' + won(gap);
      els.dollSvg.classList.remove('is-ouch');
      els.dollSvg.classList.add('is-happy');
      var mouth = document.getElementById('dollMouth');
      if (mouth) mouth.setAttribute('d', defaultMouth());
      var sweat = els.fxLayer.querySelector('.sweat-drop');
      if (sweat) sweat.remove();
      spawnConfetti(8);
      SFX.play('perfect');
      window.setTimeout(function () {
        if (els.verdictTitle.textContent === '수선 완료!') els.verdict.hidden = true;
      }, 1400);
    } else {
      toast('짝눈 1개를 수선했어요 · +' + won(gap));
      SFX.play('good');
      if (advanceTimer == null && phase !== 'done') {
        // 새 인형이 이미 나온 상태 — 흐름 유지
      }
    }

    render();
    saveState();
  }

  function defaultMouth() {
    return state.doll === 'bear'
      ? 'M160 201 q-12 16 -25 5 M160 201 q12 16 25 5'
      : 'M160 212 q-10 13 -21 3 M160 212 q10 13 21 3';
  }

  // 눈 두 개를 제자리로 부드럽게 옮겨요.
  function animateRepair() {
    var targets = DOLLS[state.doll].eyes;
    var eyes = els.eyesLayer.querySelectorAll('.eye');
    eyes.forEach(function (eye, i) {
      var t = targets[i] || targets[0];
      var from = eye.transform.baseVal.consolidate
        ? readTransform(eye)
        : { x: t.x, y: t.y, rot: 0, scale: 1 };
      var start = performance.now();
      var dur = 450;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        var x = lerp(from.x, t.x, e);
        var y = lerp(from.y, t.y, e);
        var rot = lerp(from.rot, 0, e);
        var sc = lerp(from.scale, 1, e);
        eye.setAttribute('transform',
          'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + rot.toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
        var iris = eye.querySelector('.eye-iris');
        if (iris) {
          iris.setAttribute('cx', lerp(parseFloat(iris.getAttribute('cx')) || 0, 0.6, e).toFixed(2));
          iris.setAttribute('cy', lerp(parseFloat(iris.getAttribute('cy')) || 0, 0.4, e).toFixed(2));
        }
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    });
  }

  function readTransform(eye) {
    var m = eye.transform.baseVal.consolidate();
    if (!m) return { x: 160, y: 150, rot: 0, scale: 1 };
    var mtx = m.matrix;
    return {
      x: mtx.e,
      y: mtx.f,
      rot: Math.atan2(mtx.b, mtx.a) * 180 / Math.PI,
      scale: Math.sqrt(mtx.a * mtx.a + mtx.b * mtx.b)
    };
  }

  /* ---------------------------------------------------------
     10. 광고 브리지 + 데모 광고
     --------------------------------------------------------- */
  var AdBridge = {
    adapter: null,
    register: function (adapter) {
      if (adapter && typeof adapter.show === 'function') this.adapter = adapter;
    },
    show: function (kind) {
      if (this.adapter) {
        try {
          return Promise.resolve(this.adapter.show(kind, CONFIG.adGroupIds[kind]))
            .then(function (res) {
              return { rewarded: !!(res && res.rewarded) };
            })
            .catch(function () {
              return { rewarded: false, error: true };
            });
        } catch (e) {
          return Promise.resolve({ rewarded: false, error: true });
        }
      }
      return demoAd(kind);
    }
  };
  window.DollEyeAdBridge = AdBridge;

  function demoAd(kind) {
    return new Promise(function (resolve) {
      var rewarded = kind !== 'interstitialBoxComplete';
      var total = CONFIG.demoAdSeconds * 1000;
      var start = 0;

      els.adPlayerKind.textContent = rewarded ? '보상형 광고 (데모)' : '전면 광고 (데모)';
      els.adPlayerFill.style.width = '0%';
      els.adPlayerLeft.textContent = CONFIG.demoAdSeconds + '초';
      openModal('adPlayerModal');

      start = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - start) / total);
        els.adPlayerFill.style.width = (p * 100).toFixed(1) + '%';
        els.adPlayerLeft.textContent = Math.max(0, Math.ceil((total * (1 - p)) / 1000)) + '초';
        if (p < 1) {
          window.requestAnimationFrame(tick);
        } else {
          window.setTimeout(function () {
            closeModal('adPlayerModal');
            SFX.play('ui');
            resolve({ rewarded: rewarded });
          }, 320);
        }
      }
      window.requestAnimationFrame(tick);
    });
  }

  var pendingAd = null;

  function askAd(opts) {
    pendingAd = opts;
    els.adNoticeTitle.textContent = opts.title;
    els.adNoticeDesc.innerHTML = opts.desc;
    els.adConfirm.textContent = opts.confirm || '광고 보기';
    openModal('adNoticeModal');
  }

  els.adConfirm.addEventListener('click', function () {
    var job = pendingAd;
    pendingAd = null;
    closeModal('adNoticeModal');
    if (!job) return;
    AdBridge.show(job.kind).then(function (res) {
      if (res.rewarded) {
        if (job.onReward) job.onReward();
      } else {
        toast('광고를 끝까지 봐야 보상이 적용돼요');
        if (job.onNoReward) job.onNoReward();
      }
    });
  });

  els.adCancel.addEventListener('click', function () {
    pendingAd = null;
    closeModal('adNoticeModal');
  });

  /* 30초 일당 2배 */
  els.boostBtn.addEventListener('click', function () {
    SFX.unlock();
    if (isBoosted()) return;
    askAd({
      title: '30초 동안 일당 2배',
      desc: '광고 시청 후 <b>30초 동안 일당 2배</b>가 적용돼요.',
      confirm: '광고 보고 2배 받기',
      kind: 'rewardedDoubleWage',
      onReward: function () {
        state.boostUntil = Date.now() + CONFIG.boostSeconds * 1000;
        SFX.play('box');
        toast(CONFIG.boostSeconds + '초 동안 가상 일당 2배!');
        render();
        saveState();
        startBoostTimer();
      }
    });
  });

  function startBoostTimer() {
    if (boostInterval) return;
    boostInterval = window.setInterval(function () {
      if (!isBoosted()) {
        window.clearInterval(boostInterval);
        boostInterval = null;
        render();
        return;
      }
      renderBoost();
    }, 500);
  }

  /* ---------------------------------------------------------
     11. 박스 완성
     --------------------------------------------------------- */
  function showBoxModal() {
    if (!boxPending) return;
    state.boxesDone += 1;
    state.boxNum += 1;
    state.boxCount = 0;

    var bonus = Math.round(CONFIG.boxBonus * GRADES[state.gradeIndex].mult);
    state.today += bonus;

    els.boxModalNo.textContent = String(state.boxNum - 1);
    els.boxModalCount.textContent = String(CONFIG.boxSize);
    els.boxBonusText.textContent = '+' + won(bonus);
    els.boxSummary.innerHTML =
      '<span>오늘 포장<strong>' + state.boxesDone + '박스</strong></span>' +
      '<span>누적 인형<strong>' + state.total.toLocaleString('ko-KR') + '개</strong></span>' +
      '<span>최고 콤보<strong>' + state.bestCombo + '연속</strong></span>';

    burstBoxConfetti();
    openModal('boxModal');
    SFX.play('box');
    render();
    saveState();
  }

  function burstBoxConfetti() {
    if (!els.boxBurst) return;
    els.boxBurst.innerHTML = '';
    var colors = ['#ff8e7a', '#ffc94d', '#6fc9b0', '#9da9ff', '#f28fb6'];
    for (var i = 0; i < 22; i++) {
      var b = document.createElement('i');
      b.style.left = rand(2, 96) + '%';
      b.style.background = colors[i % colors.length];
      b.style.animationDelay = (Math.random() * 0.45).toFixed(2) + 's';
      b.style.transform = 'rotate(' + rand(-50, 50) + 'deg)';
      els.boxBurst.appendChild(b);
    }
  }

  els.boxAd.addEventListener('click', function () {
    closeModal('boxModal');
    AdBridge.show('interstitialBoxComplete').then(function () {
      startNextBox();
    });
  });

  els.boxSkip.addEventListener('click', function () {
    closeModal('boxModal');
    startNextBox();
  });

  function startNextBox() {
    boxPending = false;
    els.boxBurst.innerHTML = '';
    newDoll();
    toast('새 박스 ' + state.boxNum + ' 시작!');
    render();
  }

  /* ---------------------------------------------------------
     12. 화면 렌더
     --------------------------------------------------------- */
  function render() {
    els.totalDolls.textContent = state.total.toLocaleString('ko-KR');
    els.todayWage.textContent = won(state.today);

    var g = GRADES[state.gradeIndex];
    els.gradeEmoji.textContent = g.emoji;
    els.gradeName.textContent = g.name;

    var next = GRADES[state.gradeIndex + 1];
    if (next) {
      els.gradeNext.innerHTML = '다음 등급까지 <b>' + Math.max(0, next.min - state.total) + '</b>개';
      var span = next.min - g.min;
      var ratio = Math.min(1, Math.max(0, (state.total - g.min) / span));
      els.gradeFill.style.width = (ratio * 100).toFixed(1) + '%';
    } else {
      els.gradeNext.innerHTML = '<b>최고 등급</b> 달성!';
      els.gradeFill.style.width = '100%';
    }

    els.comboBadge.hidden = state.combo < 2;
    els.comboValue.textContent = state.combo;

    els.boxNo.textContent = state.boxNum;
    els.boxDone.textContent = state.boxCount;
    renderBoxDots();

    els.repairBadge.hidden = state.defects <= 0;
    els.repairBadge.textContent = state.defects;
    els.repairBtn.disabled = state.defects <= 0;

    renderBoost();

    els.soundBtn.classList.toggle('is-muted', state.muted);
    els.soundBtn.setAttribute('aria-pressed', String(!state.muted));
    els.soundBtn.setAttribute('aria-label', state.muted ? '소리 켜기' : '소리 끄기');

    els.guideBtn.setAttribute('aria-pressed', String(!!state.guide));
    els.guideBtn.setAttribute('aria-label', state.guide ? '눈 위치 가이드 켜짐' : '눈 위치 가이드 꺼짐');

    els.tabBear.classList.toggle('is-active', state.doll === 'bear');
    els.tabRabbit.classList.toggle('is-active', state.doll === 'rabbit');
    els.tabBear.setAttribute('aria-selected', String(state.doll === 'bear'));
    els.tabRabbit.setAttribute('aria-selected', String(state.doll === 'rabbit'));
  }

  function renderBoxDots() {
    if (els.boxDots.children.length !== CONFIG.boxSize) {
      els.boxDots.innerHTML = '';
      for (var i = 0; i < CONFIG.boxSize; i++) {
        var d = document.createElement('span');
        d.className = 'box-dot';
        els.boxDots.appendChild(d);
      }
    }
    for (var j = 0; j < els.boxDots.children.length; j++) {
      var dot = els.boxDots.children[j];
      dot.className = 'box-dot' +
        (j < state.boxCount ? ' is-on' : '') +
        (j === state.boxCount && state.boxCount < CONFIG.boxSize ? ' is-next' : '');
    }
  }

  function renderBoost() {
    var on = isBoosted();
    els.boostChip.hidden = !on;
    els.boostBtn.disabled = on;
    els.boostLabel.textContent = on ? '지금 일당 2배 적용 중' : '광고 보고 30초 일당 2배';
    if (on) {
      els.boostTimer.textContent = String(Math.max(0, Math.ceil((state.boostUntil - Date.now()) / 1000)));
    }
  }

  /* ---------------------------------------------------------
     13. 모달 · 토스트
     --------------------------------------------------------- */
  var lastFocus = null;

  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    var focusable = m.querySelector('button:not([disabled])');
    if (focusable) {
      window.setTimeout(function () { focusable.focus({ preventScroll: true }); }, 40);
    }
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }
  }

  function anyModalOpen() {
    return !!document.querySelector('.modal:not([hidden])');
  }

  var toastTimer = null;
  function toast(text) {
    els.toast.textContent = text;
    els.toast.hidden = false;
    els.toast.style.animation = 'none';
    void els.toast.offsetWidth;
    els.toast.style.animation = '';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { els.toast.hidden = true; }, 2000);
  }

  /* 모달 닫기 버튼(배경·X) */
  document.addEventListener('click', function (evt) {
    var t = evt.target.closest ? evt.target.closest('[data-close]') : null;
    if (!t) return;
    var id = t.getAttribute('data-close');
    if (id === 'adNoticeModal') pendingAd = null;
    closeModal(id);
  });

  document.addEventListener('keydown', function (evt) {
    if (evt.key === 'Escape') {
      var open = document.querySelector('.modal:not([hidden])');
      if (open && open.id !== 'adPlayerModal' && open.id !== 'boxModal') {
        closeModal(open.id);
      }
    }
  });

  /* ---------------------------------------------------------
     14. 소리 · 가이드 · 인형 전환
     --------------------------------------------------------- */
  els.soundBtn.addEventListener('click', function () {
    SFX.unlock();
    state.muted = !state.muted;
    SFX.setMuted(state.muted);
    if (!state.muted) SFX.play('ui');
    render();
    saveState();
    toast(state.muted ? '소리를 껐어요' : '소리를 켰어요');
  });

  els.guideBtn.addEventListener('click', function () {
    SFX.unlock();
    state.guide = !state.guide;
    renderGuide();
    render();
    saveState();
    SFX.play('ui');
    toast(state.guide ? '눈 위치 가이드를 켰어요' : '가이드 없이 감으로 톡톡!');
  });

  function switchDoll(doll) {
    if (state.doll === doll) return;
    if (phase === 'done' || phase === 'locked' || boxPending) {
      toast('이번 인형을 마무리한 뒤 바꿀 수 있어요');
      return;
    }
    SFX.unlock();
    state.doll = doll;
    SFX.play('ui');
    newDoll();
    render();
    saveState();
    toast(DOLLS[doll].name + '로 바꿨어요');
  }

  els.tabBear.addEventListener('click', function () { switchDoll('bear'); });
  els.tabRabbit.addEventListener('click', function () { switchDoll('rabbit'); });

  /* ---------------------------------------------------------
     15. 뒤로가기 · 종료 확인
     --------------------------------------------------------- */
  var guardPushed = false;

  function pushGuard() {
    try {
      window.history.pushState({ dollEyeJob: true }, '');
      guardPushed = true;
    } catch (e) { /* noop */ }
  }

  function requestExit() {
    if (anyModalOpen()) {
      var open = document.querySelector('.modal:not([hidden])');
      if (open && open.id !== 'adPlayerModal') closeModal(open.id);
      return;
    }
    els.exitTotal.textContent = state.total.toLocaleString('ko-KR');
    openModal('exitModal');
    SFX.play('ui');
  }

  function leaveApp() {
    closeModal('exitModal');
    // 실제 앱에서는 호스트(앱인토스 WebView)가 앱을 닫아요.
    if (window.DollEyeHost && typeof window.DollEyeHost.exit === 'function') {
      window.DollEyeHost.exit();
      return;
    }
    toast('앱인토스 앱에서는 이 화면에서 앱이 종료돼요');
  }

  els.exitStay.addEventListener('click', function () {
    closeModal('exitModal');
  });
  els.exitLeave.addEventListener('click', leaveApp);

  window.addEventListener('popstate', function () {
    if (anyModalOpen()) {
      var open = document.querySelector('.modal:not([hidden])');
      if (open && open.id === 'adPlayerModal') {
        pushGuard();
        return; // 광고 중에는 뒤로가기로 닫지 않아요
      }
      if (open) closeModal(open.id);
      pushGuard();
      return;
    }
    requestExit();
    pushGuard();
  });

  els.backBtn.addEventListener('click', function () {
    requestExit();
  });

  /* ---------------------------------------------------------
     16. 가상 일당 안내 · 초기화
     --------------------------------------------------------- */
  els.wageInfoBtn.addEventListener('click', function () {
    openModal('wageModal');
  });

  els.resetBtn.addEventListener('click', function () {
    try { window.localStorage.removeItem(CONFIG.storageKey); } catch (e) { /* noop */ }
    state = defaultState();
    state.gradeIndex = 0;
    window.DollEyeApp.state = state;
    SFX.setMuted(state.muted);
    closeModal('wageModal');
    newDoll();
    render();
    saveState();
    toast('기록을 초기화했어요');
  });

  /* ---------------------------------------------------------
     17. 시작
     --------------------------------------------------------- */
  function init() {
    loadState();
    SFX.setMuted(!!state.muted);

    if (state.boxCount >= CONFIG.boxSize) state.boxCount = 0;
    state.gradeIndex = gradeIndexFor(state.total);

    els.boxSize.textContent = String(CONFIG.boxSize);
    els.dollSvg.addEventListener('pointerdown', onDollPointerDown);

    // iOS 사파리/토스 웹뷰 오디오 잠금 해제: 첫 터치마다 확인
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (type) {
      document.addEventListener(type, function () { SFX.unlock(); }, { passive: true });
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        SFX.resume();
        render();
      }
      saveState();
    });
    window.addEventListener('pagehide', saveState);

    render();
    renderBoxDots();
    newDoll();
    render();

    if (state.boostUntil > Date.now()) startBoostTimer();

    // 뒤로가기 가드 (첫 화면에서 종료 확인 모달)
    pushGuard();
  }

  window.DollEyeApp = {
    requestExit: requestExit,
    state: state,
    CONFIG: CONFIG,
    toast: toast
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
