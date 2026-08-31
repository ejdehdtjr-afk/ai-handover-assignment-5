'use client';

import { useMemo, useState } from 'react';

type RecordRow = {
  recordDate: string;
  sourceDate: string;
  sourceTime: string;
  queryTime: string;
  eurUsd: number;
  eurKrw: number;
  value: number;
};

type ViewState = 'fresh' | 'stale' | 'empty';

const records: RecordRow[] = [
  { recordDate: '2026-08-25', sourceDate: '2026-08-24', sourceTime: '2026-08-24 16:00 CET (2026-08-24 23:00 KST)', eurUsd: 1.1664, eurKrw: 1614.6, value: 1614.6 / 1.1664, queryTime: '2026-08-25 10:01:30 KST' },
  { recordDate: '2026-08-26', sourceDate: '2026-08-25', sourceTime: '2026-08-25 16:00 CET (2026-08-25 23:00 KST)', eurUsd: 1.1662, eurKrw: 1612.94, value: 1612.94 / 1.1662, queryTime: '2026-08-26 11:19:58 KST' },
];

const failureModes = [
  ['TIMEOUT', '느림·시간 초과', '응답 대기 초과'],
  ['AUTH_401', '인증 실패', '401/403 거절'],
  ['RATE_LIMIT_429', '호출 제한', '429 제한'],
  ['OFFLINE', '오프라인', '네트워크 단절'],
  ['SCHEMA_CHANGED', '응답 형식 변경', '필수 필드 누락'],
] as const;

const checks = [
  ['01', '정상', '초기 100 USD 계산'], ['02', '정상', '1 USD가 현재 환율과 일치'],
  ['03', '정상', '250.50 입력 즉시 반영'], ['04', '정상', '0 USD는 0.00 KRW'],
  ['05', '오류', '빈 입력 안내, 이전 결과 제거'], ['06', '오류', '음수 입력 안내'],
  ['07', '오류', '정상 환율 없을 때 계산 중단'], ['08', '회귀', '장애 5종과 복구 유지'],
  ['09', '회귀', '날짜 기록·차이·검산 유지'], ['10', '회귀', '모바일·라벨·상태 전달'],
] as const;

const handoff = [
  ['목표', '달러 입력 즉시 원화 예상액 표시'], ['현재 상태', 'AI A가 정상 계산 4개 완료'],
  ['실행 방법', '공개 주소에서 달러 금액 입력'], ['통과 항목', 'N1–N4, 검사 4/10'],
  ['남은 문제', '빈값·음수·환율 없음·모바일·회귀'], ['다음 행동', 'E1–E3와 R1–R3 실행'],
  ['주의 사항', '과제 4 기록·장애·비교 계산 유지'],
] as const;

const format = (value: number) => new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('fresh');
  const [errorCode, setErrorCode] = useState('none');
  const [amount, setAmount] = useState('100');
  const lastGood = viewState === 'empty' ? null : records.at(-1) ?? null;
  const previous = records.at(-2);
  const current = records.at(-1);
  const delta = current && previous ? current.value - previous.value : null;

  const conversion = useMemo(() => {
    if (!lastGood) return { result: '—', note: '현재 환율이 없어 계산할 수 없습니다.' };
    if (amount.trim() === '') return { result: '—', note: '달러 금액을 입력하세요.' };
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) return { result: '—', note: '0 이상의 금액을 입력하세요.' };
    return {
      result: `${format(numericAmount * lastGood.value)} KRW`,
      note: viewState === 'stale' ? '오래된 환율 기준 예상액입니다.' : '현재 환율 기준 예상액입니다.',
    };
  }, [amount, lastGood, viewState]);

  const statusText = viewState === 'fresh'
    ? '● 현재 자료 · fresh · error_code: none'
    : viewState === 'empty'
      ? `● 정상값 없음 · empty · error_code: ${errorCode}`
      : `● 오래된 데이터 · stale · error_code: ${errorCode}`;

  const simulate = (code: string) => { setViewState('stale'); setErrorCode(code); };
  const recover = () => { setViewState('fresh'); setErrorCode('none'); };

  return (
    <main>
      <header>
        <a href="#top">₩ 환율 기록실</a>
        <nav><a href="#converter">개선 기능</a><a href="#c3">장애 실험</a><a href="#assignment5">과제 5 기록</a><a href="#submission">제출 안내</a></nav>
      </header>

      <section className="hero" id="top">
        <div>
          <label>PERSONAL DATA BOARD · 과제 4에서 이어짐</label>
          <h1>오늘의 달러는<br/><em>얼마일까?</em></h1>
          <p>과제 4의 USD/KRW 기록, 출처, 장애 상태와 변화 계산을 유지하면서 과제 5에서 금액별 환산 기능과 AI 인계 기록을 완성했습니다.</p>
        </div>
        <article className={`rate ${viewState === 'fresh' ? '' : viewState}`}>
          <b>{statusText}</b><h3>USD → KRW</h3>
          <div className="big"><small>1 USD</small><strong>{lastGood ? format(lastGood.value) : '—'}</strong><span>KRW</span></div>
          <dl><div><dt>원자료 기준 시각</dt><dd>{lastGood?.sourceTime ?? '표시할 정상값 없음'}</dd></div><div><dt>마지막 조회 시각</dt><dd>{lastGood?.queryTime ?? '—'}</dd></div></dl>
          <a href="https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html" target="_blank" rel="noreferrer">원자료 열기 · 유럽중앙은행(ECB) ↗</a>
        </article>
      </section>

      <section className="panel converter" id="converter">
        <label>과제 5 · 개선 기능</label><h2>달러 금액별 원화 환산기</h2>
        <p>달러 금액을 입력하면 현재 화면의 1 USD 환율로 예상 원화가 즉시 바뀝니다.</p>
        <div className="converter-grid">
          <div><label htmlFor="usdAmount">달러 금액 (USD)</label><input id="usdAmount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} aria-describedby="converterMessage" onChange={(event) => setAmount(event.target.value)}/></div>
          <span className="multiply">×</span>
          <div className="converted"><small>예상 원화</small><strong>{conversion.result}</strong><span>{lastGood ? `1 USD = ${format(lastGood.value)} KRW` : '적용할 환율 없음'}</span></div>
        </div>
        <p className="field-error" id="converterMessage" aria-live="polite">{conversion.note}</p>
      </section>

      <section className="compare" id="c5">
        <div><label>이전 기록과 비교</label><h2>{delta === null ? '비교 자료 부족' : delta > 0 ? '달러 가치가 올랐어요' : delta < 0 ? '달러 가치가 내렸어요' : '변화가 없어요'}</h2></div>
        <strong>{delta === null ? '—' : `${delta > 0 ? '↗ +' : delta < 0 ? '↘ ' : '→ '}${format(delta)} KRW`}</strong>
        <code>{current && previous && delta !== null ? `${format(current.value)} − ${format(previous.value)} = ${delta > 0 ? '+' : ''}${format(delta)} KRW` : '서로 다른 날짜 기록 2건 필요'}</code>
      </section>

      <section className="panel" id="c4">
        <label>날짜별 기록</label><h2>KST 하루 한 건 · 날짜+데이터 종류 고유키</h2><p className="pill">고유키 2개 / 행 2개 · 중복 0건</p>
        <div className="table"><div>기록일　 원자료 기준일　 저장값　 조회 시각　 상태</div>{records.map((row) => <div key={row.recordDate}><b>{row.recordDate}</b>　{row.sourceDate}　{format(row.value)} KRW　{row.queryTime}　<i>✓ 일치</i></div>)}</div>
      </section>

      <section className="panel" id="c3">
        <label>장애 상태 실험실</label><h2>다섯 실패를 별도 상태와 코드로 재현</h2><button onClick={recover}>↻ 정상 조회·복구</button>
        <div className="toolbar"><button onClick={() => { setViewState('empty'); setErrorCode('NO_LAST_GOOD'); }}>정상값 없음 테스트</button></div>
        <div className="modes">{failureModes.map(([code, title, description]) => <button key={code} onClick={() => simulate(code)}><b>{title}</b><small>{description}</small><code>{code}</code></button>)}</div>
        <p>장애 중에도 마지막 정상값은 지우지 않고 <b>오래된 데이터</b>로 표시합니다.</p>
      </section>

      <section className="panel" id="c2"><label>호출 경로와 보안</label><h2>비밀값 0건 · 공개 읽기 자료</h2><div className="path">새 시크릿 브라우저 → 공개 결과 URL → 공개 ECB 원자료 → 변환·일별 저장 → 화면</div><p>API 키, 토큰, OAuth, CAPTCHA와 개인정보를 저장하지 않습니다.</p></section>

      <section className="panel" id="assignment5">
        <label>과제 5 · 카드 1–5</label><h2>같은 기준으로 시작해 저장소와 문서로 인계</h2>
        <div className="guide">{[['1','기준·예산','검사 10개, AI별 6회·30분'],['2','AI A 중단','4/10 통과에서 계획 중단'],['3','인계 문서','첫 대화 없이 7개 항목'],['4','AI B 완성','예외·회귀 포함 10/10'],['5','결과 비교','같은 단위로 다음 기준 확정']].map(([number,title,description]) => <div key={number}><b>{number}</b>{title}<br/><small>{description}</small></div>)}</div>
      </section>

      <section className="panel"><label>한 페이지 인계 문서 · 7개 항목</label><h2>AI B가 받은 내용</h2><div className="handoff7">{handoff.map(([title, description]) => <div key={title}><b>{title}</b><span>{description}</span></div>)}</div></section>

      <section className="panel"><label>최종 검사 · 10 / 10</label><h2>정상 4 · 오류 3 · 회귀 3</h2><div className="check-grid">{checks.map(([number,type,description]) => <div className="check" key={number}><b>{number}</b><span>{type}</span><p>{description}</p><i>통과</i></div>)}</div></section>

      <section className="panel">
        <label>카드 5 · 결과를 가리고 비교</label><h2>두 AI 작업 기록</h2>
        <div className="ai-table"><table><thead><tr><th>작업자</th><th>시간</th><th>요청</th><th>통과 검사</th><th>남긴 오류</th><th>재작업</th><th>인계 이해 오류</th></tr></thead><tbody><tr><th>AI A</th><td>18분</td><td>4/6회</td><td>4/10</td><td>0건</td><td>1개 검사</td><td>—</td></tr><tr><th>AI B</th><td>14분</td><td>2/6회</td><td>10/10</td><td>0건</td><td>0개 검사</td><td>0건</td></tr></tbody></table></div>
        <div className="criteria"><h3>앞으로의 선택 기준</h3><ol><li>새 기능의 구조와 핵심 계산은 AI A부터 사용하고 정상 검사 4개가 통과하면 인계한다.</li><li>예외 처리와 회귀 검사는 AI B부터 사용하고 같은 오류가 2번 반복되면 사람이 범위를 줄인다.</li><li>어느 AI든 요청 6회 또는 30분에 도달하면 저장소와 인계 문서를 남기고 교체한다.</li></ol></div>
      </section>

      <section className="panel" id="submission">
        <label>제출용 검증 안내서</label><h2>30초 확인 방법</h2>
        <div className="audit"><div><b>어디로 가나요</b><span>공개 화면의 ‘달러 금액별 원화 환산기’</span></div><div><b>무엇을 하나요</b><span>달러 금액을 100에서 1로 바꿉니다.</span></div><div><b>무엇이 보이면 통과인가요</b><span>예상 원화가 현재 1 USD 환율과 같은 값으로 즉시 바뀝니다.</span></div></div>
        <p><b>안 될 때</b> · ‘정상 조회·복구’를 누른 뒤 금액을 다시 입력합니다.</p>
        <h3>AI 3줄</h3><p><b>AI에게 맡긴 일</b> 환산 계산·예외 처리·검사 초안 작성<br/><b>내가 판단한 일</b> 기능 범위와 6회·30분 상한, 인계 시점 확정<br/><b>AI 말을 안 들은 일</b> 새 API 추가 대신 과제 4의 검증된 환율을 재사용</p>
      </section>

      <footer>원자료 유럽중앙은행(ECB) · 공개 심사용 개인정보 및 비밀값 없음 · 대한민국 표준시(KST)</footer>
    </main>
  );
}
