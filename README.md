# 🧸 인형 눈알 붙이기

앱인토스(App in Toss) 미니앱 **『인형 눈알 붙이기』** 프로토타입입니다.
눈이 없는 곰돌이·토끼 인형에 눈알을 **톡톡** 붙여 박스를 포장하는 힐링 카운터 게임이에요.

- 순수 클라이언트 사이드 정적 웹앱 (`iframe`, `eval`, SSR, 외부 라이브러리 없음)
- 외부 폰트·이미지·CDN 요청 0건 (모든 그림은 인라인 SVG, 사운드는 Web Audio 합성음)
- 모바일 세로 화면(390×844) 기준으로 한 화면에 들어오도록 설계, 작은 화면은 자연스럽게 스크롤

---

## 1. 실행 방법

정적 파일이라 별도 빌드 없이 바로 열 수 있어요.

```bash
# 방법 1: 그냥 열기
open index.html            # macOS
# 또는 브라우저에 파일을 끌어다 놓기

# 방법 2: 로컬 서버 (권장 — 사운드/저장 동작이 실제와 가장 비슷)
python3 -m http.server 8765
# → http://localhost:8765
```

앱인토스 QR 테스트는 실제 기기(토스 앱)에서 진행해 주세요. PC 크롬과 iOS 사파리/토스 웹뷰는
사운드·저장·광고 동작이 다를 수 있습니다.

### 파일 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` | 화면 구조, 인형 SVG defs, 모달 5종 |
| `styles.css` | 디자인 토큰·레이아웃·애니메이션 (외부 리소스 없음) |
| `app.js` | 게임 로직, SVG 인형/눈 생성, 사운드, 광고 브리지, 저장, 뒤로가기 |
| `preview.png` | 플레이 결과 화면 (PERFECT + 콤보 + 박스 진행) |
| `preview-box.png` | 박스 완성 연출 + 전면 광고 전환 지점 |
| `preview-defect.png` | 짝눈 불량 + 수선 제안 |

---

## 2. 게임 규칙

1. 눈이 없는 인형이 나오면 **왼쪽 눈 → 오른쪽 눈** 순서로 얼굴을 톡톡 누릅니다.
2. 누른 위치가 눈 자리에서 얼마나 떨어졌는지로 판정합니다.
   - **PERFECT** — 반경 14 이내 (SVG 좌표 기준)
   - **GOOD** — 반경 36 이내 (살짝 어긋나지만 귀엽게 붙음)
   - **짝눈** — 그 밖 (크기·각도·시선이 제멋대로인 불량 인형, 콤보 초기화)
3. 오른쪽 눈을 먼저 누르면 눈을 붙이지 않고 "왼쪽 눈부터 붙여요!" 안내만 보여 줍니다.
4. 콤보가 쌓이면 콤보 보너스가 붙고, 5콤보마다 축하 사운드와 꽃가루가 터집니다.
5. 인형 **10개 = 1박스**. 박스를 채우면 포장 연출 + 박스 보너스 + 전면 광고 전환 지점이 나옵니다.

### 가상 일당 · 성장 시스템

| 항목 | 값 |
| --- | --- |
| 기본 단가 | PERFECT 300원 / GOOD 180원 / 짝눈 60원 (게임 내 가상 재화) |
| 숙련도 배수 | 수습생 ×1.0 → 숙련공 ×1.15 (누적 30) → 반장 ×1.3 (90) → 공장장 ×1.5 (200) |
| 콤보 보너스 | 2콤보부터 콤보×10원, 최대 +200원 |
| 박스 보너스 | 2,000원 × 숙련도 배수 |
| 광고 2배 | 30초 동안 모든 단가 ×2 |

> 표시되는 금액은 **게임 내 가상 재화**이며 실제 현금·토스포인트·비즈월렛으로 지급되지 않습니다.
> 화면 상단 라벨, 하단 고지, ⓘ 안내 모달 세 곳에서 같은 내용을 안내합니다.

### 광고 보상 슬롯

| 슬롯 | 트리거 | 보상 |
| --- | --- | --- |
| `rewardedDoubleWage` | "광고 보고 30초 일당 2배" 버튼 | 30초간 단가 2배 |
| `rewardedRepair` | 짝눈 발생 직후 제안 / 하단 "짝눈 불량 1회 수선" | 불량 1개 수선 + 일당 복구 |
| `interstitialBoxComplete` | 박스 완성 모달의 "광고 보고 계속" | 새 박스 시작 |

모든 광고는 **사전 안내 모달**을 거칩니다. 버튼 바로 아래에도 "광고 시청 후 보상이 적용돼요" 문구가
항상 표시되고, 박스 완성 모달에는 "새 박스를 시작하기 전에 광고가 한 번 재생돼요"가 붙습니다.

---

## 3. 구현 포인트

### 인형 · 눈

- 곰돌이·토끼를 **인라인 SVG**로 직접 그렸습니다(그라데이션 털, 스티치, 리본, 볼터치).
- 눈은 판정 위치(SVG 좌표)에 `<g class="eye">`로 생성되며, 판정 결과에 따라
  - PERFECT: 목표 지점에 정확히 + 반짝임
  - GOOD: 누른 지점과 목표 지점을 6:4로 보정해 살짝 어긋난 귀여운 눈
  - 짝눈: 누른 지점 그대로 + 크기(0.66~1.4배)·회전(±20°)·시선을 랜덤하게
- 눈 위치 가이드는 첫 3개 인형까지 진하게, 이후에는 은은하게 보입니다. 우측 상단 **가이드** 버튼으로
  언제든 끌 수 있어 "감으로 톡톡" 모드도 가능합니다.
- 인형은 5가지 리본 색이 순환해 10개를 채우는 동안 같은 얼굴이 반복되지 않습니다.

### 사운드 (iOS 사파리 · 토스 웹뷰 대응)

- Web Audio API로 `톡 / 뽁 / 딩동 / 띠링 / 팡파레`를 오실레이터+노이즈로 합성합니다. 음원 파일이 없습니다.
- 첫 `pointerdown`마다 `AudioContext`를 **resume + 무음 버퍼 재생**으로 잠금 해제합니다
  (iOS는 사용자 제스처 없이는 소리가 나지 않기 때문).
- `visibilitychange`로 앱 복귀 시 `resume()`, 우측 상단 버튼으로 음소거(설정은 저장됨).

### 저장

- `localStorage` 키 `doll-eye-job.v1`에 누적 작업량·오늘 일당·박스·숙련도·설정을 저장합니다.
- 날짜가 바뀌면(Asia/Seoul 기준) 오늘 일당과 콤보만 초기화되고 누적 기록은 유지됩니다.
- 저장이 막힌 환경(사생활 보호 모드 등)에서도 게임은 정상 동작합니다.

### 뒤로가기 · 종료 확인

- 첫 화면에서 뒤로가기(앱 내 ← 버튼 또는 기기 뒤로가기)를 누르면 **종료 확인 모달**이 뜹니다.
- `history.pushState` 가드 + `popstate`로 브라우저/웹뷰 뒤로가기를 가로채고,
  모달이 열려 있으면 뒤로가기는 모달만 닫습니다.
- 실제 앱 종료는 호스트가 담당합니다: `window.DollEyeHost.exit()`가 있으면 호출하고,
  없으면(데모) 안내 토스트만 표시합니다.

```js
// 앱인토스 래퍼에서 연결
import { Screen, graniteEvent } from '@apps-in-toss/web-framework';

window.DollEyeHost = { exit: () => Screen.close() };

const unsubscribe = graniteEvent.addEventListener('backEvent', {
  onEvent: () => window.DollEyeApp.requestExit(),
  onError: (e) => console.error(e)
});
window.addEventListener('pagehide', () => unsubscribe());
```

---

## 4. 광고 연동 방법 (다음 단계)

### 4-1. 광고 그룹 ID 발급

1. 앱인토스 콘솔 → **인앱 광고** → 광고 그룹 생성
2. 이 앱에는 3개가 필요합니다.
   - 보상형: `30초 일당 2배`
   - 보상형: `짝눈 수선`
   - 전면형: `박스 완성`
3. 발급된 ID를 `app.js`의 `CONFIG.adGroupIds`에 넣습니다.

```js
adGroupIds: {
  rewardedDoubleWage: '발급받은-보상형-ID',
  rewardedRepair: '발급받은-보상형-ID',
  interstitialBoxComplete: '발급받은-전면형-ID',
  bannerBottom: 'ait-ad-test-banner-id'   // 배너는 이번 프로토타입에서 미사용
}
```

> ⚠️ **다른 앱에서 쓰던 광고 그룹 ID를 재사용하면 정적 분석에서 바로 반려됩니다.**
> 앱마다 새로 발급받아 넣어 주세요. 광고 그룹 ID는 구글 등록까지 최대 2시간 걸릴 수 있습니다.
> 지금 들어 있는 `ait-ad-test-rewarded-id` / `ait-ad-test-interstitial-id`는 앱인토스 문서의
> **테스트 전용 ID**입니다. 실제 광고 ID로 테스트하면 정책 위반이에요.

### 4-2. SDK 연결 (통합 광고 2.0)

이 프로토타입은 SDK 없이도 돌아가도록 **광고 브리지**를 분리해 두었습니다.
`AdBridge.show(kind)`가 어댑터를 찾으면 실제 광고를, 없으면 데모 광고를 재생합니다.

```js
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

window.DollEyeAdBridge.register({
  show(kind, adGroupId) {
    return new Promise((resolve, reject) => {
      loadFullScreenAd({
        options: { adGroupId },
        onEvent: (e) => {
          if (e.type !== 'loaded') return;
          showFullScreenAd({
            options: { adGroupId },
            onEvent: (ev) => {
              // ✅ 보상은 userEarnedReward에서만 지급 (dismissed는 보상 아님)
              if (ev.type === 'userEarnedReward') resolve({ rewarded: true });
              if (ev.type === 'dismissed' || ev.type === 'failedToShow') resolve({ rewarded: false });
            },
            onError: reject
          });
        },
        onError: reject
      });
    });
  }
});
```

- `load → show → 다시 load` 순서를 지켜 주세요(광고는 미리 로드하는 편이 안정적입니다).
- `loadFullScreenAd.isSupported()` / `showFullScreenAd.isSupported()`로 미지원 버전을 먼저 확인하세요.
- 보상형·전면형은 같은 API를 쓰고 **adGroupId로 종류가 결정**됩니다.
- iOS에서 광고가 안 뜨면 앱 추적 모드(ATT) 허용 상태를 확인하세요.

### 4-3. 앱인토스 프로젝트로 감싸기

이 저장소는 웹 화면만 담고 있습니다. 등록은 앱인토스 SDK 프로젝트에서 진행합니다.

```bash
# 1) 기존 프로젝트(또는 새 폴더)에 SDK 설치 후 초기화
npm install @apps-in-toss/web-framework
npx ait init

# 2) index.html / styles.css / app.js 를 번들 디렉터리(예: dist/)로 복사
# 3) 빌드 → <서비스명>.ait 생성 → 콘솔 업로드(또는 npx ait deploy)
npm run build
```

`apps-in-toss.config.ts` (SDK 2.x는 `granite.config.ts`)에서 앱 이름과 번들 위치를 맞춥니다.
`appName`이 콘솔에 등록한 앱 이름과 다르면 업로드 자체가 되지 않습니다.

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: '인형 눈알 붙이기',   // ← HTML <title>, 상단 바 제목, 콘솔 앱 이름과 모두 동일
  webBundleDir: 'dist',         // index.html이 들어 있는 폴더
  webView: {},
  permissions: [],
  navigationBar: {
    withTitle: true,            // 비게임 미니앱: 로고 + 앱 이름 표시
    withBackButton: true
  }
});
```

> 게임 타입(`webViewProps: { type: 'game' }`)으로 등록하면 내비게이션 바가 X·더보기 형태가 되어
> 제목이 보이지 않습니다. "타이틀 3곳 통일"을 확인하려면 비게임(취미/생활) 카테고리 등록을 권합니다.

> **타이틀 3곳 통일**: ① HTML `<title>` ② 앱 상단 내비게이션 바 제목 ③ 콘솔 앱 이름.
> 지금 코드는 ①②를 `인형 눈알 붙이기`로 맞춰 두었으니, 콘솔 앱 이름도 같은 값으로 등록하세요.

---

## 5. 검수 체크리스트 반영 내역

정열 님(앱인토스 다수 앱 출시)에게 받은 실전 팁을 코드에 반영했습니다.

- [x] `<title>`·상단 바 제목을 `인형 눈알 붙이기`로 통일
- [x] 광고 버튼 **바로 아래**에 "광고 시청 후 보상이 적용돼요" 상시 노출 + 실행 전 안내 모달
- [x] 실제 리워드 연동 전이므로 "게임 내 가상 일당"·"실제 현금/토스포인트 지급 없음"을 3곳에 명시
- [x] 첫 화면 뒤로가기 → 종료 확인 모달(핸들러 구조 포함)
- [x] `adGroupId`를 `CONFIG.adGroupIds` 설정 객체로 분리 (앱마다 새로 발급)
- [x] `iframe`·`eval`·SSR 미사용, 외부 도메인 요청 0건
- [x] 아이콘은 600×600 PNG 권장(콘솔 등록용, 별도 제작 필요)
- [ ] 실기기(iOS/Android 토스 앱) 최종 확인 — QR 테스트로 진행

---

## 6. 개발자용 메모

- 수치 조정은 `app.js` 상단 `CONFIG`에서 한 번에 됩니다(박스 단위, 광고 초, 단가, 판정 반경, 보너스).
- 판정 반경은 **SVG 320×320 좌표계** 기준입니다. 화면 크기가 달라도 동일한 난이도가 유지됩니다.
- 인형을 추가하려면 `DOLLS`에 `body(accent)` 마크업과 `eyes` 좌표, `clamp` 범위만 넣으면 됩니다.
- 저장 초기화: 앱 안 ⓘ → **기록 초기화** 버튼.
- 콘솔 에러 0건, 외부 요청 0건, `iframe` 0개를 헤드리스 브라우저로 검증했습니다(자세한 결과는 아래).

### 검증 결과 (Playwright, 390×844 / DPR 3)

| 항목 | 결과 |
| --- | --- |
| 문서 높이 | 844px (스크롤 없음), 360×640에서는 세로 스크롤만 발생 |
| 콘솔 에러 | 없음 (file:// 로드 포함) |
| 외부 네트워크 요청 | 없음 |
| 곰돌이/토끼 전환 | 정상, 전환 시 새 인형으로 리셋 |
| PERFECT / GOOD / 짝눈 판정 | 각각 `PERFECT!` `GOOD` `짝눈!` 표시, 단가 반영 |
| 오른쪽 눈 먼저 탭 | 눈을 붙이지 않고 "왼쪽 눈부터 붙여요!" 안내 |
| 광고 안내 → 데모 광고 → 보상 | 30초 2배 칩·타이머 표시, 버튼 비활성화 |
| 짝눈 수선 | "수선 완료!" 연출, 눈이 제자리로 이동, 일당 복구 |
| 박스 10개 완성 | 박스 모달 + 보너스 + 전면 광고 → 새 박스 시작 |
| 뒤로가기 | 종료 확인 모달, "계속 만들기"로 복귀 |
| 새로고침 후 기록 | 유지 (누적 129개, 12,860원) |

---

## 7. 알려진 한계

- 광고는 **데모**입니다. 실제 수익·노출은 SDK 연결 후에 발생합니다.
- 실제 리워드(토스포인트/비즈월렛) 지급은 별도 제휴·API가 필요합니다. 현재는 가상 재화입니다.
- 기록은 기기 브라우저에만 저장됩니다(서버 동기화 없음).
- 인형 그림은 SVG 도형 기반이라 실제 봉제 질감과는 다릅니다(프로토타입 수준).

---

## 8. 웹 배포 (GitHub Pages)

휴대폰에서 바로 열어볼 수 있도록 GitHub Pages에 올려 두었습니다.

- **접속 주소**: https://bubble-collab.github.io/doll-eye-job/
- **저장소**: https://github.com/bubble-collab/doll-eye-job (기본 브랜치 `main`)
- Pages는 **`gh-pages` 브랜치**를 배포 소스로 사용합니다. 파일을 고칠 때는 `main`에 커밋한 뒤
  `git push origin main` 과 `git push origin gh-pages` 를 함께 해 주세요(예: `git branch -f gh-pages main`).
- 배포는 push 후 보통 30초~1분 안에 반영됩니다.
