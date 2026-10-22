# 남은 연차 수에 1e1, 0x5 같은 표기를 넣으면 안내 없이 계산된다

**Symptom**: 남은 연차 수 칸에 `1e1`을 넣으면 10일로, `0x5`를 넣으면 5일로 해석되어 안내 없이 추천이 나온다.

**Observed evidence**: 코드 리뷰(code-review low)가 `features/holiday-combos/holiday-combos-page.tsx`의 `parseLeaveDays`가 `Number(trimmed)`를 그대로 쓴다고 지적했다. Node에서 `Number("1e1")`은 10, `Number("0x5")`는 5, `Number("0b11")`은 3이다. 브라우저 화면에서는 재현하지 않았다.

**Suspected cause**: `Number()`가 지수·16진·2진 표기를 모두 숫자로 받아들이고, `recommend`는 받은 값이 정수이고 1~15 범위인지만 검사한다.

**What was tried**: 고치지 않았다. 1~15 범위 안의 값이라 spec의 완료 기준을 깨지 않고, 일반적인 입력 경로에서 나오지 않는 표기다.

**Proposed next step**: `parseLeaveDays`에서 `/^\d+$/`에 맞지 않는 입력은 NaN으로 넘기고, 그 사례를 `app/page.test.tsx`의 연차 수 안내 테스트에 추가한다.
