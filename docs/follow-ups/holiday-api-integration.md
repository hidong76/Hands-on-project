# 공휴일이 정적 목록이라 발표가 바뀌어도 자동 반영되지 않는다

**Symptom**: 2027년 공휴일 24개가 코드에 고정되어 있어 정부 발표가 바뀌면 사용자가 틀린 연휴를 보게 된다.

**Observed evidence**: `features/holiday-combos/holidays.ts`의 정적 목록과 이를 검증하는 개수 테스트(24개, 일요일 겹침 4일, 토요일 겹침 5일, 실질 공휴일 72일, 쉬는 날 119일)가 전부다. 목록 근거는 [holiday-combos 결정](../decisions/holiday-combos.md)의 증거 항목에 있다.

**Suspected cause**: 출시 범위를 줄이려고 외부 호출 없이 정적 목록으로 시작했다.

**What was tried**: 공식 월력요항 보도자료 기준으로 목록을 만들고 개수로 검증했다. 외부 API는 쓰지 않았다.

**Proposed next step**: 공공데이터포털 한국천문연구원_특일 정보 API(getRestDeInfo)로 받은 2027년 공휴일이 목록과 날짜·개수가 모두 일치하는지 검증한다. API 키는 서버에서만 쓰고 브라우저에 노출하지 않는다. 일치하지 않는 날짜가 있으면 차이를 기록하고 정적 목록을 우선한다. API 호출이 실패해도 정적 목록으로 계산이 계속되어야 한다. 이 항목이 끝나면 `other-year-support`를 이어서 진행할 수 있다.
