/* =========================================================
   인형 눈알 붙이기 — app.js
   앱인토스(App in Toss) 비게임(엔터테인먼트) 미니앱 프로토타입
   - 목탁 두드리기 스타일 UI: 큰 인형 · 얇은 진행 바 · 아이콘 탭 바
   - 점수·판정·콤보·등급·미션 없이 "붙이며 잠깐 쉬어가기"
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

    // 웹 공유 링크 (친구에게 공유)
    appUrl: 'https://bubble-collab.github.io/doll-eye-job/',

    // 오늘의 목표: 목탁처럼 "은은한 목표 감각"만 주는 숫자예요.
    dailyGoal: 100,

    // 인형 1개를 완성할 때 쌓이는 가상 기록 (실제 부업 후기처럼 소박한 단가 · 지급 없음)
    recordPerDoll: 30,

    // 광고 보상
    focusSeconds: 30,       // "30초 집중 모드" (가상 기록 2배)
    demoAdSeconds: 5,       // 프로토타입 데모 광고 길이(초)

    // 인형 몇 개마다 가벼운 쉼표 배너를 띄울지 (흐름을 끊지 않음)
    restEvery: 10,

    // 눈 자리에 이 반경 안으로 누르면 살짝 맞춰 붙여요. 밖이면 누른 곳에 그대로.
    snapRadius: 26,

    // 이 개수까지는 가이드가 또렷하고, 이후에는 은은해져요.
    guideStrongDolls: 3,

    // 매일 알림 희망 시각 (KST)
    notifyTime: '20:00',

    storageKey: 'doll-eye-job.v2',

    /* ★ 사업자 등록 후 토스 프로모션으로 보상을 지급할 때 쓰는 자리예요.
       - 지금은 빈 문자열: 앱은 아무 보상도 요청하지 않고 기록만 쌓아요.
       - 콘솔에서 프로모션을 만들고 코드를 발급받으면 여기에 넣어 주세요.
       - 실제 지급은 호스트(SDK)에서 window.DollEyePromotion.register(...)로 연결합니다.
       - README 「프로모션 보상 연동」 항목을 참고하세요. */
    promotionCode: '',

    /* ★ 앱마다 새로 발급받은 광고 그룹 ID를 넣어 주세요.
       - 다른 앱에서 쓰던 ID를 재사용하면 정적 분석에서 반려될 수 있어요.
       - 지금 값은 앱인토스 문서의 테스트용 ID예요. */
    adGroupIds: {
      rewardedFocus: 'ait-ad-test-rewarded-id',
      rewardedSpecialRibbon: 'ait-ad-test-rewarded-id',
      interstitialRest: 'ait-ad-test-interstitial-id',
      bannerBottom: 'ait-ad-test-banner-id'
    }
  };

  /* 배경 테마: 크림 · 살구 · 민트 · 버터 · 라벤더 (+ 광고로 여는 스페셜) */
  var THEMES = [
    { name: '크림',   bg: '#F6F3EB', sheet: '#F5F0E4', soft: '#F1EDE1', line: '#E7E1D2', swatch: '#EFE9DA' },
    { name: '살구',   bg: '#F9EFE7', sheet: '#F7EBE2', soft: '#F4E8DF', line: '#EEDFD3', swatch: '#EBC3AE' },
    { name: '민트',   bg: '#EFF4EF', sheet: '#EAF1EA', soft: '#E7EEE7', line: '#DEE8DE', swatch: '#B9D4C2' },
    { name: '버터',   bg: '#F8F3E3', sheet: '#F6EFDC', soft: '#F2EBD7', line: '#EAE2CA', swatch: '#E4D296' },
    { name: '라벤더', bg: '#F2F0F7', sheet: '#EFEDF6', soft: '#ECE9F3', line: '#E4E0ED', swatch: '#C6BFDE' },
    { name: '스페셜', bg: '#FBF0E0', sheet: '#F9EDDB', soft: '#F6E7D2', line: '#EFDFC8', swatch: 'special' }
  ];

  /* 완성했을 때 건네는 한 줄 (판정 없음 · 실제 부업 후기 감성) */
  var HEAL_LINES = [
    '본드 콕! 깔끔하게 붙었어요',
    '눈알 위치 딱이네요',
    '손가락에 본드 묻은 느낌…',
    '잠깐 허리 한번 펴세요!',
    '오늘 할당량 순항 중!',
    '이 정도면 상품으로 나갈 만해요',
    '하나 더, 손이 익었네요',
    '잡생각은 본드 굳기 전에 떼어냈어요'
  ];
  /* 살짝 비뚤게 붙었을 때: 불량이 아니라 개성으로 */
  var CUTE_LINES = [
    '살짝 삐뚤어도 개성 있는 표정!',
    '이건 윙크로 나갑니다',
    '눈알이 노는 중… 귀엽네요',
    '봉제선 살짝 벗어났지만 합격!'
  ];
  var REST_LINES = [
    '허리 한번 펴고, 물 한 모금 마셔요.',
    '손목 돌리고 어깨 툭툭 털어 봐요.',
    '10개 채웠어요. 잠깐 창밖 보고 올까요?',
    '눈 한번 깜빡이고 다시 시작해요.',
    '오늘도 충분히 잘하고 있어요.'
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------
     2. 인형 그림 (SVG)
     --------------------------------------------------------- */
  function bearBody() {
    return '' +
      '<g filter="url(#plushShadow)">' +
        // 왼쪽 귀
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
        '<ellipse cx="160" cy="212" rx="52" ry="37" fill="url(#muzzleBear)"/>' +
        '<path d="M146 192 q14 -9 28 0 q-4 15 -14 17 q-10 -2 -14 -17 z" fill="#4b2e22"/>' +
        '<ellipse cx="154" cy="196" rx="4.4" ry="2.6" fill="#ffffff" opacity="0.55"/>' +
        '<path id="dollMouth" d="M160 209 q-12 15 -25 5 M160 209 q12 15 25 5" fill="none" stroke="#6a4028" stroke-width="3.4" stroke-linecap="round"/>' +
        // 볼터치
        '<ellipse cx="78" cy="196" rx="17" ry="9.5" fill="#f08c82" opacity="0.34"/>' +
        '<ellipse cx="242" cy="196" rx="17" ry="9.5" fill="#f08c82" opacity="0.34"/>' +
      '</g>';
  }

  function rabbitBody() {
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
        '<ellipse cx="160" cy="220" rx="46" ry="31" fill="url(#muzzleRabbit)"/>' +
        '<path d="M151 206 q9 -7 18 0 q-3 9 -9 10 q-6 -1 -9 -10 z" fill="#f08a96"/>' +
        '<path id="dollMouth" d="M160 216 q-10 13 -21 3 M160 216 q10 13 21 3" fill="none" stroke="#8a5a44" stroke-width="3.1" stroke-linecap="round"/>' +
        // 수염
        '<g stroke="#b99a82" stroke-width="2" stroke-linecap="round" opacity="0.5">' +
          '<path d="M114 212 q-22 -5 -34 -11"/>' +
          '<path d="M114 221 q-24 2 -36 0"/>' +
          '<path d="M206 212 q22 -5 34 -11"/>' +
          '<path d="M206 221 q24 2 36 0"/>' +
        '</g>' +
        // 볼터치
        '<ellipse cx="82" cy="206" rx="17" ry="9.5" fill="#f49aa6" opacity="0.4"/>' +
        '<ellipse cx="238" cy="206" rx="17" ry="9.5" fill="#f49aa6" opacity="0.4"/>' +
      '</g>';
  }

  var DOLLS = {
    bear: {
      name: '곰돌이',
      body: bearBody,
      viewBox: '42 46 236 248',
      eyes: [{ x: 118, y: 142 }, { x: 202, y: 142 }],
      center: { x: 160, y: 160 },
      hitRadius: 150,
      clamp: { x0: 86, x1: 234, y0: 108, y1: 200 }
    },
    rabbit: {
      name: '토끼',
      body: rabbitBody,
      viewBox: '42 0 236 294',
      eyes: [{ x: 124, y: 158 }, { x: 196, y: 158 }],
      center: { x: 160, y: 182 },
      hitRadius: 150,
      clamp: { x0: 92, x1: 228, y0: 132, y1: 212 }
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
      // 눈이 자리에 톡 붙는 소리
      tok: function () {
        noise({ dur: 0.05, freq: 2400, gain: 0.2 });
        tone({ freq: 900, to: 320, dur: 0.07, gain: 0.16, type: 'sine' });
      },
      // 살짝 다른 자리에 붙는 소리 (더 부드럽게)
      pok: function () {
        noise({ dur: 0.06, freq: 900, gain: 0.15 });
        tone({ freq: 460, to: 300, dur: 0.11, gain: 0.14, type: 'triangle' });
      },
      // 인형 완성
      chime: function () {
        tone({ freq: 784, dur: 0.14, gain: 0.15, type: 'sine' });
        tone({ freq: 1046.5, dur: 0.24, gain: 0.13, type: 'sine', delay: 0.08 });
        tone({ freq: 1568, dur: 0.2, gain: 0.05, type: 'sine', delay: 0.16 });
      },
      // 목표 달성 / 리본 열림
      fanfare: function () {
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          tone({ freq: f, dur: 0.3, gain: 0.13, type: 'triangle', delay: i * 0.09 });
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
    // 기기 시간대와 무관하게 한국 날짜 기준으로 초기화해요.
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
      total: 0,          // 누적 완성 인형
      todayCount: 0,     // 오늘 완성 인형
      todayRecord: 0,    // 오늘의 가상 기록(원)
      sinceRest: 0,      // 마지막 쉼표 배너 이후 완성 수
      goalDone: false,   // 오늘 목표 달성 표시
      promotionGranted: false,
      specialRibbon: false,
      theme: 0,          // 배경 테마 인덱스 (0 크림 · 1 살구 · 2 민트 · 3 버터 · 4 라벤더 · 5 스페셜)
      focusUntil: 0,
      guide: true,
      muted: false,
      accentSeed: 0,
      notify: false,     // 매일 알림 동의 여부 (로컬 저장)
      notifyAt: '20:00'
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
      state.todayCount = 0;
      state.todayRecord = 0;
      state.sinceRest = 0;
      state.goalDone = false;
      state.promotionGranted = false;
      state.focusUntil = 0;
    }
    if (!DOLLS[state.doll]) state.doll = 'bear';
    state.theme = Number(state.theme);
    if (!THEMES[state.theme]) state.theme = 0;
    if (state.theme === 5 && !state.specialRibbon) state.theme = 0;
    state.total = Math.max(0, Number(state.total) || 0);
    state.todayCount = Math.max(0, Number(state.todayCount) || 0);
    state.todayRecord = Math.max(0, Number(state.todayRecord) || 0);
    state.sinceRest = Math.max(0, Math.min(CONFIG.restEvery, Number(state.sinceRest) || 0));
    state.notify = !!state.notify;
    if (!state.notifyAt) state.notifyAt = CONFIG.notifyTime;
  }

  var saveTimer = null;
  function saveState() {
    if (saveTimer) return;
    saveTimer = window.setTimeout(function () {
      saveTimer = null;
      try {
        window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
      } catch (e) { /* 저장 공간이 없어도 계속 동작 */ }
    }, 120);
  }

  function isFocus() {
    return Date.now() < state.focusUntil;
  }

  function won(n) {
    return Math.round(n).toLocaleString('ko-KR') + '원';
  }

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* ---------------------------------------------------------
     5. DOM
     --------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  var els = {
    backBtn: $('backBtn'),
    progressWrap: document.querySelector('.progress'),
    progressLabel: $('progressLabel'),
    progressBar: $('progressBar'),
    progressFill: $('progressFill'),
    remainCount: $('remainCount'),
    focusPill: $('focusPill'),
    focusTimer: $('focusTimer'),
    todayCount: $('todayCount'),
    summaryRight: $('summaryRight'),
    stage: $('stage'),
    hint: $('hint'),
    dollSvg: $('dollSvg'),
    bodyLayer: $('bodyLayer'),
    guideLayer: $('guideLayer'),
    eyesLayer: $('eyesLayer'),
    fxLayer: $('fxLayer'),
    popLayer: $('popLayer'),
    restBanner: $('restBanner'),
    restBannerCount: $('restBannerCount'),
    tabDoll: $('tabDoll'),
    tabTheme: $('tabTheme'),
    tabSound: $('tabSound'),
    tabBoost: $('tabBoost'),
    tabMore: $('tabMore'),
    moreSheet: $('moreSheet'),
    dollSheet: $('dollSheet'),
    themeSheet: $('themeSheet'),
    shareBtn: $('shareBtn'),
    notifyBtn: $('notifyBtn'),
    notifyNote: $('notifyNote'),
    recordBtn: $('recordBtn'),
    aboutBtn: $('aboutBtn'),
    swatches: $('swatches'),
    ribbonRow: $('ribbonRow'),
    ribbonNote: $('ribbonNote'),
    optBear: $('optBear'),
    optRabbit: $('optRabbit'),
    notifySheet: $('notifySheet'),
    notifyTitle: $('notifyTitle'),
    notifySub: $('notifySub'),
    notifyPreview: $('notifyPreview'),
    notifyConsent: $('notifyConsent'),
    notifyAgree: $('notifyAgree'),
    notifyLater: $('notifyLater'),
    exitModal: $('exitModal'),
    exitTotal: $('exitTotal'),
    exitStay: $('exitStay'),
    exitLeave: $('exitLeave'),
    recordModal: $('recordModal'),
    statTotal: $('statTotal'),
    statToday: $('statToday'),
    guideSwitch: $('guideSwitch'),
    resetBtn: $('resetBtn'),
    aboutModal: $('aboutModal'),
    adNoticeModal: $('adNoticeModal'),
    adNoticeTitle: $('adNoticeTitle'),
    adNoticeDesc: $('adNoticeDesc'),
    adConfirm: $('adConfirm'),
    adCancel: $('adCancel'),
    adPlayerModal: $('adPlayerModal'),
    adPlayerKind: $('adPlayerKind'),
    adPlayerLeft: $('adPlayerLeft'),
    adPlayerFill: $('adPlayerFill'),
    restModal: $('restModal'),
    restTitle: $('restTitle'),
    restMessage: $('restMessage'),
    restSummary: $('restSummary'),
    restBurst: $('restBurst'),
    restSkip: $('restSkip'),
    restAd: $('restAd'),
    toast: $('toast')
  };

  /* ---------------------------------------------------------
     6. 흐름 상태
     --------------------------------------------------------- */
  var phase = 'left';        // 'left' | 'right' | 'done'
  var taps = [];
  var advanceTimer = null;
  var focusInterval = null;
  var bannerTimer = null;
  var dollsMade = 0;         // 이번 실행에서 만든 인형 수(가이드 세기용)

  function newDoll() {
    clearTimeout(advanceTimer);
    advanceTimer = null;

    phase = 'left';
    taps = [];
    els.eyesLayer.innerHTML = '';
    els.fxLayer.innerHTML = '';
    els.dollSvg.setAttribute('viewBox', DOLLS[state.doll].viewBox);
    els.bodyLayer.innerHTML = DOLLS[state.doll].body();
    els.dollSvg.classList.remove('is-happy', 'is-peek', 'is-enter', 'is-float');
    els.dollSvg.classList.add('is-enter');
    window.setTimeout(function () {
      els.dollSvg.classList.remove('is-enter');
      els.dollSvg.classList.add('is-float');
    }, 440);

    setHint('왼쪽 눈을 톡 눌러 보세요');
    renderGuide();
    saveState();
  }

  function setHint(text, reaction) {
    els.hint.textContent = text;
    if (reaction) {
      els.hint.classList.remove('is-reaction');
      void els.hint.offsetWidth;
      els.hint.classList.add('is-reaction');
    } else {
      els.hint.classList.remove('is-reaction');
    }
  }

  /* ---------------------------------------------------------
     7. 톡톡 가이드 (점선 원 + 깜빡이는 포인터)
     --------------------------------------------------------- */
  function tapTargetMarkup(x, y, soft) {
    return '' +
      '<circle class="guide-halo" cx="' + x + '" cy="' + y + '" r="34"/>' +
      '<circle class="guide-ring' + (soft ? ' is-soft' : '') + '" cx="' + x + '" cy="' + y + '" r="27"/>' +
      '<g class="tap-pointer">' +
        '<g class="tap-pointer__bob">' +
          '<circle cx="' + x + '" cy="' + y + '" r="17" fill="#FFFCF4"/>' +
          '<text class="tap-pointer__label" x="' + x + '" y="' + (y + 4.6) + '" text-anchor="middle">톡</text>' +
        '</g>' +
      '</g>';
  }

  function renderGuide() {
    els.guideLayer.innerHTML = '';
    if (!state.guide) return;
    if (phase !== 'left' && phase !== 'right') return;

    var index = Math.min(taps.length, 1);
    var pt = DOLLS[state.doll].eyes[index];
    var soft = dollsMade >= CONFIG.guideStrongDolls;

    var markup = tapTargetMarkup(pt.x, pt.y, soft);

    els.guideLayer.innerHTML = markup;
  }

  function nudgeGuide() {
    var ring = els.guideLayer.querySelector('.guide-ring');
    if (!ring) return;
    ring.classList.add('is-nudge');
    window.setTimeout(function () { ring.classList.remove('is-nudge'); }, 1100);
  }

  /* ---------------------------------------------------------
     8. 눈 붙이기
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

  /* 눈알: 큼직하고 똘망똘망하게 (하이라이트 반짝이 2개) */
  function createEye(pos, style) {
    var g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'eye');
    g.setAttribute('transform',
      'translate(' + pos.x.toFixed(2) + ' ' + pos.y.toFixed(2) +
      ') rotate(' + style.rot.toFixed(1) + ') scale(' + style.scale.toFixed(3) + ')');

    var irisX = style.irisX;
    var irisY = style.irisY;

    g.innerHTML =
      '<g class="eye-inner">' +
        // 살짝 뜬 그림자
        '<ellipse cx="0" cy="5" rx="20" ry="10" fill="#8a5a3a" opacity="0.1"/>' +
        // 흰자 (큼직)
        '<ellipse class="eye-white" cx="0" cy="0" rx="21.5" ry="23"/>' +
        // 홍채
        '<circle class="eye-iris" cx="' + irisX.toFixed(2) + '" cy="' + irisY.toFixed(2) + '" r="12.6"/>' +
        // 반짝이 2개
        '<circle class="eye-glint" cx="' + (irisX - 4.6).toFixed(2) + '" cy="' + (irisY - 5.2).toFixed(2) + '" r="4.3"/>' +
        '<circle class="eye-glint" cx="' + (irisX + 4.8).toFixed(2) + '" cy="' + (irisY + 4.4).toFixed(2) + '" r="2.1" opacity="0.75"/>' +
      '</g>';

    return g;
  }

  function placeEye(index, tapPoint) {
    var target = DOLLS[state.doll].eyes[index];
    var d = dist(tapPoint, target);
    var snapped = d <= CONFIG.snapRadius;
    var pos = snapped
      ? { x: target.x + rand(-1.4, 1.4), y: target.y + rand(-1.4, 1.4) }
      : clampToDoll(tapPoint);

    var style = snapped
      ? { rot: rand(-3, 3), scale: rand(0.98, 1.02), irisX: rand(-2.4, 2.4), irisY: rand(-1.8, 1.8) }
      : { rot: rand(-8, 8), scale: rand(0.9, 1.1), irisX: rand(-4.4, 4.4), irisY: rand(-3.4, 3.4) };

    els.eyesLayer.appendChild(createEye(pos, style));
    taps.push({ snapped: snapped, x: pos.x, y: pos.y });
    SFX.play(snapped ? 'tok' : 'pok');
    ripple(pos.x, pos.y);
    return snapped;
  }

  function ripple(x, y) {
    var c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', 24);
    c.setAttribute('class', 'ripple');
    els.fxLayer.appendChild(c);

    // 본드가 톡 눌리며 살짝 번지는 느낌
    var glue = document.createElementNS(SVG_NS, 'ellipse');
    glue.setAttribute('cx', x);
    glue.setAttribute('cy', y);
    glue.setAttribute('rx', 19);
    glue.setAttribute('ry', 17);
    glue.setAttribute('class', 'glue');
    els.fxLayer.appendChild(glue);

    window.setTimeout(function () {
      c.remove();
      glue.remove();
    }, 620);
  }

  function onDollPointerDown(evt) {
    if (evt.cancelable) evt.preventDefault();
    SFX.unlock();
    if (phase !== 'left' && phase !== 'right') return;

    var p = svgPoint(evt);
    var d = DOLLS[state.doll];
    if (dist(p, d.center) > d.hitRadius) {
      setHint('인형 얼굴을 톡톡 눌러 보세요');
      return;
    }

    if (phase === 'left') {
      var dLeft = dist(p, d.eyes[0]);
      var dRight = dist(p, d.eyes[1]);
      // 오른쪽 눈을 먼저 누르면 살짝만 알려 주고, 벌점 없이 다시 받아요.
      if (dRight + 10 < dLeft && dRight < 60) {
        setHint('왼쪽 눈부터 톡!');
        nudgeGuide();
        SFX.play('ui');
        return;
      }
      placeEye(0, p);
      phase = 'right';
      setHint('이제 오른쪽 눈!');
      renderGuide();
      return;
    }

    placeEye(1, p);
    finishDoll();
  }

  /* ---------------------------------------------------------
     9. 인형 완성 (판정 없음 · 끊김 없이 다음 인형)
     --------------------------------------------------------- */
  function finishDoll() {
    phase = 'done';

    var skewed = taps.some(function (t) { return !t.snapped; });

    state.total += 1;
    state.todayCount += 1;
    state.sinceRest += 1;
    dollsMade += 1;

    var gain = CONFIG.recordPerDoll * (isFocus() ? 2 : 1);
    state.todayRecord += gain;

    els.dollSvg.classList.remove('is-float', 'is-peek');
    els.dollSvg.classList.add('is-happy');
    SFX.play('chime');
    spawnSparkles(skewed ? 6 : 4);
    if (!skewed) spawnConfetti(6);

    var line;
    if (skewed) {
      line = pick(CUTE_LINES);
    } else if (Math.random() < 0.22) {
      line = '귀여운 ' + DOLLS[state.doll].name + ' 완성!';
    } else {
      line = pick(HEAL_LINES);
    }
    setHint(line, true);

    render();
    saveState();

    checkGoal();

    // 쉼표 배너 (흐름을 끊지 않는 가벼운 알림)
    if (state.sinceRest >= CONFIG.restEvery) {
      state.sinceRest = 0;
      showRestBanner();
    }

    // 바로 다음 눈 없는 인형이 올라와요.
    advanceTimer = window.setTimeout(newDoll, 1150);
  }

  function checkGoal() {
    if (!state.goalDone && state.todayCount >= CONFIG.dailyGoal) {
      state.goalDone = true;
      spawnConfetti(18);
      SFX.play('fanfare');
      toast('오늘의 목표 ' + CONFIG.dailyGoal + '개 달성!');
      maybeGrantPromotion();
      render();
    }
  }

  /* 프로모션 자리: 설정과 호스트 연결이 있을 때만 조용히 호출돼요. */
  function maybeGrantPromotion() {
    if (!CONFIG.promotionCode) return;
    if (state.promotionGranted) return;
    state.promotionGranted = true;
    saveState();
    PromotionBridge.grant(CONFIG.promotionCode).then(function (res) {
      if (res && res.granted) toast('오늘의 목표 보상이 적용됐어요');
    }).catch(function () { /* 실패해도 앱은 계속 */ });
  }

  function spawnConfetti(n) {
    var colors = ['#E98A76', '#E7B959', '#79C4AE', '#9AA6E6', '#E398B4'];
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i');
      b.className = 'confetti';
      b.style.left = rand(10, 90) + '%';
      b.style.top = rand(-2, 14) + '%';
      b.style.background = colors[Math.floor(Math.random() * colors.length)];
      b.style.animationDelay = (Math.random() * 0.25).toFixed(2) + 's';
      b.style.transform = 'rotate(' + rand(-40, 40) + 'deg)';
      els.popLayer.appendChild(b);
      (function (node) {
        window.setTimeout(function () { node.remove(); }, 1900);
      })(b);
    }
  }

  function spawnSparkles(n) {
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      s.textContent = '✦';
      s.style.left = rand(22, 78) + '%';
      s.style.top = rand(24, 52) + '%';
      s.style.animationDelay = (Math.random() * 0.2).toFixed(2) + 's';
      els.popLayer.appendChild(s);
      (function (node) {
        window.setTimeout(function () { node.remove(); }, 1100);
      })(s);
    }
  }

  /* ---------------------------------------------------------
     10. 쉼표 배너 · 쉬어가는 카드
     --------------------------------------------------------- */
  function showRestBanner() {
    els.restBannerCount.textContent = String(CONFIG.restEvery);
    els.restBanner.hidden = false;
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(hideRestBanner, 7000);
  }

  function hideRestBanner() {
    window.clearTimeout(bannerTimer);
    bannerTimer = null;
    els.restBanner.hidden = true;
  }

  function openRestCard() {
    hideRestBanner();
    els.restTitle.textContent = '인형 ' + CONFIG.restEvery + '개 완성!';
    els.restMessage.textContent = pick(REST_LINES);
    els.restSummary.innerHTML =
      '<span>오늘 완성<strong>' + state.todayCount.toLocaleString('ko-KR') + '개</strong></span>' +
      '<span>오늘의 가상 기록<strong>' + won(state.todayRecord) + '</strong></span>';
    burstRestConfetti();
    openOverlay('restModal');
    SFX.play('ui');
  }

  function burstRestConfetti() {
    els.restBurst.innerHTML = '';
    var colors = ['#E98A76', '#E7B959', '#79C4AE', '#9AA6E6', '#E398B4'];
    for (var i = 0; i < 16; i++) {
      var b = document.createElement('i');
      b.style.left = rand(2, 96) + '%';
      b.style.background = colors[i % colors.length];
      b.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
      b.style.transform = 'rotate(' + rand(-50, 50) + 'deg)';
      els.restBurst.appendChild(b);
    }
  }

  els.restBanner.addEventListener('click', function () {
    SFX.unlock();
    openRestCard();
  });

  els.restAd.addEventListener('click', function () {
    closeOverlay('restModal');
    AdBridge.show('interstitialRest').then(function () {
      SFX.play('ui');
      toast('이어서 톡톡!');
    });
  });

  els.restSkip.addEventListener('click', function () {
    closeOverlay('restModal');
    SFX.play('ui');
  });

  /* ---------------------------------------------------------
     11. 광고 브리지 + 데모 광고
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

  /* 프로모션 브리지 (사업자 등록 + 프로모션 코드 발급 후 호스트에서 연결) */
  var PromotionBridge = {
    adapter: null,
    register: function (adapter) {
      if (adapter && typeof adapter.grant === 'function') this.adapter = adapter;
    },
    grant: function (code) {
      if (!this.adapter) return Promise.resolve({ granted: false, stub: true });
      try {
        return Promise.resolve(this.adapter.grant(code));
      } catch (e) {
        return Promise.resolve({ granted: false, error: true });
      }
    }
  };
  window.DollEyePromotion = PromotionBridge;

  function demoAd(kind) {
    return new Promise(function (resolve) {
      var rewarded = kind !== 'interstitialRest';
      var total = CONFIG.demoAdSeconds * 1000;

      els.adPlayerKind.textContent = rewarded ? '보상형 광고 (데모)' : '전면 광고 (데모)';
      els.adPlayerFill.style.width = '0%';
      els.adPlayerLeft.textContent = CONFIG.demoAdSeconds + '초';
      openOverlay('adPlayerModal');

      var start = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - start) / total);
        els.adPlayerFill.style.width = (p * 100).toFixed(1) + '%';
        els.adPlayerLeft.textContent = Math.max(0, Math.ceil((total * (1 - p)) / 1000)) + '초';
        if (p < 1) {
          window.requestAnimationFrame(tick);
        } else {
          window.setTimeout(function () {
            closeOverlay('adPlayerModal');
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
    openOverlay('adNoticeModal');
  }

  els.adConfirm.addEventListener('click', function () {
    var job = pendingAd;
    pendingAd = null;
    closeOverlay('adNoticeModal');
    if (!job) return;
    AdBridge.show(job.kind).then(function (res) {
      if (res.rewarded) {
        if (job.onReward) job.onReward();
      } else {
        toast('광고를 끝까지 봐야 적용돼요');
        if (job.onNoReward) job.onNoReward();
      }
    });
  });

  els.adCancel.addEventListener('click', function () {
    pendingAd = null;
    closeOverlay('adNoticeModal');
  });

  /* 30초 집중 모드 (부스터) */
  function startFocusMode() {
    if (isFocus()) {
      toast('집중 모드 ' + Math.ceil((state.focusUntil - Date.now()) / 1000) + '초 남았어요');
      return;
    }
    askAd({
      title: '30초 집중 모드',
      desc: '광고를 끝까지 보면 <b>30초 동안 오늘의 가상 기록이 2배</b>로 쌓여요.',
      confirm: '광고 보고 시작',
      kind: 'rewardedFocus',
      onReward: function () {
        state.focusUntil = Date.now() + CONFIG.focusSeconds * 1000;
        SFX.play('fanfare');
        toast(CONFIG.focusSeconds + '초 동안 기록 2배');
        render();
        saveState();
        startFocusTimer();
      }
    });
  }

  function startFocusTimer() {
    if (focusInterval) return;
    focusInterval = window.setInterval(function () {
      if (!isFocus()) {
        window.clearInterval(focusInterval);
        focusInterval = null;
        render();
        return;
      }
      renderFocus();
    }, 500);
  }

  /* 스페셜 배경 열기 */
  function openSpecialTheme() {
    if (state.specialRibbon) {
      state.theme = 5;
      saveState();
      render();
      closeOverlay('themeSheet');
      toast('스페셜 배경으로 바꿨어요');
      return;
    }
    askAd({
      title: '스페셜 배경 열기',
      desc: '광고를 끝까지 보면 <b>따뜻한 스페셜 배경</b>이 열려요. 한 번 열면 계속 써요.',
      confirm: '광고 보고 열기',
      kind: 'rewardedSpecialRibbon',
      onReward: function () {
        state.specialRibbon = true;
        state.theme = 5;
        SFX.play('fanfare');
        toast('스페셜 배경이 열렸어요!');
        render();
        saveState();
        closeOverlay('themeSheet');
      }
    });
  }

  /* 배경 테마 적용 */
  function applyTheme() {
    var t = THEMES[state.theme] || THEMES[0];
    var root = document.documentElement.style;
    root.setProperty('--bg', t.bg);
    root.setProperty('--sheet', t.sheet);
    root.setProperty('--bg-soft', t.soft);
    root.setProperty('--line', t.line);
    root.setProperty('--track', t.line);
    root.setProperty('--card', t.sheet);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.bg);
  }

  /* ---------------------------------------------------------
     12. 화면 렌더
     --------------------------------------------------------- */
  function render() {
    applyTheme();
    var done = Math.min(state.todayCount, CONFIG.dailyGoal);
    var remain = Math.max(0, CONFIG.dailyGoal - done);
    var ratio = CONFIG.dailyGoal ? done / CONFIG.dailyGoal : 0;

    els.remainCount.textContent = String(remain);
    els.progressLabel.textContent = state.goalDone ? '오늘 목표 완료' : '눈알 붙이는 중..';
    els.progressFill.style.width = (ratio * 100).toFixed(1) + '%';
    els.progressBar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    els.progressBar.setAttribute('aria-valuetext', state.goalDone
      ? '오늘 목표를 모두 채웠어요'
      : '오늘 목표까지 ' + remain + '개 남았어요');
    els.progressWrap.classList.toggle('is-done', state.goalDone);

    els.todayCount.textContent = state.todayCount.toLocaleString('ko-KR');
    var laps = Math.floor(state.todayCount / CONFIG.dailyGoal);
    els.summaryRight.textContent = laps > 0
      ? laps + '바퀴 완주'
      : '가상 기록 ' + won(state.todayRecord);

    renderFocus();

    els.tabSound.classList.toggle('is-muted', !!state.muted);
    els.tabSound.setAttribute('aria-pressed', String(!state.muted));
    els.tabSound.setAttribute('aria-label', state.muted ? '소리 켜기' : '소리 끄기');

    els.notifyNote.hidden = !state.notify;

    els.optBear.classList.toggle('is-active', state.doll === 'bear');
    els.optRabbit.classList.toggle('is-active', state.doll === 'rabbit');

    renderSwatches();

    els.ribbonNote.textContent = state.specialRibbon
      ? (state.theme === 5 ? '사용 중' : '열림')
      : '광고 보고 열기';

    els.guideSwitch.setAttribute('aria-checked', String(!!state.guide));

    refreshTabStates();
  }

  function renderFocus() {
    var on = isFocus();
    els.focusPill.hidden = !on;
    if (on) {
      els.focusTimer.textContent = String(Math.max(0, Math.ceil((state.focusUntil - Date.now()) / 1000)));
    }
  }

  function renderSwatches() {
    var nodes = els.swatches.querySelectorAll('.swatch');
    for (var i = 0; i < nodes.length; i++) {
      var b = nodes[i];
      var idx = b.getAttribute('data-theme');
      var active = (idx === 'special')
        ? (state.theme === 5)
        : (Number(idx) === state.theme);
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    }
  }

  function refreshTabStates() {
    var sheet = openOverlayId();
    els.tabDoll.classList.toggle('is-active', sheet === 'dollSheet');
    els.tabTheme.classList.toggle('is-active', sheet === 'themeSheet');
    els.tabMore.classList.toggle('is-active', sheet === 'moreSheet');
    els.tabBoost.classList.toggle('is-active', isFocus());
  }

  /* ---------------------------------------------------------
     13. 오버레이(모달 · 시트) · 토스트
     --------------------------------------------------------- */
  var lastFocus = null;

  function openOverlay(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    var focusable = m.querySelector('button:not([disabled])');
    if (focusable) {
      window.setTimeout(function () { focusable.focus({ preventScroll: true }); }, 50);
    }
    refreshTabStates();
  }

  function closeOverlay(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }
    refreshTabStates();
  }

  function openOverlayId() {
    var open = document.querySelector('[data-overlay]:not([hidden])');
    return open ? open.id : '';
  }

  function anyOverlayOpen() {
    return !!openOverlayId();
  }

  function closeTopOverlay() {
    var list = document.querySelectorAll('[data-overlay]:not([hidden])');
    if (!list.length) return false;
    var top = list[list.length - 1];
    if (top.id === 'adPlayerModal') return false;
    closeOverlay(top.id);
    if (top.id === 'adNoticeModal') pendingAd = null;
    return true;
  }

  var toastTimer = null;
  function toast(text) {
    els.toast.textContent = text;
    els.toast.hidden = false;
    els.toast.style.animation = 'none';
    void els.toast.offsetWidth;
    els.toast.style.animation = '';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { els.toast.hidden = true; }, 2200);
  }

  /* 오버레이 닫기(배경 · 버튼) */
  document.addEventListener('click', function (evt) {
    var t = evt.target.closest ? evt.target.closest('[data-close]') : null;
    if (!t) return;
    var id = t.getAttribute('data-close');
    if (id === 'adNoticeModal') pendingAd = null;
    closeOverlay(id);
  });

  document.addEventListener('keydown', function (evt) {
    if (evt.key === 'Escape') closeTopOverlay();
  });

  /* ---------------------------------------------------------
     14. 탭 바 · 시트 내용
     --------------------------------------------------------- */
  els.tabDoll.addEventListener('click', function () {
    SFX.unlock();
    SFX.play('ui');
    openOverlay('dollSheet');
  });

  els.tabTheme.addEventListener('click', function () {
    SFX.unlock();
    SFX.play('ui');
    openOverlay('themeSheet');
  });

  els.tabSound.addEventListener('click', function () {
    SFX.unlock();
    state.muted = !state.muted;
    SFX.setMuted(state.muted);
    if (!state.muted) SFX.play('ui');
    render();
    saveState();
    toast(state.muted ? '소리를 껐어요' : '소리를 켰어요');
  });

  els.tabBoost.addEventListener('click', function () {
    SFX.unlock();
    SFX.play('ui');
    startFocusMode();
  });

  els.tabMore.addEventListener('click', function () {
    SFX.unlock();
    SFX.play('ui');
    openOverlay('moreSheet');
  });

  els.optBear.addEventListener('click', function () {
    closeOverlay('dollSheet');
    switchDoll('bear');
  });

  els.optRabbit.addEventListener('click', function () {
    closeOverlay('dollSheet');
    switchDoll('rabbit');
  });

  els.swatches.addEventListener('click', function (evt) {
    var b = evt.target.closest ? evt.target.closest('.swatch') : null;
    if (!b) return;
    var idx = b.getAttribute('data-theme');
    if (Number(idx) === 5) {
      openSpecialTheme();
      return;
    }
    state.theme = Number(idx);
    saveState();
    render();
    closeOverlay('themeSheet');
    SFX.play('ui');
    toast(THEMES[state.theme].name + ' 배경으로 바꿨어요');
  });

  els.ribbonRow.addEventListener('click', function () {
    SFX.unlock();
    openSpecialTheme();
  });

  /* 테마 스와치 (기본 5색 + 스페셜) */
  (function buildSwatches() {
    if (!els.swatches) return;
    THEMES.forEach(function (theme, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (theme.swatch === 'special' ? ' swatch--special' : '');
      b.setAttribute('data-theme', String(i));
      if (theme.swatch !== 'special') b.style.background = theme.swatch;
      b.setAttribute('aria-label', theme.name + ' 테마');
      els.swatches.appendChild(b);
    });
  })();

  /* ---------------------------------------------------------
     15. 친구에게 공유
     --------------------------------------------------------- */
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* 토스 앱(호스트)에서는 share() 브릿지를 register로 연결해요. */
  var ShareBridge = {
    adapter: null,
    register: function (adapter) {
      if (adapter && typeof adapter.share === 'function') this.adapter = adapter;
    },
    share: function (payload) {
      if (this.adapter) {
        try {
          return Promise.resolve(this.adapter.share(payload)).then(function () {
            return { shared: true, bridge: true };
          }).catch(function () {
            return copyText(payload.url).then(function (ok) { return { copied: ok }; });
          });
        } catch (e) { /* 웹 방식으로 이어서 */ }
      }
      if (navigator.share) {
        try {
          return navigator.share({ title: payload.title, text: payload.text, url: payload.url })
            .then(function () { return { shared: true }; })
            .catch(function (err) {
              if (err && err.name === 'AbortError') return null;
              return copyText(payload.url).then(function (ok) { return { copied: ok }; });
            });
        } catch (e) { /* 웹 방식으로 이어서 */ }
      }
      return copyText(payload.url).then(function (ok) { return { copied: ok }; });
    }
  };
  window.DollEyeShare = ShareBridge;

  els.shareBtn.addEventListener('click', function () {
    SFX.unlock();
    closeOverlay('moreSheet');
    var payload = {
      title: CONFIG.appName,
      text: '눈알 붙이는 중.. 잠깐 같이 붙이러 와요',
      url: CONFIG.appUrl
    };
    SFX.play('ui');
    ShareBridge.share(payload).then(function (res) {
      if (!res) return;
      if (res.shared) {
        toast('친구에게 공유했어요');
      } else if (res.copied) {
        toast('링크를 복사했어요');
      } else {
        toast('공유를 마치지 못했어요');
      }
    });
  });

  /* ---------------------------------------------------------
     16. 알림 받기 (버튼을 눌렀을 때만 시트가 떠요)
     --------------------------------------------------------- */
  var NotificationBridge = {
    adapter: null,
    register: function (adapter) {
      if (adapter && typeof adapter.request === 'function') this.adapter = adapter;
    },
    request: function (opts) {
      if (!this.adapter) return Promise.resolve({ registered: false, local: true });
      try {
        return Promise.resolve(this.adapter.request(opts));
      } catch (e) {
        return Promise.resolve({ registered: false, error: true });
      }
    },
    cancel: function () {
      if (!this.adapter || typeof this.adapter.cancel !== 'function') return Promise.resolve({ canceled: false });
      try {
        return Promise.resolve(this.adapter.cancel());
      } catch (e) {
        return Promise.resolve({ canceled: false, error: true });
      }
    }
  };
  window.DollEyeNotification = NotificationBridge;

  function formatNotifyTime(t) {
    var parts = String(t || CONFIG.notifyTime).split(':');
    var h = Number(parts[0]) || 20;
    var m = Number(parts[1]) || 0;
    var period = h < 12 ? '오전' : '오후';
    var hour12 = h % 12 === 0 ? 12 : h % 12;
    return '매일 ' + period + ' ' + hour12 + (m ? '시 ' + m + '분' : '시');
  }

  function openNotifySheet() {
    closeOverlay('moreSheet');
    var on = !!state.notify;
    els.notifyTitle.innerHTML = on
      ? '매일 인형 눈알 알림을<br />보내드리고 있어요'
      : '매일 인형 눈알 알림을<br />보내드릴까요?';
    els.notifySub.textContent = on
      ? formatNotifyTime(state.notifyAt) + '에 살짝 알려드려요'
      : '눈알 붙일 시간, 살짝 알려드릴게요';
    els.notifyPreview.textContent = '오늘 남은 눈알, 인형에 톡 붙이러 오세요.';
    els.notifyConsent.textContent = on
      ? '설정 · ' + formatNotifyTime(state.notifyAt)
      : '선택 · 인형 눈알 알림 신청서';
    els.notifyAgree.textContent = on ? '알림 끄기' : '동의하고 알림받기';
    els.notifyLater.textContent = on ? '닫기' : '나중에';
    openOverlay('notifySheet');
    SFX.play('ui');
  }

  els.notifyBtn.addEventListener('click', function () {
    SFX.unlock();
    openNotifySheet();
  });

  els.notifyLater.addEventListener('click', function () {
    closeOverlay('notifySheet');
  });

  /* 웹 알림 권한 (동의를 누른 뒤에만 물어봐요) */
  function requestWebNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve({ supported: false });
    if (Notification.permission === 'granted') return Promise.resolve({ granted: true });
    if (Notification.permission === 'denied') return Promise.resolve({ denied: true });
    try {
      var r = Notification.requestPermission();
      if (r && typeof r.then === 'function') {
        return r.then(function (p) {
          return { granted: p === 'granted', denied: p === 'denied' };
        }).catch(function () { return {}; });
      }
    } catch (e) { /* iframe 등에서 막히면 조용히 넘어가요 */ }
    return Promise.resolve({});
  }

  els.notifyAgree.addEventListener('click', function () {
    SFX.unlock();

    if (state.notify) {
      state.notify = false;
      saveState();
      render();
      closeOverlay('notifySheet');
      NotificationBridge.cancel();
      toast('알림을 껐어요');
      return;
    }

    state.notify = true;
    state.notifyAt = CONFIG.notifyTime;
    saveState();
    render();
    closeOverlay('notifySheet');
    SFX.play('fanfare');
    toast(formatNotifyTime(state.notifyAt) + ' 알림을 신청했어요');

    var opts = {
      time: CONFIG.notifyTime,
      title: '오늘의 눈알',
      body: '오늘 남은 눈알, 인형에 톡 붙이러 오세요.'
    };

    // 토스 스마트 발송 브릿지가 연결돼 있으면 그쪽으로, 아니면 웹 알림 권한으로.
    NotificationBridge.request(opts).then(function (res) {
      if (res && (res.registered || res.granted)) return null;
      return requestWebNotificationPermission();
    }).catch(function () { /* 동의 상태는 로컬에 이미 저장됐어요 */ });
  });

  /* ---------------------------------------------------------
     17. 안내 · 설정 · 인형 전환 · 소리
     --------------------------------------------------------- */
  els.recordBtn.addEventListener('click', function () {
    closeOverlay('moreSheet');
    els.statTotal.textContent = state.total.toLocaleString('ko-KR') + '개';
    els.statToday.textContent = state.todayCount.toLocaleString('ko-KR') + '개';
    render();
    openOverlay('recordModal');
    SFX.play('ui');
  });

  els.aboutBtn.addEventListener('click', function () {
    closeOverlay('moreSheet');
    openOverlay('aboutModal');
    SFX.play('ui');
  });

  els.guideSwitch.addEventListener('click', function () {
    state.guide = !state.guide;
    renderGuide();
    render();
    saveState();
    SFX.play('ui');
    toast(state.guide ? '눈 위치 가이드를 켰어요' : '가이드 없이 감으로 톡톡!');
  });

  function switchDoll(doll) {
    SFX.unlock();
    if (state.doll === doll) {
      render();
      return;
    }
    if (phase === 'done') {
      toast('새 인형이 올라오면 바꿀 수 있어요');
      render();
      return;
    }
    state.doll = doll;
    SFX.play('ui');
    newDoll();
    render();
    saveState();
    toast(DOLLS[doll].name + '로 바꿨어요');
  }

  /* ---------------------------------------------------------
     18. 뒤로가기 · 종료 확인
     --------------------------------------------------------- */
  function pushGuard() {
    try {
      window.history.pushState({ dollEyeJob: true }, '');
    } catch (e) { /* noop */ }
  }

  function requestExit() {
    if (anyOverlayOpen()) {
      closeTopOverlay();
      return;
    }
    els.exitTotal.textContent = state.total.toLocaleString('ko-KR');
    openOverlay('exitModal');
    SFX.play('ui');
  }

  function leaveApp() {
    closeOverlay('exitModal');
    // 실제 앱에서는 호스트(앱인토스 WebView)가 앱을 닫아요.
    if (window.DollEyeHost && typeof window.DollEyeHost.exit === 'function') {
      window.DollEyeHost.exit();
      return;
    }
    toast('앱인토스 앱에서는 이 화면에서 앱이 종료돼요');
  }

  els.exitStay.addEventListener('click', function () {
    closeOverlay('exitModal');
  });
  els.exitLeave.addEventListener('click', leaveApp);

  window.addEventListener('popstate', function () {
    if (anyOverlayOpen()) {
      if (openOverlayId() === 'adPlayerModal') {
        pushGuard();
        return; // 광고 중에는 뒤로가기로 닫지 않아요
      }
      closeTopOverlay();
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
     19. 기록 초기화
     --------------------------------------------------------- */
  els.resetBtn.addEventListener('click', function () {
    try { window.localStorage.removeItem(CONFIG.storageKey); } catch (e) { /* noop */ }
    state = defaultState();
    window.DollEyeApp.state = state;
    SFX.setMuted(state.muted);
    closeOverlay('recordModal');
    render();
    newDoll();
    saveState();
    toast('기록을 초기화했어요');
  });

  /* ---------------------------------------------------------
     20. 시작
     --------------------------------------------------------- */
  function init() {
    loadState();
    SFX.setMuted(!!state.muted);

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
    newDoll();
    render();

    if (isFocus()) startFocusTimer();

    // 더보기 메뉴의 알림 상태 표시
    els.notifyNote.hidden = !state.notify;

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
