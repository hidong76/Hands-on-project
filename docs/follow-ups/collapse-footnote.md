# 풋노트를 접거나 숨길 수 없다

**Symptom**: 화면 아래 풋노트(제약 설명, 강조 설명)가 항상 펼쳐져 있어 접거나 숨길 수 없다.

**Observed evidence**: 풋노트는 모든 상태에서 보인다. 제약 설명은 처음 화면부터 항상 보이는 것이 [ui-composition 결정](../decisions/ui-composition.md)이다.

**Suspected cause**: 항상 보이게 하기로 한 결정의 결과이고, 접는 기능은 첫 범위에서 뺐다.

**What was tried**: 구현하지 않았다.

**Proposed next step**: 접거나 숨기는 기능이 정말 필요한지부터 확인한다. 만든다면 제약 설명은 처음 화면에서 접힌 채로 시작하지 않도록 `shape-idea`로 범위를 정한다.
