# 연휴 기간 안의 날짜를 달력처럼 펼쳐 볼 수 없다

**Symptom**: 연휴가 시작일~종료일과 연차 쓰는 날짜로만 나와서, 기간 안의 날짜가 주말·공휴일·연차 중 무엇인지 하나씩 볼 수 없다.

**Observed evidence**: 추천과 플랜의 표와 카드에는 날짜를 하나씩 펼쳐 보여주는 화면이 없다.

**Suspected cause**: 첫 범위에서 의도적으로 뺐다.

**What was tried**: 구현하지 않았다.

**Proposed next step**: `shape-idea`로 달력 형태의 화면 구성과 접기·펼치기, 좁은 화면에서의 모양을 정하고 [ui-composition 결정](../decisions/ui-composition.md)의 칩 강조와 맞춘다.
