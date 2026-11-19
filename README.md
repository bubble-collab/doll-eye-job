# 🧸 인형 눈알 붙이기

앱인토스(App in Toss) **비게임(엔터테인먼트)** 미니앱 『인형 눈알 붙이기』 프로토타입입니다.
눈이 없는 곰돌이·토끼 인형에 눈알을 **톡! 톡!** 붙이며 잠깐 쉬어가는 미니앱이에요.

- **목탁 두드리기** 스타일의 미니멀 UI: 크림색 배경 위에 카드 테두리 없이 큰 인형 하나,
  상단 한 줄 진행(`눈알 붙이는 중.. 100 남음`)과 얇은 진행 바, 하단 아이콘 탭 바 5개
- **더보기** 메뉴: 친구에게 공유 · 알림 받기 · 설정 및 기록 · 안내 및 출처
- 점수·판정·콤보·등급·미션 없음 (게임물 등급분류 대상이 되지 않도록 정리한 버전)
- 순수 클라이언트 사이드 정적 웹앱 (`iframe`, `eval`, SSR, 외부 라이브러리 없음)
- 외부 폰트·이미지·CDN 요청 0건 (그림은 인라인 SVG, 사운드는 Web Audio 합성음)

---

## 1. 실행 방법

정적 파일이라 별도 빌드 없이 바로 열 수 있어요.

```bash
# 방법 1: 그냥 열기
open index.html            # macOS / 브라우저에 파일을 끌어다 놓기

# 방법 2: 로컬 서버 (권장 — 사운드/저장/공유 동작이 실제와 가장 비슷)
python3 -m http.server 8765
# → http://localhost:8765
```

앱인토스 QR 테스트는 실제 기기(토스 앱)에서 진행해 주세요. PC 크롬과 iOS 사파리/토스 웹뷰는
사운드·저장·공유·알림 동작이 다를 수 있습니다.

### 파일 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` | 화면 구조, 인형 SVG defs, 바텀시트·모달 |
| `styles.css` | 디자인 토큰·레이아웃·애니메이션 (외부 리소스 없음) |
| `app.js` | 인형/눈 생성, 가이드, 사운드, 광고·프로모션·공유·알림 브리지, 저장, 뒤로가기 |
| `preview.png` 등 | 이전(게임형) 프로토타입 화면 — 참고용 |

---

## 2. 화면과 흐름

휴대폰 세로 화면(390×844 기준)에서 스크롤 없이 한 화면이 되도록 여백을 잡았습니다.

1. **상단 바** — 뒤로가기 · 곰돌이 아이콘 · `인형 눈알 붙이기`
2. **진행 한 줄** — 왼쪽 `눈알 붙이는 중..`, 오른쪽 `100 남음`(숫자 강조) + 4px 진행 바
   - 목표를 채우면 `오늘 목표 완료`로 바뀌고 바가 초록빛이 됩니다.
3. **인형** — 화면 폭을 거의 채우는 주인공. 얼굴을 톡톡 누르면 눈이 붙어요.
4. **한 줄 안내** — 지금 할 일(“왼쪽 눈을 톡 눌러 보세요”) 또는 완성 멘트
5. **오늘 요약** — 왼쪽 `오늘 N개`, 오른쪽 `가상 기록 N원`(한 바퀴를 채우면 `N바퀴 완주`)
6. **고지 한 줄** — `인형 눈알 붙이는 부업 · 기록은 전부 가상이에요`
7. **아이콘 탭 바(5개)** — 인형 · 테마 · 소리 · 부스터 · 더보기
   - 열려 있는 시트의 탭에만 은은한 둥근 배경이 붙습니다.

### 리듬 (끊김 없이 반복)

- 눈이 없는 인형이 뜨면 **왼쪽 눈 → 오른쪽 눈** 순서로 톡톡. (오른쪽을 먼저 누르면 벌점 없이 “왼쪽 눈부터 톡!” 안내만)
- 두 눈이 붙으면 1.15초 뒤 **바로 다음 인형**이 올라옵니다. 모달로 흐름을 끊지 않아요.
- **10개마다** 하단에 가벼운 쉼표 배너가 7초간 떠요: “인형 10개 완성! 잠깐 쉬어갈까요?”
  - 그냥 두면 사라지고 계속 톡톡 붙일 수 있어요.
  - 배너를 **누른 사람만** 쉬어가는 카드가 열리고, 거기서 전면 광고를 볼지 고릅니다. (강제 전면 광고 없음)
- **목표 100개**를 채우면 가볍게 축하하고, 진행 바가 ‘달성’ 색으로 바뀝니다. 그 뒤에도 계속 만들 수 있어요.

### 눈알과 가이드

- 눈알은 얼굴 대비 **큼직하게** 그립니다(흰자 rx 21.5 / 홍채 r 12.6, 하이라이트 반짝이 2개).
- 누르면 **꾹 눌렸다가 톡 붙는** 애니메이션과 본드가 살짝 번지는 느낌이 함께 나요.
- 가이드: 지금 눌러야 할 눈 자리에 **점선 원 + 가운데 “톡” 마커**가 표시됩니다.
  - 3개까지는 또렷하게, 이후에는 은은하게. 설정 및 기록에서 끌 수 있어요.
- 눈 자리에서 **반경 26**(SVG 좌표) 안을 누르면 자리에 살짝 맞춰 붙고, 그 밖을 누르면 누른 곳에 그대로 붙어요.
  살짝 비뚤어도 실패가 아니라 “살짝 삐뚤어도 개성 있는 표정!” 같은 멘트만 나옵니다.

---

## 3. 탭 바 · 시트

### 인형
곰돌이 / 토끼를 미니 얼굴 아이콘과 함께 고릅니다. 완성 직후(다음 인형이 올라오기 전)에는 바꿀 수 없다고 알려 줍니다.

### 테마
배경 테마 6종: **크림 · 살구 · 민트 · 버터 · 라벤더 · 스페셜**.
- 고른 테마는 배경·시트·카드·진행 바 색에 은은하게 반영됩니다(`state.theme`).
- **스페셜**은 광고를 끝까지 본 사람에게 한 번 열리고 계속 쓸 수 있어요(`state.specialRibbon`).

### 소리
효과음 On/Off. 끄면 아이콘에 사선이 그어지고 설정이 저장됩니다.

### 부스터
“광고 보고 30초 집중 모드”. **광고 사전 안내 → 데모 광고 → 30초 동안 가상 기록 2배**.
진행 중에는 상단에 `집중 N초` 칩과 부스터 탭 강조가 표시됩니다.

### 더보기
| 항목 | 동작 |
| --- | --- |
| 친구에게 공유 | 토스 브릿지 → `navigator.share` → 클립보드 복사 순서로 시도하고 토스트로 안내 |
| 알림 받기 | **버튼을 눌렀을 때만** 다크 바텀시트가 열립니다. “매일 인형 눈알 알림을 보내드릴까요? — 동의하고 알림받기 / 나중에” |
| 설정 및 기록 | 완성 수·오늘 수, 눈 위치 가이드 스위치, 기록 초기화 |
| 안내 및 출처 | 가상 기록 고지, 광고·알림 안내, 그림·사운드 출처(직접 제작), 저장 위치 |

- 알림은 진입 시 자동으로 묻지 않습니다(다크패턴 금지). 동의하면 `state.notify=true`, `state.notifyAt='20:00'`이 저장되고,
  `window.DollEyeNotification` 브릿지 또는 웹 알림 권한으로 넘깁니다. 다시 열면 **알림 끄기**가 나옵니다.

---

## 4. 가상 기록과 목표

| 항목 | 값 |
| --- | --- |
| 개당 가상 기록 | **30원** (부업 후기처럼 소박한 단가) |
| 집중 모드 | 광고 시청 후 **30초 동안 기록 2배** |
| 오늘의 목표 | **100개** (`CONFIG.dailyGoal`) |
| 오늘 기록 초기화 | 한국 날짜(Asia/Seoul)가 바뀌면 자동 |

> 표시되는 금액은 **가상의 숫자**이며 실제 현금·토스포인트·비즈월렛으로 지급되지 않습니다.
> 화면 하단 고지, 설정 및 기록, 안내 및 출처에서 같은 내용을 안내합니다.

수치 조정은 `app.js` 상단 `CONFIG` 한 곳에서 됩니다.

```js
var CONFIG = {
  appUrl: 'https://bubble-collab.github.io/doll-eye-job/',
  dailyGoal: 100,        // 오늘의 목표 개수
  recordPerDoll: 30,     // 개당 가상 기록(원)
  focusSeconds: 30,      // 집중 모드 지속 시간
  restEvery: 10,         // 쉼표 배너 주기
  snapRadius: 26,        // 눈 자리에 맞춰 붙는 반경
  notifyTime: '20:00',   // 매일 알림 희망 시각
  promotionCode: '',     // 사업자 등록 후 발급받는 프로모션 코드
  adGroupIds: { ... }
};
```

---

## 5. 광고 슬롯

| 슬롯 | 트리거 | 내용 |
| --- | --- | --- |
| `rewardedFocus` | 부스터 탭 | 30초간 가상 기록 2배 |
| `rewardedSpecialRibbon` | 테마 → 스페셜 배경 | 스페셜 배경 1회 해금(계속 사용) |
| `interstitialRest` | 쉼표 배너 → 쉬어가는 카드의 “광고 보고 계속” | 다음 인형부터 계속 |
| `bannerBottom` | (자리만 정의 · 이번 버전 미사용) | — |

모든 광고는 **사전 안내 모달**을 거칩니다. 버튼 안쪽에 “광고 시청 후 …” 문구가 상시 표시되고,
안내 모달에는 “끝까지 보면 적용돼요. 중간에 닫으면 적용되지 않아요”가 붙습니다.
사용자가 예상하지 못한 시점에 전면 광고를 띄우지 않습니다(쉼표 카드는 사용자가 눌렀을 때만 열립니다).

---

## 6. 호스트 브리지 연결

브리지가 없어도 데모·웹 동작으로 완전히 돌아갑니다. 토스 앱에서는 아래처럼 연결해 주세요.

### 친구에게 공유

```js
import { share } from '@apps-in-toss/web-framework';

window.DollEyeShare.register({
  share(payload) {
    // payload: { title, text, url }
    return share({ message: `${payload.text}\n${payload.url}` });
  }
});
```

- 연결이 없으면 `navigator.share`를 쓰고, 그것도 없거나 실패하면 **링크를 클립보드에 복사**한 뒤
  `링크를 복사했어요` 토스트를 띄웁니다(1.2초 안에 응답이 없으면 자동으로 복사 방식으로 넘어감).
- 사용자가 공유 시트를 닫은 경우(`AbortError`)에는 토스트를 띄우지 않습니다.

### 알림 받기

```js
import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

window.DollEyeNotification.register({
  request({ time, title, body }) {
    // time: '20:00' · 사용자가 시트에서 "동의하고 알림받기"를 누른 뒤에만 호출됩니다.
    return requestNotificationAgreement({
      templateCode: 'doll-eye-daily',   // 콘솔에서 만든 스마트 발송 템플릿
      time
    }).then(() => ({ registered: true }));
  },
  cancel() {
    return Promise.resolve({ canceled: true });
  }
});
```

- 브릿지가 없으면 브라우저 알림 권한을 **동의 후에만** 요청하고, 동의 상태는 로컬에 저장합니다.
- 실제 매일 발송은 토스 스마트 발송(템플릿) 쪽에서 이뤄집니다. 웹 단독 배포에서는 권한·동의 상태만 남습니다.

### 프로모션 보상 (사업자 등록 후)

```js
import { grantPromotionReward } from '@apps-in-toss/web-framework';

window.DollEyePromotion.register({
  grant(promotionCode) {
    return grantPromotionReward({
      params: { promotionCode, amount: 100 }
    }).then((res) => ({ granted: !!(res && res.success) }));
  }
});
```

- 앱은 **오늘 목표(100개)를 처음 달성했을 때 한 번만** `grant()`를 호출합니다.
- `CONFIG.promotionCode`가 비어 있거나 호스트가 연결하지 않았으면 조용히 아무 일도 하지 않습니다.

### 뒤로가기 · 종료

```js
import { Screen, graniteEvent } from '@apps-in-toss/web-framework';

window.DollEyeHost = { exit: () => Screen.close() };

const unsubscribe = graniteEvent.addEventListener('backEvent', {
  onEvent: () => window.DollEyeApp.requestExit(),
  onError: (e) => console.error(e)
});
window.addEventListener('pagehide', () => unsubscribe());
```

### 광고 SDK (통합 광고 2.0)

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

- `load → show → 다시 load` 순서를 지켜 주세요.
- ⚠️ **다른 앱에서 쓰던 광고 그룹 ID를 재사용하면 정적 분석에서 반려됩니다.** 앱마다 새로 발급받아
  `CONFIG.adGroupIds`에 넣어 주세요. 지금 값은 앱인토스 문서의 **테스트 전용 ID**입니다.

### 앱인토스 프로젝트로 감싸기

```bash
npm install @apps-in-toss/web-framework
npx ait init
# index.html / styles.css / app.js 를 번들 디렉터리(예: dist/)로 복사
npm run build
```

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: '인형 눈알 붙이기',   // ← HTML <title>, 상단 바 제목, 콘솔 앱 이름과 모두 동일
  webBundleDir: 'dist',
  webView: {},
  permissions: [],
  navigationBar: {
    withTitle: true,
    withBackButton: true
  }
});
```

> **타이틀 3곳 통일**: ① HTML `<title>` ② 앱 상단 바 제목 ③ 콘솔 앱 이름.

---

## 7. 비게임(엔터테인먼트) 전환 정리

| 제거한 것 | 대신 남긴 것 |
| --- | --- |
| PERFECT / GOOD / 불량 판정 | 붙인 위치 그대로의 표정 + “개성 있는 표정!” 같은 멘트 |
| 점수·단가 차등(300/180/60원) | 개당 30원 고정 가상 기록 |
| 콤보(COMBO)·콤보 보너스 | 없음 (연속 리듬만) |
| 숙련도 등급 | 없음 |
| 박스 미션·박스 보너스·수선 | 10개마다 가벼운 쉼표 배너(사용자 선택) |
| 실패/벌점·타임아웃 | 없음 (언제든 다시 톡톡) |

남긴 것: 곰돌이/토끼 선택, 왼쪽→오른쪽 눈 붙이기, 완성 멘트와 사운드, 완성 수·가상 기록,
오늘의 목표 진행, 광고 슬롯 3종. **승패·순위·제한시간 경쟁 요소는 없습니다.**

---

## 8. 구현 포인트

### 인형 · 눈

- 곰돌이·토끼를 인라인 SVG로 직접 그렸습니다(그라데이션 털, 스티치, 볼터치).
- 인형마다 `viewBox`를 따로 두어(`viewBox` 크롭) 화면 폭을 거의 채우면서 위아래 여백을 줄였습니다.
- 눈은 `<g class="eye">`로 생성: 흰자·홍채·하이라이트 2개, `translate / rotate / scale`로 배치.
- 등장 시 `eyePress` 애니메이션으로 꾹 눌리며 붙는 느낌, `ripple`·`glue`로 본드가 번지는 연출.

### 사운드 (iOS 사파리 · 토스 웹뷰 대응)

- Web Audio API로 `톡 / 뽁 / 딩동 / 팡파레 / UI`를 오실레이터+노이즈로 합성합니다. 음원 파일이 없습니다.
- 첫 `pointerdown`마다 `AudioContext`를 **resume + 무음 버퍼 재생**으로 잠금 해제합니다.
- `visibilitychange`로 앱 복귀 시 `resume()`, 소리 탭으로 음소거(설정은 저장됨).

### 저장

- `localStorage` 키 `doll-eye-job.v2`에 누적/오늘 완성 수, 가상 기록, 목표 달성, 테마, 스페셜 배경,
  가이드, 소리, 알림 동의(`notify`, `notifyAt`)를 저장합니다.
- 날짜가 바뀌면(Asia/Seoul 기준) 오늘 기록·목표 달성만 초기화되고 누적 기록은 유지됩니다.
- 저장이 막힌 환경(사생활 보호 모드 등)에서도 동작은 정상입니다.

### 뒤로가기 · 종료 확인

- 첫 화면에서 뒤로가기(앱 내 ← 버튼 또는 기기 뒤로가기)를 누르면 **종료 확인 모달**이 뜹니다.
- `history.pushState` 가드 + `popstate`로 브라우저/웹뷰 뒤로가기를 가로채고, 시트·모달이 열려 있으면 뒤로가기는 그것만 닫습니다.

---

## 9. 검증 결과

390×844 모바일 뷰포트와 라이브 페이지에서 직접 눌러 확인한 내용입니다.

| 항목 | 결과 |
| --- | --- |
| 라이브 URL | https://bubble-collab.github.io/doll-eye-job/ |
| 로드 | 새 UI 정상 로드 (`?v=moktak15` 캐시 버스터 적용) |
| 외부 네트워크 요청 | 없음 (자체 파일 3개만) |
| 390×844 레이아웃 | 스크롤 없이 한 화면, 인형이 폭을 거의 채우고 상·하 여백 균형 확인 |
| 진행 한 줄 | `눈알 붙이는 중..` + `100 남음`, 완성 시 숫자·진행 바 갱신 |
| 눈알 | 왼쪽 → 오른쪽 순서로 톡, 완성 후 다음 인형 자동 등장 |
| 오늘 요약 | `오늘 N개` · `가상 기록 N원`, 갱신 확인 |
| 탭 바 아이콘 | 5종 라인 SVG(인형·테마·소리·부스터·더보기), 열린 시트 탭에만 둥근 배경 |
| 더보기 시트 | 탭 바 위에 뜨고 4개 항목(공유·알림·설정·안내) 표시 |
| 친구에게 공유 | 브릿지 등록 시 `친구에게 공유했어요`, 브릿지 없이 클립보드 복사 시 `링크를 복사했어요` 토스트 확인 |
| 알림 받기 | 버튼을 눌러야만 다크 시트 표시, 동의 시 `notify=true`·`20:00` 저장, 더보기에 `켜짐` 표시, 재진입 시 `알림 끄기` |
| 테마 | 민트 선택 시 배경·시트 색 반영 및 저장 |
| 인형 바꾸기 | 곰돌이 → 토끼 전환, 토끼 전용 viewBox로 이어 귀까지 표시 |
| 소리 | 탭으로 끄기/켜기, 아이콘 사선·`aria-label` 변경 |
| 부스터 | 광고 사전 안내 → 데모 광고 → `집중 N초` 칩과 부스터 탭 강조 |
| 뒤로가기 | 종료 확인 모달, “계속 만들기”로 복귀 |
| 설정 및 기록 | 완성 수 표시, 가이드 스위치, 초기화 후 `100 남음`·`오늘 0개`로 복귀 |
| 안내 및 출처 | 가상 기록·광고·알림·출처·저장 안내 표시 |
| 실제 토스 앱 | 미확인 — QR 테스트로 공유/알림 브릿지 최종 확인 필요 |

---

## 10. 웹 배포 (GitHub Pages)

- **접속 주소**: https://bubble-collab.github.io/doll-eye-job/
- **저장소**: https://github.com/bubble-collab/doll-eye-job (기본 브랜치 `main`)
- Pages는 **`gh-pages` 브랜치**를 배포 소스로 사용합니다. 파일을 고칠 때는 `main`에 커밋한 뒤
  `git branch -f gh-pages main && git push origin main gh-pages` 로 함께 올려 주세요.
- 배포는 push 후 보통 30초~1분 안에 반영됩니다.
- `styles.css` / `app.js`를 고치면 `index.html`의 `?v=moktak15` 숫자를 올려 주세요.
  Pages가 정적 파일을 10분간 캐시하기 때문에, 버전을 바꾸지 않으면 휴대폰에 이전 파일이 보일 수 있어요.

---

## 11. 알려진 한계

- 광고는 **데모**입니다. 실제 수익·노출은 SDK 연결 후에 발생합니다.
- 프로모션 보상은 자리만 있고, 사업자 등록·코드 발급·호스트 연결 전에는 동작하지 않습니다.
- 알림은 동의 상태만 저장합니다. 실제 매일 발송은 토스 스마트 발송 템플릿 연결이 필요합니다.
- 공유는 `navigator.share`가 없는 데스크톱에서 클립보드 복사로 대체됩니다(권한이 막히면 실패 토스트).
- 기록은 기기 브라우저에만 저장됩니다(서버 동기화 없음).
- 인형 그림은 SVG 도형 기반이라 실제 봉제 질감과는 다릅니다(프로토타입 수준).
