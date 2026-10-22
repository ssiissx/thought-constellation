// 생각의 별자리 — 모바일 도감
// 화면은 둘뿐: 목록(#home)과 인물 한 명(#person). 주소는 #/ 와 #/p/<id>.
// 인물 화면에서는 위아래로 읽고, 좌우로 밀면 태어난 순서의 앞뒤 인물로 넘어간다.
(() => {
  'use strict';
  const { people: P, concepts: C, credit: CREDIT } = window.DATA;
  const byId = Object.create(null);
  P.forEach((p, i) => { p.i = i; byId[p.id] = p; });

  const FIELD = {
    west: { name: '서양 철학', seal: '西哲' },
    east: { name: '동양 철학', seal: '東哲' },
    psy: { name: '심리학', seal: '心理' },
  };
  const NUM = '一二三四五六七';
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  // 목록의 시대 구분: 태어난 해 + 40(한창 활동한 때)으로 나눈다
  const PERIODS = [
    { to: 450, name: '고대', range: '기원전 7세기 – 5세기' },
    { to: 1450, name: '중세', range: '5 – 15세기' },
    { to: 1700, name: '르네상스와 근세', range: '15 – 17세기' },
    { to: 1800, name: '계몽의 시대', range: '18세기' },
    { to: 1900, name: '19세기', range: '1800 – 1900' },
    { to: 1950, name: '20세기 전반', range: '1900 – 1950' },
    { to: Infinity, name: '20세기 후반 이후', range: '1950 –' },
  ];
  const periodOf = p => PERIODS.findIndex(x => p.b + 40 < x.to);

  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19l5-14 5 14M5.8 14h6.4"/><path d="M15.5 12.5c.6-1 1.6-1.5 2.8-1.5 1.7 0 2.7 1 2.7 2.7V19m0-3.6c-.8-.6-1.7-.9-2.8-.9-1.6 0-2.7.8-2.7 2.2 0 1.3 1 2.3 2.5 2.3 1.4 0 2.4-.8 3-2"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>',
    resume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h9.5A3.5 3.5 0 0 1 18 8v11.5l-4-2.5-4 2.5V8"/><path d="M5 4.5V17"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 3.5h10v17l-5-4-5 4z"/></svg>',
    markOn: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 3.5h10v17l-5-4-5 4z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  };

  // ── 저장(이 폰의 브라우저 안에만): 갈피, 마지막으로 본 사람, 화면 설정 ──
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tc.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('tc.' + k, JSON.stringify(v)); } catch { /* 저장 못 해도 앱은 돈다 */ } },
  };
  const favs = new Set(store.get('fav', []).filter(id => byId[id]));
  const settings = Object.assign({ theme: 'auto', fs: 1 }, store.get('set', {}));

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const em = s => esc(s).replace(/\*(.+?)\*/g, '<b>$1</b>');
  const yearStr = y => (y < 0 ? `기원전 ${-y}` : String(y));
  const noStr = p => 'No.' + String(p.no).padStart(3, '0');
  function lifespan(p) {
    const pre = p.approx ? '약 ' : '';
    if (p.d == null) return `${pre}${yearStr(p.b)} –`;
    if (p.b < 0 && p.d < 0) return `${pre}기원전 ${-p.b} – ${-p.d}`;
    if (p.b < 0) return `${pre}기원전 ${-p.b} – 기원후 ${p.d}`;
    return `${pre}${p.b} – ${p.d}`;
  }
  // '이황(퇴계)' → 이황 + 작은 글씨 (퇴계)
  const nameHtml = n => { const m = n.match(/^(.+?)\((.+)\)$/); return m ? `${esc(m[1])}<small>${esc(m[2])}</small>` : esc(n); };
  const oval = (p, size = '') => `<span class="oval ${size}">${p.img
    ? `<img src="img/t/${p.id}.webp" alt="" loading="lazy" decoding="async">`
    : `<span class="mono">${esc(p.name[0])}</span>`}</span>`;

  const home = $('#home');
  const person = $('#person');
  let view = '';
  let homeScroll = 0;
  let current = null;

  // ── 화면 설정 ─────────────────────────────────────
  function applySettings() {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme'); else root.dataset.theme = settings.theme;
    root.style.setProperty('--fs', settings.fs);
    requestAnimationFrame(() => {
      const bg = getComputedStyle(root).getPropertyValue('--paper').trim();
      $('meta[name="theme-color"]').setAttribute('content', bg || '#efe6d4');
    });
  }
  applySettings();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applySettings);

  // ── 검색 색인: 이름(초성 포함) > 한 줄 소개·핵심·사상·개념 ─────────
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
  const chosung = s => [...s].map(ch => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch; }).join('');
  const index = P.map(p => ({
    p,
    name: norm(p.name + p.en),
    cho: chosung(norm(p.name)),
    // [표시 이름, 원문, 정규화, 가중치]
    fields: [
      ['', p.tag, 45],
      ...p.ideas.map(([t]) => ['사상', t, 40]),
      ...p.cons.map(id => ['개념', C[id].name, 35]),
      ...p.key.map(k => ['핵심', k.replace(/\*/g, ''), 30]),
      ['', p.era + ' ' + p.place, 10],
    ].map(([lb, t, w]) => [lb, t, norm(t), w]),
  }));
  function search(q) {
    const nq = norm(q);
    const isCho = /^[ㄱ-ㅎ]+$/.test(nq);
    const people = [];
    for (const x of index) {
      let score = 0, why = '';
      if (x.name.startsWith(nq)) score = 100;
      else if (x.name.includes(nq)) score = 80;
      else if (isCho && x.cho.includes(nq)) score = 70;
      else if (!isCho) {
        // 가장 무거운 칸 하나 + 여러 칸에 걸리면 조금씩 더, 사상 제목이 검색어와 같으면 크게 더
        const hits = x.fields.filter(f => f[2].includes(nq)).sort((a, b) => b[3] - a[3]);
        if (hits.length) {
          score = hits[0][3] + (hits.length - 1) * 5 + (hits.some(f => f[0] === '사상' && f[2] === nq) ? 15 : 0);
          const shown = hits.find(f => f[0]);
          why = hits[0][0] ? `${hits[0][0]} · ${hits[0][1]}` : shown && hits[0][3] < 45 ? `${shown[0]} · ${shown[1]}` : '';
        }
      }
      if (score) people.push({ p: x.p, score, why });
    }
    people.sort((a, b) => b.score - a.score || a.p.i - b.p.i);
    const concepts = isCho ? [] : Object.entries(C)
      .filter(([, c]) => norm(c.name + (c.en || '')).includes(nq) || norm(c.one).includes(nq))
      .sort(([, a], [, b]) => norm(b.name).includes(nq) - norm(a.name).includes(nq));
    return { people, concepts };
  }

  // ── 첫 화면 ─────────────────────────────────────
  const state = { filter: 'all', q: '' };
  function todayPick() {
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
    return P[(day * 61) % P.length]; // 61은 149와 서로소라 매일 다른 시대의 사람이 나온다
  }
  function quickHtml() {
    const last = byId[store.get('last', '')];
    return `<button data-act="random">${I.dice}<span>아무나 펼치기</span></button>
      ${last ? `<a href="#/p/${last.id}">${I.resume}<span>이어 보기 · ${esc(last.name)}</span></a>` : ''}`;
  }
  function renderHome() {
    const t = todayPick();
    const counts = { all: P.length, west: 0, east: 0, psy: 0 };
    P.forEach(p => counts[p.f]++);
    const chip = (key, label, color) => `<button class="chip" data-filter="${key}" aria-pressed="${state.filter === key}">${color ? `<span class="dot" style="--c:var(--${color})"></span>` : ''}${label}<span class="n">${key === 'fav' ? favs.size : counts[key]}</span></button>`;
    home.innerHTML = `
      <header class="masthead">
        <button class="icon-btn set-btn" data-act="settings" aria-label="화면 설정">${I.type}</button>
        <p class="over">철학 · 심리학 인물 도감</p>
        <h1>생각의 별자리</h1>
        <div class="orn"><span>思</span></div>
        <p class="sub">${P.length}명의 생각을 한 사람씩 펼쳐 보는 책</p>
      </header>
      <a class="today" href="#/p/${t.id}">
        <span class="today-l">오늘의 인물</span>
        ${oval(t, 'lg')}
        <span class="today-b">
          <span class="no">${noStr(t)} · ${FIELD[t.f].name}</span>
          <span class="nm">${nameHtml(t.name)}</span>
          <span class="tg">${esc(t.tag)}</span>
          <span class="go">펼쳐 보기 ${I.ext}</span>
        </span>
      </a>
      <div class="quick">${quickHtml()}</div>
      <div class="install" hidden></div>
      <div class="toolbar">
        <label class="search">${I.search}
          <input type="search" placeholder="인물·사상·개념 찾기 (초성도 돼요)" enterkeyhint="search" autocomplete="off" value="${esc(state.q)}" aria-label="검색">
          <button class="clear" data-act="clear" aria-label="검색어 지우기" ${state.q ? '' : 'hidden'}>${I.close}</button>
        </label>
        <div class="chips" role="group" aria-label="분야">
          ${chip('all', '전체')}${chip('west', '서양 철학', 'west')}${chip('east', '동양 철학', 'east')}${chip('psy', '심리학', 'psy')}${chip('fav', '갈피')}
        </div>
      </div>
      <div class="list"></div>
      <footer class="foot">
        <p>인물 ${P.length} · 개념 ${Object.keys(C).length} · 원전 읽기 ${P.filter(p => p.deep).length}명</p>
        <p>초상은 위키미디어 공용의 자유 이용 이미지를 도감 톤으로 바꾼 것이에요 · <button data-act="credits">사진 출처</button></p>
      </footer>`;
    renderList();
    updateInstall();
  }

  const row = (p, why = '') => `<a class="row" href="#/p/${p.id}">${oval(p)}<span class="rb">
      <span class="no">${noStr(p)} · ${lifespan(p)}</span>
      <span class="nm">${nameHtml(p.name)}</span>
      ${why ? `<span class="why">${esc(why)}</span>` : `<span class="tg">${esc(p.tag)}</span>`}
    </span>${favs.has(p.id) ? '<span class="ribbon" title="갈피"></span>' : ''}</a>`;

  function renderList() {
    const list = $('.list', home);
    const inPool = p => state.filter === 'all' || (state.filter === 'fav' ? favs.has(p.id) : p.f === state.filter);
    const q = state.q.trim();
    if (q) {
      const { people, concepts } = search(q);
      const ps = people.filter(r => inPool(r.p));
      list.innerHTML = (ps.length ? `<div class="period"><h2>인물</h2><span class="count">${ps.length}명</span></div>${ps.map(r => row(r.p, r.why)).join('')}` : '')
        + (concepts.length ? `<div class="period"><h2>개념</h2><span class="count">${concepts.length}개</span></div>${concepts.map(([id, c]) =>
          `<button class="crow" data-concept="${id}"><span class="nm">${esc(c.name)}</span>${c.en ? `<span class="en">${esc(c.en)}</span>` : ''}<span class="one">${esc(c.one)}</span></button>`).join('')}` : '')
        || `<p class="empty"><span class="big">찾는 이름이 없어요</span>다른 낱말이나 초성(예: ㅍㄹㅇㅌ)으로 찾아보세요.</p>`;
      return;
    }
    const pool = P.filter(inPool);
    if (!pool.length) {
      list.innerHTML = state.filter === 'fav'
        ? '<p class="empty"><span class="big">아직 꽂아 둔 갈피가 없어요</span>인물 화면 오른쪽 위의 책갈피를 누르면 여기에 모여요.</p>'
        : '<p class="empty">보여 줄 인물이 없어요.</p>';
      return;
    }
    const groups = new Map();
    for (const p of pool) { const k = periodOf(p); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
    list.innerHTML = [...groups].map(([k, ps]) => `<div class="period"><h2>${PERIODS[k].name}</h2><span class="range">${PERIODS[k].range}</span><span class="count">${ps.length}명</span></div>${ps.map(p => row(p)).join('')}`).join('');
  }

  // 설치 안내: 안드로이드 크롬은 설치 창을 직접 띄우고, 아이폰은 방법을 알려 준다
  let installEvt = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; updateInstall(); });
  function updateInstall() {
    const box = $('.install', home);
    if (!box) return;
    if (standalone() || store.get('noInstall', false) || !(installEvt || isIOS)) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = installEvt
      ? `<p style="flex:1"><b>홈 화면에 설치</b>하면 인터넷 없이도 앱처럼 열려요.</p><button class="do" data-act="install">설치</button><button class="x" data-act="noinstall" aria-label="닫기">${I.close}</button>`
      : `<p style="flex:1">사파리 아래쪽 <b>공유 버튼 → 홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요.</p><button class="x" data-act="noinstall" aria-label="닫기">${I.close}</button>`;
  }

  // ── 인물 화면 ───────────────────────────────────
  function renderPerson(p) {
    const fld = FIELD[p.f];
    const prev = P[p.i - 1], next = P[p.i + 1];
    const secs = [];

    secs.push(['core', '핵심', '핵심 세 줄', `
      <ol class="keys">${p.key.map(k => `<li>${em(k)}</li>`).join('')}</ol>
      <div class="more">
        <p class="lb3">개요</p>
        <div class="more-body"><p>${esc(p.sum)}</p></div>
        <button class="more-btn" data-act="more" aria-expanded="false"><span>개요 더 읽기</span>${I.chev}</button>
      </div>`]);

    secs.push(['idea', '사상', '사상과 이론', `
      ${p.ideas.map(([t, x], i) => `<article class="idea card rv"><h3><span class="i">${ROMAN[i] || i + 1}</span><span>${esc(t)}</span></h3><p>${esc(x)}</p></article>`).join('')}
      ${p.easy ? `<div class="easy rv"><p class="lb3">쉽게 말하면</p><p>${esc(p.easy)}</p></div>` : ''}`]);

    if (p.cons.length) secs.push(['con', '개념', '알아 둘 개념', `<div>${p.cons.map(id => conceptHtml(id, p.id)).join('')}</div>`]);

    secs.push(['story', '일화', '유명한 일화', `
      <p class="lead rv">${esc(p.hook)}</p>
      ${p.picks.map(i => { const [y, t, x] = p.life[i]; return `<article class="story card rv" id="st-${i}">${y == null ? '' : `<p class="yr">${yearStr(y)}년</p>`}<h3>${esc(t)}</h3><p>${esc(x)}</p></article>`; }).join('')}
      ${p.fun ? `<aside class="aside rv"><p class="lb3">여담</p><p>${esc(p.fun)}</p></aside>` : ''}`]);

    secs.push(['word', '어록', '남긴 말', `
      <figure class="quote card rv"><blockquote><p>${esc(p.q)}</p></blockquote><figcaption>— ${esc(p.qs)}</figcaption></figure>
      ${p.deep ? `<h3 class="sub-h">원전으로 읽기</h3>${p.deep.map(t => `<article class="src card rv">
          <h4>${esc(t.t)}</h4><p class="src-from">${esc(t.src)}</p>
          <div class="src-text">${t.ko.map(x => `<p>${esc(x)}</p>`).join('')}</div>
          ${t.note && t.note.length ? `<div class="src-note"><p class="lb3">읽기 도움</p>${t.note.map(x => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
        </article>`).join('')}` : ''}
      ${p.myth ? `<aside class="myth rv"><p class="lb3">흔한 오해</p><p>${esc(p.myth)}</p></aside>` : ''}`]);

    secs.push(['life', '생애', '생애', `
      <ol class="tl">${p.life.map(([y, t, x], i) => { const pick = p.picks.includes(i); return `<li class="${pick ? 'pick' : ''}">
        <button class="tl-btn" data-act="tl" aria-expanded="false"><span class="y">${y == null ? '·' : y < 0 ? `<small>기원전</small>${-y}` : y}</span><span class="t">${esc(t)}${pick ? '<span class="tag-pick">일화</span>' : ''}</span>${I.chev}</button>
        <div class="tl-body"><div><p>${esc(x)}</p></div></div></li>`; }).join('')}</ol>
      ${p.works.length ? `<h3 class="sub-h">대표 저서</h3><ul class="works">${p.works.map(([w, y]) => `<li><span>${/[『—]/.test(w) ? esc(w) : `『${esc(w)}』`}</span><span class="leader"></span><span class="wy">${y == null ? '' : yearStr(y)}</span></li>`).join('')}</ul>` : ''}
      <p class="place-line">태어난 곳 · ${esc(p.place)}</p>`]);

    const relList = (title, list) => list.length ? `<h3 class="rel-h">${title}</h3>${[...list].sort((a, b) => byId[a[0]].b - byId[b[0]].b).map(([id, note]) => {
      const r = byId[id]; return `<a class="rel" href="#/p/${id}">${oval(r, 'sm')}<span><span class="nm">${nameHtml(r.name)} <small>${lifespan(r)}</small></span>${note ? `<span class="note">${esc(note)}</span>` : ''}</span></a>`;
    }).join('')}` : '';
    const links = relList('영향을 준 사람', p.rel.from) + relList('영향을 받은 사람', p.rel.to) + relList('맞선 사람', p.rel.vs);
    if (links) secs.push(['link', '연결', '이어지는 사람들', links]);

    const credit = CREDIT[p.id];
    return `<div class="page">
      <header class="topbar">
        <button class="back" data-act="back">${I.back}<span>목록</span></button>
        <p class="ttl">${esc(p.name)}</p>
        <button class="icon-btn mark-btn" data-act="fav" aria-pressed="${favs.has(p.id)}" aria-label="갈피 꽂기">${favs.has(p.id) ? I.markOn : I.mark}</button>
      </header>
      <section class="hero">
        <div class="hero-top"><span class="no">${noStr(p)}</span><span>${esc(p.era)}</span></div>
        <div class="hero-grid">
          <figure class="frame">${p.img ? `<img src="img/${p.id}.webp" alt="${esc(p.name)}의 초상" decoding="async">` : `<span class="mono-big">${esc(p.name[0])}</span>`}
            <span class="seal" aria-label="${fld.name}">${[...fld.seal].map(c => `<span>${c}</span>`).join('')}</span></figure>
          <div class="who">
            <p class="fld" style="--fc:var(--${p.f})"><span class="dot"></span>${fld.name}</p>
            <h1>${nameHtml(p.name)}</h1>
            <p class="en">${esc(p.en)}</p>
            <p class="yrs">${lifespan(p)}${p.d == null ? '<span class="alive">생존</span>' : ''}</p>
          </div>
        </div>
        ${credit ? `<button class="credit" data-act="credit">사진 · ${esc(credit.artist || '위키미디어 공용')}</button>` : ''}
        <p class="tagline">${esc(p.tag)}</p>
      </section>
      <nav class="tabs" aria-label="이 인물의 차례">${secs.map(s => `<button class="tab" data-to="s-${s[0]}">${s[1]}</button>`).join('')}<span class="ind"></span></nav>
      ${secs.map((s, i) => `<section class="sec" id="s-${s[0]}"><h2 class="sh"><span class="sn">${NUM[i]}</span>${s[2]}</h2>${s[3]}</section>`).join('')}
      <nav class="pager" aria-label="앞뒤 인물">
        ${prev ? `<a class="pg card prev" href="#/p/${prev.id}" data-swap="-1"><span class="dir">${I.left}이전</span><span class="nm">${esc(prev.name)}</span><span class="no">${noStr(prev)}</span></a>` : ''}
        ${next ? `<a class="pg card next" href="#/p/${next.id}" data-swap="1"><span class="dir">다음${I.right}</span><span class="nm">${esc(next.name)}</span><span class="no">${noStr(next)}</span></a>` : ''}
      </nav>
      <div class="end"><span>終</span><p>${noStr(p)} / ${P.length}</p><p>좌우로 밀면 앞뒤 사람으로 넘어가요</p></div>
    </div>
    ${prev ? `<button class="side-nav l" data-swap="-1" aria-label="이전 인물">${I.left}</button>` : ''}
    ${next ? `<button class="side-nav r" data-swap="1" aria-label="다음 인물">${I.right}</button>` : ''}`;
  }

  function conceptHtml(id, self) {
    const c = C[id];
    const others = c.by.filter(x => x !== self && byId[x]);
    return `<article class="cdef rv">
      <h3 class="hw">${esc(c.name)}${c.en ? `<span class="en">${esc(c.en)}</span>` : ''}</h3>
      <p class="def"><span class="lb">뜻</span>${esc(c.one)}</p>
      ${c.ex ? `<p class="ex"><span class="lb">예</span>${esc(c.ex)}</p>` : ''}
      ${c.body.length ? `<div class="acc"><button class="acc-btn" data-act="acc" aria-expanded="false"><span>자세히 읽기</span>${I.chev}</button>
        <div class="acc-body"><div>${c.body.map(b => `<p>${esc(b)}</p>`).join('')}</div></div></div>` : ''}
      ${others.length ? `<p class="also">함께 보기 ${others.map(x => `<a class="mini" href="#/p/${x}">${esc(byId[x].name)}</a>`).join('')}</p>` : ''}
    </article>`;
  }

  // 인물 화면이 그려진 뒤: 차례 탭, 떠오르기 효과, 제목 표시
  let io = null;
  let pageRefs = null;
  function setupPerson(page) {
    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
      $$('.rv', page).forEach(el => io.observe(el));
    } else $$('.rv', page).forEach(el => el.classList.add('in'));
    const tabs = $('.tabs', page);
    pageRefs = {
      page, tabs, ind: $('.ind', tabs), btns: $$('.tab', tabs), topbar: $('.topbar', page), h1: $('.who h1', page),
      secs: $$('.tab', tabs).map(b => document.getElementById(b.dataset.to)), active: -1,
    };
    onScroll();
  }
  const navOffset = () => (pageRefs ? pageRefs.topbar.offsetHeight + pageRefs.tabs.offsetHeight : 96);
  function setActive(i) {
    const r = pageRefs;
    if (!r || i === r.active) return;
    r.active = i;
    r.btns.forEach((b, k) => b.classList.toggle('on', k === i));
    const b = r.btns[i];
    r.ind.style.width = b.offsetWidth - 22 + 'px';
    r.ind.style.transform = `translateX(${b.offsetLeft + 11}px)`;
    r.tabs.scrollTo({ left: b.offsetLeft - r.tabs.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
  }
  let ticking = false;
  function onScroll() {
    if (view === 'home') {
      const tb = $('.toolbar', home);
      if (tb) tb.classList.toggle('stuck', tb.getBoundingClientRect().top <= 0.5);
      return;
    }
    const r = pageRefs;
    if (!r) return;
    r.topbar.classList.toggle('show', r.h1.getBoundingClientRect().bottom < r.topbar.offsetHeight);
    const line = navOffset() + 24;
    let i = 0;
    r.secs.forEach((s, k) => { if (s.getBoundingClientRect().top <= line) i = k; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = r.secs.length - 1; // 맨 끝이면 마지막 탭
    setActive(i);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', () => { if (pageRefs) { const a = pageRefs.active; pageRefs.active = -1; setActive(Math.max(a, 0)); } });

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - navOffset() + 4, behavior: 'smooth' });
  }

  // ── 화면 전환과 주소 ────────────────────────────────
  // 앱 안에서 쌓인 주소를 기억해 두면 '목록' 버튼이 실제 뒤로 가기와 같게 동작한다
  const stack = [];
  function showHome() {
    current = null;
    pageRefs = null;
    if (view !== 'home') {
      person.hidden = true;
      person.innerHTML = '';
      home.hidden = false;
      if (!home.firstChild) renderHome();
      else $('.quick', home).innerHTML = quickHtml();
      home.classList.remove('view-in'); void home.offsetWidth; home.classList.add('view-in');
      view = 'home';
      document.title = '생각의 별자리';
      requestAnimationFrame(() => { scrollTo(0, homeScroll); onScroll(); });
    }
  }
  function refreshChipsCount() {
    const favChip = $('.chip[data-filter="fav"] .n', home);
    if (favChip) favChip.textContent = favs.size;
  }
  function showPerson(id, how = 'nav') {
    const p = byId[id];
    if (view === 'home') homeScroll = scrollY;
    current = p;
    home.hidden = true;
    person.hidden = false;
    person.innerHTML = renderPerson(p);
    const page = $('.page', person);
    if (how !== 'swipe') { person.classList.remove('view-in'); void person.offsetWidth; person.classList.add('view-in'); }
    page.classList.add('enter');
    view = 'person';
    scrollTo(0, 0);
    setupPerson(page);
    store.set('last', id);
    document.title = `${p.name} — 생각의 별자리`;
    if (!store.get('hinted', false)) { store.set('hinted', true); setTimeout(() => toast('좌우로 밀면 앞뒤 인물로 넘어가요'), 1400); }
  }
  function route() {
    const h = location.hash || '#/';
    if (stack.length >= 2 && stack[stack.length - 2] === h) stack.pop();
    else if (stack[stack.length - 1] !== h) stack.push(h);
    const m = h.match(/^#\/p\/([\w-]+)/);
    if (m && byId[m[1]]) showPerson(m[1]);
    else showHome();
  }
  addEventListener('hashchange', route);
  function goBackToList() {
    const idx = stack.lastIndexOf('#/');
    if (idx >= 0 && idx < stack.length - 1) history.go(idx - (stack.length - 1));
    else { stack.length = 0; location.replace('#/'); }
  }

  // ── 좌우로 밀어 넘기기 ───────────────────────────────
  const peekL = Object.assign(document.createElement('div'), { className: 'peek l' });
  const peekR = Object.assign(document.createElement('div'), { className: 'peek r' });
  document.body.append(peekL, peekR);
  let swapping = false;
  function swap(dir) {
    if (!current || swapping) return;
    const target = P[current.i + dir];
    const page = $('.page', person);
    if (!target || !page) return;
    swapping = true;
    peekL.classList.remove('on', 'go'); peekR.classList.remove('on', 'go');
    page.classList.remove('dragging');
    page.classList.add('settle');
    page.style.transform = `translate3d(${dir > 0 ? -38 : 38}vw,0,0)`;
    page.style.opacity = '0';
    setTimeout(() => {
      history.replaceState(null, '', '#/p/' + target.id);
      stack[stack.length - 1] = '#/p/' + target.id;
      showPerson(target.id, 'swipe');
      const np = $('.page', person);
      np.style.transform = `translate3d(${dir > 0 ? 30 : -30}vw,0,0)`;
      np.style.opacity = '0';
      void np.offsetWidth;
      np.classList.add('settle');
      np.style.transform = '';
      np.style.opacity = '';
      setTimeout(() => { np.classList.remove('settle'); swapping = false; }, 340);
    }, 200);
  }

  let drag = null;
  person.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || swapping || !current) return;
    if (e.target.closest('.tabs, input, .seg')) return;
    if (e.clientX < 18 || e.clientX > innerWidth - 18) return; // 화면 가장자리는 운영체제의 뒤로 가기 몸짓에 양보
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now(), dx: 0, axis: null };
  });
  person.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 10) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
      if (drag.axis === 'y') { drag = null; return; }
      $('.page', person).classList.add('dragging');
    }
    const page = $('.page', person);
    const target = P[current.i + (dx < 0 ? 1 : -1)];
    const d = target ? dx : dx * 0.22; // 끝에서는 고무줄처럼 버틴다
    drag.dx = dx;
    page.style.transform = `translate3d(${d}px,0,0)`;
    page.style.opacity = String(1 - Math.min(Math.abs(d) / innerWidth, 1) * 0.35);
    const pk = dx < 0 ? peekR : peekL, other = dx < 0 ? peekL : peekR;
    other.classList.remove('on', 'go');
    if (target && Math.abs(dx) > 24) {
      if (pk.dataset.id !== target.id) { pk.dataset.id = target.id; pk.innerHTML = `<small>${dx < 0 ? '다음' : '이전'} · ${noStr(target)}</small>${esc(target.name)}`; }
      pk.classList.add('on');
      pk.classList.toggle('go', Math.abs(dx) > innerWidth * 0.26);
    } else pk.classList.remove('on', 'go');
  });
  const endDrag = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (d.axis !== 'x') return;
    const v = d.dx / Math.max(performance.now() - d.t, 1);
    const dir = d.dx < 0 ? 1 : -1;
    if (P[current.i + dir] && (Math.abs(d.dx) > innerWidth * 0.26 || (Math.abs(v) > 0.55 && Math.abs(d.dx) > 50))) { swap(dir); return; }
    const page = $('.page', person);
    page.classList.remove('dragging');
    page.classList.add('settle');
    page.style.transform = '';
    page.style.opacity = '';
    peekL.classList.remove('on', 'go'); peekR.classList.remove('on', 'go');
    setTimeout(() => page.classList.remove('settle'), 340);
  };
  person.addEventListener('pointerup', endDrag);
  person.addEventListener('pointercancel', endDrag);

  addEventListener('keydown', e => {
    if (view !== 'person' || e.target.closest('input, textarea') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') swap(1);
    else if (e.key === 'ArrowLeft') swap(-1);
  });

  // ── 아래에서 올라오는 시트 ────────────────────────────
  const sheetRoot = $('#sheet-root');
  function openSheet(html) {
    closeSheet(true);
    sheetRoot.innerHTML = `<div class="backdrop" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><button class="icon-btn close" data-act="close-sheet" aria-label="닫기">${I.close}</button>${html}</div>`;
    const sh = $('.sheet', sheetRoot), bd = $('.backdrop', sheetRoot);
    requestAnimationFrame(() => { sh.classList.add('open'); bd.classList.add('open'); });
    // 손잡이를 아래로 끌어 닫기
    let y0 = null;
    sh.addEventListener('touchstart', e => { y0 = sh.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)`; } }, { passive: true });
    sh.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; sh.style.transition = ''; sh.style.transform = ''; y0 = null; if (dy > 110) closeSheet(); });
  }
  function closeSheet(now) {
    const sh = $('.sheet', sheetRoot), bd = $('.backdrop', sheetRoot);
    if (!sh) return;
    if (now) { sheetRoot.innerHTML = ''; return; }
    sh.classList.remove('open'); bd.classList.remove('open');
    setTimeout(() => { if (sheetRoot.contains(sh)) sheetRoot.innerHTML = ''; }, 380);
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  function settingsSheet() {
    const seg = (key, opts) => `<div class="seg" data-set="${key}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(settings[key]) === String(v)}">${l}</button>`).join('')}</div>`;
    openSheet(`<h2>화면 설정</h2><p class="s-sub">이 기기에서만 기억해요</p>
      <div class="setting"><p>글자 크기</p>${seg('fs', [[0.92, '작게'], [1, '보통'], [1.08, '크게'], [1.16, '아주 크게']])}</div>
      <div class="setting"><p>바탕</p>${seg('theme', [['auto', '기기 설정대로'], ['light', '한지'], ['dark', '먹지']])}</div>
      <div class="setting">
        ${installEvt && !standalone() ? `<button class="s-btn" data-act="install">홈 화면에 설치${I.ext}</button>` : ''}
        <button class="s-btn" data-act="credits">사진 출처 ${Object.keys(CREDIT).length}장${I.ext}</button>
      </div>
      <p class="s-note">철학·심리학 인물 ${P.length}명을 태어난 순서로 엮었어요. 글은 데스크톱판 ‘생각의 별자리’에서 사실 검증을 거친 내용을 옮겼고, 핵심 세 줄은 그 내용을 요약한 거예요. 갈피와 설정은 이 기기의 브라우저에만 저장돼요.</p>`);
  }
  function creditsSheet() {
    openSheet(`<h2>사진 출처</h2><p class="s-sub">위키미디어 공용 · 도감 톤으로 색을 바꿔 썼어요</p>
      ${P.filter(p => CREDIT[p.id]).map(p => { const c = CREDIT[p.id]; return `<div class="cr"><b>${esc(p.name)}</b><span>${esc(c.artist || '작자 미상')} · ${esc(c.license || '')}${c.page ? ` · <a href="${esc(c.page)}" target="_blank" rel="noopener">원본</a>` : ''}</span></div>`; }).join('')}`);
  }
  // 검색에서 고른 개념: 뜻·예·자세히 + 이 개념의 인물들(함께 보기)
  const conceptSheet = id => openSheet(conceptHtml(id, null).replace('cdef rv', 'cdef'));

  // ── 알림 한 줄 ────────────────────────────────────
  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ── 누르기(모든 버튼을 한곳에서) ───────────────────────
  document.addEventListener('click', e => {
    const swapEl = e.target.closest('[data-swap]');
    if (swapEl && view === 'person') { e.preventDefault(); swap(+swapEl.dataset.swap); return; }
    const f = e.target.closest('[data-filter]');
    if (f) {
      state.filter = f.dataset.filter;
      $$('.chip', home).forEach(c => c.setAttribute('aria-pressed', c === f));
      renderList();
      const tb = $('.toolbar', home);
      if (tb.getBoundingClientRect().top < 0) scrollTo({ top: tb.offsetTop, behavior: 'smooth' });
      return;
    }
    const tab = e.target.closest('.tab');
    if (tab) { jumpTo(tab.dataset.to); return; }
    const cpt = e.target.closest('[data-concept]');
    if (cpt) { conceptSheet(cpt.dataset.concept); return; }
    const segBtn = e.target.closest('.seg button');
    if (segBtn) {
      const key = segBtn.parentElement.dataset.set;
      settings[key] = key === 'fs' ? +segBtn.dataset.v : segBtn.dataset.v;
      store.set('set', settings);
      $$('button', segBtn.parentElement).forEach(b => b.setAttribute('aria-pressed', b === segBtn));
      applySettings();
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a) {
      // 시트 안의 인물 링크를 누르면 시트를 닫고 이동
      if (e.target.closest('.sheet a[href^="#/"]')) closeSheet();
      return;
    }
    const act = a.dataset.act;
    if (act === 'back') goBackToList();
    else if (act === 'fav') {
      const id = current.id;
      if (favs.has(id)) { favs.delete(id); toast('갈피를 뺐어요'); } else { favs.add(id); toast('갈피를 꽂았어요 · 목록의 ‘갈피’에서 모아 봐요'); }
      store.set('fav', [...favs]);
      a.setAttribute('aria-pressed', favs.has(id));
      a.innerHTML = favs.has(id) ? I.markOn : I.mark;
      a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
      if (home.firstChild) { renderList(); refreshChipsCount(); }
    } else if (act === 'more') {
      const box = a.closest('.more'), body = $('.more-body', box);
      const open = !box.classList.contains('open');
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '';
      box.classList.toggle('open', open);
      a.setAttribute('aria-expanded', open);
      $('span', a).textContent = open ? '접기' : '개요 더 읽기';
    } else if (act === 'acc') {
      const box = a.closest('.acc');
      box.classList.toggle('open');
      a.setAttribute('aria-expanded', box.classList.contains('open'));
      $('span', a).textContent = box.classList.contains('open') ? '접기' : '자세히 읽기';
    } else if (act === 'tl') {
      const li = a.closest('li');
      li.classList.toggle('open');
      a.setAttribute('aria-expanded', li.classList.contains('open'));
    } else if (act === 'random') {
      let p; do { p = P[Math.floor(Math.random() * P.length)]; } while (current && p === current);
      location.hash = '#/p/' + p.id;
    } else if (act === 'clear') {
      const inp = $('.search input', home);
      inp.value = ''; state.q = ''; a.hidden = true; renderList(); inp.focus();
    } else if (act === 'settings') settingsSheet();
    else if (act === 'credits') creditsSheet();
    else if (act === 'credit') {
      const c = CREDIT[current.id];
      openSheet(`<h2>${esc(current.name)}의 초상</h2><p class="s-sub">위키미디어 공용 · 도감 톤으로 색을 바꿔 썼어요</p>
        <div class="cr"><b>${esc(c.artist || '작자 미상')}</b><span>${esc(c.license)}${c.page ? ` · <a href="${esc(c.page)}" target="_blank" rel="noopener">원본 보기</a>` : ''}</span></div>`);
    } else if (act === 'close-sheet') closeSheet();
    else if (act === 'install' && installEvt) {
      installEvt.prompt();
      installEvt.userChoice.finally(() => { installEvt = null; updateInstall(); closeSheet(); });
    } else if (act === 'noinstall') { store.set('noInstall', true); updateInstall(); }
  });

  home.addEventListener('input', e => {
    if (!e.target.matches('.search input')) return;
    state.q = e.target.value;
    $('.clear', home).hidden = !state.q;
    renderList();
  });
  home.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.search input')) e.target.blur(); });

  // ── 시작 ─────────────────────────────────────────
  route();
  // 오프라인 저장(서비스 워커). 개발용 로컬 미리보기에서는 ?sw를 붙였을 때만 켠다.
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && (!local || /[?&]sw\b/.test(location.search))) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
