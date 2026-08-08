/**
 * Agents Hub + house_price_analyzer
 */
const AG = (() => {
  const DATA_BASE = '/assets/data/house_price';
  const $ = id => document.getElementById(id);
  const isDark = () => document.documentElement.getAttribute('data-mode') === 'dark';
  const COLORS = ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#ec4899','#0891b2','#84cc16','#f97316','#6366f1','#14b8a6','#e11d48'];
  const plotBg = () => isDark() ? '#1e2235' : '#fff';
  const plotGrid = () => isDark() ? '#333a55' : '#e2e8f0';
  const plotText = () => isDark() ? '#e2e8f0' : '#1e293b';
  function bLayout(extra) {
    return Object.assign({
      paper_bgcolor: plotBg(), plot_bgcolor: plotBg(),
      font: { color: plotText(), size: 11 },
      margin: { l: 50, r: 20, t: 30, b: 40 },
      xaxis: { gridcolor: plotGrid() }, yaxis: { gridcolor: plotGrid() },
    }, extra);
  }
  function fp(v) { return v == null ? 'N/A' : v.toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }
  function fpct(v, sign) {
    if (v == null || isNaN(v)) return 'N/A';
    return (sign && v > 0 ? '+' : '') + v.toFixed(2) + '%';
  }
  function movAvg(arr, w) {
    const r = [];
    for (let i = 0; i < arr.length; i++) {
      const s = arr.slice(Math.max(0, i-w+1), i+1).filter(v => v!=null);
      r.push(s.length ? s.reduce((a,b)=>a+b,0)/s.length : null);
    }
    return r;
  }

  // ====== AGENT REGISTRY ======
  const agents = [
    {
      id: 'house_price_analyzer',
      icon: '🏠',
      name: 'house_price_analyzer',
      desc: 'Analyze city house prices with historical trends, district comparison, buy-timing scoring, community-level drilldown, and AI-powered investment advice.',
      tags: ['real-estate', 'data-analysis', 'deepseek-ai', 'china'],
      status: 'online',
    },
    {
      id: 'ai_tracker',
      icon: '📡',
      name: 'ai_tracker',
      desc: 'Track arXiv papers by keywords and GitHub repo releases. Filter papers by date, refresh repos and papers on demand.',
      tags: ['arxiv', 'github', 'papers', 'releases'],
      status: 'online',
    },
  ];

  // ====== HUB ======
  function renderHub() {
    const grid = $('ag-agent-grid');
    grid.innerHTML = agents.map(a => `
      <div class="ag-agent-card" onclick="AG.openAgent('${a.id}')">
        <div class="ag-agent-icon">${a.icon}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <div class="ag-agent-name">${a.name}</div>
          <span class="ag-agent-status ag-status-${a.status}">● ${a.status}</span>
        </div>
        <div class="ag-agent-desc">${a.desc}</div>
        <div class="ag-agent-tags">${a.tags.map(t => `<span class="ag-agent-tag">${t}</span>`).join('')}</div>
      </div>
    `).join('');
  }

  function openAgent(id) {
    $('ag-hub').style.display = 'none';
    $('ag-hp').style.display = 'none';
    if ($('ag-ai-tracker')) $('ag-ai-tracker').style.display = 'none';
    if (id === 'house_price_analyzer') {
      $('ag-hp').style.display = 'block';
      if (!hp.cityData) hp.loadCity('hz');
    } else if (id === 'ai_tracker' && $('ag-ai-tracker')) {
      $('ag-ai-tracker').style.display = 'block';
    }
  }

  function backToHub() {
    $('ag-hub').style.display = 'block';
    $('ag-hp').style.display = 'none';
    if ($('ag-ai-tracker')) $('ag-ai-tracker').style.display = 'none';
  }

  // ====== SETTINGS ======
  function openSettings() { $('ag-settings-overlay').classList.add('open'); loadSettings(); }
  function closeSettings() { $('ag-settings-overlay').classList.remove('open'); }
  function overlayClick(e) { if (e.target === $('ag-settings-overlay')) closeSettings(); }
  function loadSettings() {
    $('ag-api-key').value = localStorage.getItem('ag_api_key') || '';
    $('ag-api-model').value = localStorage.getItem('ag_api_model') || 'deepseek-chat';
  }
  function saveSettings() {
    localStorage.setItem('ag_api_key', $('ag-api-key').value.trim());
    localStorage.setItem('ag_api_model', $('ag-api-model').value.trim() || 'deepseek-chat');
    closeSettings();
  }

  // ====== HOUSE PRICE ANALYZER ======
  const hp = (() => {
    let cityData = null;
    let selectedDistricts = new Set();
    let selectedSubDistricts = new Set(); // 'dk:sk' e.g. 'xihu:zhijiang'
    let currentSubDistrictParent = null; // dk when viewing 板块 of one district
    let analysisResults = [];

    // Anything below this is not a 元/㎡ price. The new-house series carries
    // values of 0/1/2 -- almost certainly a listing *count* parsed into the
    // price column -- for the whole of 2018 and sporadically after.
    const MIN_PLAUSIBLE_PRICE = 1000;
    // The scraper pages out at this many communities per district, so a
    // district sitting exactly on it has been silently truncated.
    const COMM_CAP = 600;
    // Rows the upstream source mixes into the district list that are actually
    // city-wide aggregates, not districts.
    const AGGREGATE_ROWS = new Set(['市区']);

    function monthDiff(a, b) {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return Math.abs((by - ay) * 12 + (bm - am));
    }

    // Scrubs the payload and precomputes the coverage facts the UI reports.
    // Doing this once, at load, keeps every downstream renderer honest by
    // default rather than each one having to remember the caveats.
    function normalize(data) {
      let droppedPoints = 0;
      const scrub = rows => (rows || []).forEach(r => {
        for (const k of ['second_hand_price', 'new_house_price']) {
          if (r[k] != null && r[k] < MIN_PLAUSIBLE_PRICE) { r[k] = null; droppedPoints++; }
        }
      });
      scrub(data.city_history);
      Object.values(data.districts || {}).forEach(d => scrub(d.history));

      data.district_list = (data.district_list || []).filter(r => !AGGREGATE_ROWS.has(r.district));

      const cityByDate = {};
      for (const col of ['second_hand_price', 'new_house_price']) {
        cityByDate[col] = {};
        (data.city_history || []).forEach(r => {
          if (r[col] != null && r[col] > 0) cityByDate[col][r.date] = r[col];
        });
      }
      const cityDates = Object.keys(cityByDate.second_hand_price).sort();
      const asOf = cityDates[cityDates.length - 1] || data.updated_at;

      const districts = {};
      const cappedDistricts = [], staleDistricts = [], mismatchDistricts = [];
      let commCount = 0, commWithMom = 0, subTotal = 0, subWithData = 0;
      let shortestMonths = Infinity;

      for (const [dk, d] of Object.entries(data.districts || {})) {
        const rows = (d.history || []).filter(r => r.second_hand_price != null);
        const to = rows.length ? rows[rows.length - 1].date : null;
        const comms = d.communities || [];
        const withMom = comms.filter(c => c.mom_pct != null).length;
        const subs = Object.values(d.sub_districts || {});
        const subOk = subs.filter(s => s.price != null || (s.history && s.history.length)).length;

        // Sanity-check the community list against the district average it is
        // supposed to sit under. A median wildly off the district mean means
        // the two came from different places and should not be read together.
        const cp = comms.map(c => c.price).filter(p => p != null && p > 0).sort((a, b) => a - b);
        const commMedian = cp.length ? cp[Math.floor(cp.length / 2)] : null;
        const districtAvg = rows.length ? rows[rows.length - 1].second_hand_price : null;
        const ratio = commMedian && districtAvg ? commMedian / districtAvg : null;

        const cov = {
          months: rows.length,
          from: rows.length ? rows[0].date : null,
          to,
          stale: !!(to && asOf && to !== asOf),
          commCount: comms.length,
          commWithMom: withMom,
          commCapped: comms.length === COMM_CAP,
          commMedian,
          commRatio: ratio,
          commMismatch: ratio != null && (ratio < 0.7 || ratio > 1.4),
        };
        districts[dk] = cov;
        if (cov.commCapped) cappedDistricts.push(d.name);
        if (cov.stale) staleDistricts.push(d.name);
        if (cov.commMismatch) mismatchDistricts.push(`${d.name}(${cov.commRatio.toFixed(2)}×)`);
        if (rows.length) shortestMonths = Math.min(shortestMonths, rows.length);
        commCount += comms.length;
        commWithMom += withMom;
        subTotal += subs.length;
        subWithData += subOk;
      }

      data.coverage = {
        asOf,
        lagMonths: asOf && data.updated_at ? monthDiff(asOf, data.updated_at.slice(0, 7)) : 0,
        cityByDate,
        districts,
        droppedPoints,
        commCap: COMM_CAP,
        cappedDistricts,
        staleDistricts,
        mismatchDistricts,
        shortestMonths: shortestMonths === Infinity ? 0 : shortestMonths,
        commCount,
        commWithMom,
        commMomPct: commCount ? Math.round(commWithMom / commCount * 100) : 0,
        subDistrictTotal: subTotal,
        subDistrictsWithData: subWithData,
        subDistrictsEmpty: subTotal > 0 && subWithData === 0,
      };
      return data;
    }

    async function loadCity(key) {
      $('ag-hp').querySelectorAll('.ag-panel.active').forEach(p => {
        p.innerHTML = '<div class="ag-loading"><div class="ag-spinner"></div><p>Loading…</p></div>';
      });
      try {
        const url = `${DATA_BASE}/${key}.json`;
        // The payload is ~460KB and refreshed at most once a day, so let the
        // HTTP cache do its job -- a revalidation beats a full re-download.
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        cityData = normalize(await resp.json());
      } catch (e) {
        $('ag-hp').querySelector('.ag-panel.active').innerHTML =
          `<div class="ag-empty">Data load failed: ${e.message}</div>`;
        return;
      }
      renderDataStamp();
      renderSourceStatus();
      selectedDistricts.clear();
      selectedSubDistricts.clear();
      currentSubDistrictParent = null;
      Object.keys(cityData.districts).slice(0, 5).forEach(d => selectedDistricts.add(d));
      initChips(); initCommSelect(); initAIScope(); initSubDistrictUI();
      restorePanels();
      renderAll();
    }

    // "Updated: <today>" used to be the only stamp shown, which reads as "these
    // are today's prices". The source runs about two months behind, so both
    // dates are shown and the lag is named.
    function renderDataStamp() {
      const el = $('ag-hp-updated');
      if (!el || !cityData) return;
      const cov = cityData.coverage;
      el.innerHTML = `数据截止 <strong>${cov.asOf}</strong>`
        + `<span class="ag-data-note"> · 抓取于 ${cityData.updated_at}`
        + (cov.lagMonths ? ` · 滞后约 ${cov.lagMonths} 个月` : '') + '</span>';
    }

    function renderSourceStatus() {
      const el = $('ag-source-list');
      if (!el || !cityData) return;
      const sources = cityData.meta?.sources || [
        { name: '聚汇', role: '城市/区域/小区', status: 'active' },
        { name: '小区聚合', role: '板块估算', status: 'active' }
      ];
      el.innerHTML = sources.map(s => `<span class="ag-source-pill"><strong>${s.name}</strong> ${s.role || ''}${s.status === 'active' ? ' · 已接入' : ' · 待配置'}</span>`).join('');
    }

    function restorePanels() {
      ['trend','latest','timing'].forEach(t => {
        const p = $(`ag-panel-${t}`);
        if (!p) return;
        if (t === 'trend') {
          p.innerHTML = `
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:10px" id="ag-trend-title">城市整体走势</div><div class="ag-chart" id="ag-chart-city"></div></div>
            <div style="font-weight:700;font-size:13px;margin-bottom:8px">选择区域对比</div>
            <div class="ag-district-bar" id="ag-district-chips"></div>
            <div class="ag-card"><div class="ag-chart" id="ag-chart-districts"></div></div>`;
          initChips();
        }
        if (t === 'latest') {
          p.innerHTML = `
            <div class="ag-metrics" id="ag-latest-metrics"></div>
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:10px">各区域最新均价</div><div class="ag-chart" id="ag-chart-bar"></div></div>
            <div class="ag-card"><table class="ag-table" id="ag-latest-table"><thead><tr><th>区域</th><th>均价(元/㎡)</th><th>同比</th></tr></thead><tbody></tbody></table></div>
            <div class="ag-card" id="ag-sub-card"><div style="font-weight:700;font-size:14px;margin-bottom:10px">板块最新均价</div><select class="ag-select" id="ag-latest-sub-district-parent" onchange="AG.hp.renderSubDistrictLatest()"></select><table class="ag-table" id="ag-latest-sub-table" style="margin-top:10px"><thead><tr><th>板块</th><th>均价(元/㎡)</th><th>同比</th></tr></thead><tbody></tbody></table></div>
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:10px">小区价格细分</div><div class="ag-toolbar"><select class="ag-select" id="ag-comm-district" onchange="AG.hp.renderCommunities()"></select><input class="ag-search" id="ag-comm-search" type="search" placeholder="搜索小区名称…" oninput="AG.hp.renderCommunities()"><select class="ag-select" id="ag-comm-sort" onchange="AG.hp.renderCommunities()"><option value="desc">价格从高到低</option><option value="asc">价格从低到高</option><option value="mom">环比变化</option></select></div><div class="ag-data-note" id="ag-comm-summary"></div><div style="margin-top:10px"><div class="ag-chart-mini" id="ag-chart-comm"></div><table class="ag-table" id="ag-comm-table" style="margin-top:10px"><thead><tr><th>小区</th><th>均价(元/㎡)</th><th>环比(%)</th></tr></thead><tbody></tbody></table><div id="ag-comm-pager" style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap"></div></div></div>`;
          initCommSelect();
          initSubDistrictUI();
        }
        if (t === 'timing') {
          p.innerHTML = `
            <div class="ag-card" id="ag-verdict"></div>
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:4px">全市概况</div><div style="font-size:11px;color:var(--ag-text3);margin-bottom:12px">先看城市整体处在周期的什么位置，再看区域分化</div><div class="ag-metrics" id="ag-city-health"></div></div>
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:4px">区域定位图</div><div style="font-size:11px;color:var(--ag-text3);margin-bottom:10px">横轴＝相对全市的贵贱（自身历史分位），纵轴＝距自身峰值的回撤。左下＝相对全市便宜且跌得多；右上＝相对全市贵且接近前高。</div><div class="ag-chart" id="ag-chart-position"></div></div>
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:4px">区域体检表</div><div style="font-size:11px;color:var(--ag-text3);margin-bottom:10px">按回撤幅度排序，非推荐排序。每个指标各自独立，不做加权合成。</div><div style="overflow-x:auto"><table class="ag-table" id="ag-health-table"><thead><tr><th>区域</th><th>市场状态</th><th>最新均价</th><th>距峰值</th><th>企稳</th><th>近6月</th><th>同比</th><th>相对全市</th><th>数据可信度</th></tr></thead><tbody></tbody></table></div></div>
            <div class="ag-card" id="ag-limitations"></div>
            <div id="ag-timing-details"></div>
            <div class="ag-card" style="margin-top:14px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">🤖 AI 深度分析</div><div style="font-size:11px;color:var(--ag-text3);margin-bottom:10px">基于量化数据 + 小区价格，调用 DeepSeek 生成分析报告</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><select class="ag-select" id="ag-ai-scope"><option value="all">全局分析</option></select><button class="ag-btn ag-btn-primary" id="ag-ai-btn" onclick="AG.hp.runAI()">生成分析报告</button></div><div class="ag-ai-output" id="ag-ai-output" style="display:none"></div></div>`;
          initAIScope();
        }
      });
    }

    // Refresh
    async function refresh() {
      const btn = $('ag-refresh-btn');
      const icon = $('ag-refresh-icon');
      const ok = $('ag-refresh-ok');
      btn.disabled = true;
      icon.style.display = 'inline-block';
      icon.style.animation = 'ag-spin .7s linear infinite';
      ok.classList.remove('show');

      const cityKey = $('ag-city-select').value || 'hz';
      try {
        await loadCity(cityKey);
        renderDataStamp();
        renderAll();
        ok.classList.add('show');
        setTimeout(() => ok.classList.remove('show'), 2000);
      } catch (e) {
        alert('Refresh failed: ' + e.message);
      }
      btn.disabled = false;
      icon.style.animation = '';
    }

    function switchTab(tab) {
      document.querySelectorAll('#ag-hp .ag-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      document.querySelectorAll('#ag-hp .ag-panel').forEach(p => p.classList.toggle('active', p.id === `ag-panel-${tab}`));
      renderAll();
    }

    function initChips() {
      const bar = $('ag-district-chips');
      if (!bar || !cityData) return;
      bar.innerHTML = '';
      for (const [dk, info] of Object.entries(cityData.districts)) {
        const c = document.createElement('span');
        c.className = 'ag-district-chip' + (selectedDistricts.has(dk) ? ' active' : '');
        c.textContent = info.name;
        c.onclick = () => {
          if (selectedDistricts.has(dk)) selectedDistricts.delete(dk); else selectedDistricts.add(dk);
          c.classList.toggle('active'); renderAll();
        };
        bar.appendChild(c);
      }
    }
    function initCommSelect() {
      const sel = $('ag-comm-district');
      if (!sel || !cityData) return;
      sel.innerHTML = '';
      for (const [dk, info] of Object.entries(cityData.districts)) {
        const o = document.createElement('option'); o.value = dk; o.textContent = info.name;
        sel.appendChild(o);
      }
    }
    function initAIScope() {
      const sel = $('ag-ai-scope');
      if (!sel || !cityData) return;
      sel.innerHTML = '<option value="all">全局分析</option>';
      for (const [dk, info] of Object.entries(cityData.districts)) {
        const o = document.createElement('option'); o.value = dk; o.textContent = info.name + ' 深度分析';
        sel.appendChild(o);
      }
    }

    function initSubDistrictUI() {
      const parentSel = $('ag-sub-district-parent');
      const latestParentSel = $('ag-latest-sub-district-parent');
      if (!cityData) return;

      // Every sub-district currently comes back with price=null and an empty
      // history, so the whole 板块 level would render as a list of blanks.
      // Hide it outright and say so in the limitations panel instead of
      // showing an empty table the reader has to interpret.
      const card = $('ag-sub-card');
      if (card) card.style.display = cityData.coverage.subDistrictsEmpty ? 'none' : '';
      if (cityData.coverage.subDistrictsEmpty) return;

      // A district only earns a slot here if at least one of its sub-districts
      // actually carries data.
      const districtsWithSub = Object.entries(cityData.districts)
        .filter(([, d]) => Object.values(d.sub_districts || {})
          .some(s => s.price != null || (s.history && s.history.length)))
        .map(([dk, d]) => ({ dk, name: d.name }));
      const emptyOpt = (sel, placeholder) => {
        if (!sel) return;
        sel.innerHTML = '';
        const o = document.createElement('option'); o.value = ''; o.textContent = placeholder || '请选择区域';
        sel.appendChild(o);
        districtsWithSub.forEach(({ dk, name }) => {
          const opt = document.createElement('option'); opt.value = dk; opt.textContent = name;
          sel.appendChild(opt);
        });
      };
      emptyOpt(parentSel, '请选择区域');
      emptyOpt(latestParentSel, '请选择区域');
      currentSubDistrictParent = null;
      selectedSubDistricts.clear();
      fillSubDistrictChips();
    }

    function onSubDistrictParentChange() {
      const sel = $('ag-sub-district-parent');
      currentSubDistrictParent = sel?.value || null;
      selectedSubDistricts.forEach(k => {
        if (currentSubDistrictParent && !k.startsWith(currentSubDistrictParent + ':')) return;
        selectedSubDistricts.delete(k);
      });
      fillSubDistrictChips();
      renderAll();
    }

    function fillSubDistrictChips() {
      const bar = $('ag-sub-district-chips');
      if (!bar || !cityData) return;
      bar.innerHTML = '';
      if (!currentSubDistrictParent) return;
      const d = cityData.districts[currentSubDistrictParent];
      if (!d?.sub_districts) return;
      for (const [sk, info] of Object.entries(d.sub_districts)) {
        const key = currentSubDistrictParent + ':' + sk;
        const hasHistory = info.history && info.history.length > 0;
        const hasPrice = info.price != null && info.price > 0;
        const hasData = hasHistory || hasPrice;
        const label = info.name + (hasHistory ? '' : (hasPrice ? ` (${fp(info.price)})` : ' (无数据)'));
        const c = document.createElement('span');
        c.className = 'ag-district-chip' + (selectedSubDistricts.has(key) ? ' active' : '') + (hasData ? '' : ' ag-chip-dim');
        c.textContent = label;
        c.onclick = () => {
          if (!hasData) return;
          if (selectedSubDistricts.has(key)) selectedSubDistricts.delete(key); else selectedSubDistricts.add(key);
          c.classList.toggle('active');
          renderAll();
        };
        bar.appendChild(c);
      }
    }

    function renderAll() {
      if (!cityData) return;
      renderTrend(); renderLatest(); renderTiming();
    }

    // ── Trend ──
    function renderTrend() {
      if (!cityData || !$('ag-chart-city')) return;
      const col = $('ag-price-type').value;
      const label = col === 'second_hand_price' ? '二手房' : '新房';
      const hist = cityData.city_history;
      const dates = hist.map(r => r.date), prices = hist.map(r => r[col]);
      Plotly.react('ag-chart-city', [
        { x: dates, y: prices, mode: 'lines', name: cityData.city + '整体', line: { width: 2.5, color: '#2563eb' } },
        { x: dates, y: movAvg(prices, 6), mode: 'lines', name: 'MA6', line: { width: 1, dash: 'dot', color: '#94a3b8' } },
      ], bLayout({
        title: { text: `${cityData.city}${label}整体走势`, font: { size: 13 } },
        yaxis: { title: '均价(元/㎡)', gridcolor: plotGrid() },
        height: 360, showlegend: true, legend: { orientation: 'h', y: -0.15 },
      }), { responsive: true, displayModeBar: false });

      const dT = []; let ci = 0;
      for (const dk of selectedDistricts) {
        const d = cityData.districts[dk]; if (!d?.history.length) continue;
        dT.push({ x: d.history.map(r=>r.date), y: d.history.map(r=>r[col]),
          mode: 'lines', name: d.name, line: { width: 2, color: COLORS[ci++ % COLORS.length] } });
      }
      Plotly.react('ag-chart-districts', dT.length ? dT : [{x:[],y:[]}], bLayout({
        title: { text: `区域${label}走势对比`, font: { size: 13 } },
        yaxis: { title: '均价(元/㎡)', gridcolor: plotGrid() },
        height: 380, showlegend: true, legend: { orientation: 'h', y: -0.15 },
      }), { responsive: true, displayModeBar: false });
    }

    // ── Latest ──
    function renderLatest() {
      if (!cityData || !$('ag-latest-metrics')) return;
      const list = cityData.district_list || [];
      const allP = list.map(r=>r.price).filter(p=>p!=null);
      const avg = allP.length ? allP.reduce((a,b)=>a+b,0)/allP.length : 0;
      const maxD = list.reduce((a,b)=>((a.price||0)>(b.price||0)?a:b),{});
      const minD = list.reduce((a,b)=>((a.price||0)<(b.price||0)?a:b),{});
      $('ag-latest-metrics').innerHTML = `
        <div class="ag-metric"><div class="ag-metric-label">全市均价</div><div class="ag-metric-value">${fp(avg)}</div><div class="ag-metric-sub">元/㎡</div></div>
        <div class="ag-metric"><div class="ag-metric-label">最高区域</div><div class="ag-metric-value">${maxD.district||'-'}</div><div class="ag-metric-sub">${fp(maxD.price)} 元/㎡</div></div>
        <div class="ag-metric"><div class="ag-metric-label">最低区域</div><div class="ag-metric-value">${minD.district||'-'}</div><div class="ag-metric-sub">${fp(minD.price)} 元/㎡</div></div>
        <div class="ag-metric"><div class="ag-metric-label">区域数</div><div class="ag-metric-value">${list.length}</div><div class="ag-metric-sub">个区域</div></div>`;
      const sorted = [...list].filter(r=>r.price).sort((a,b)=>b.price-a.price);
      Plotly.react('ag-chart-bar', [{
        x: sorted.map(r=>r.district), y: sorted.map(r=>r.price), type: 'bar',
        text: sorted.map(r=>fp(r.price)), textposition: 'outside',
        marker: { color: sorted.map(r=>(r.yoy||0)>=0?'#16a34a':'#dc2626') },
      }], bLayout({ height: 380, yaxis: { title: '均价(元/㎡)', gridcolor: plotGrid() }, xaxis: { tickangle: -30, gridcolor: plotGrid() } }),
        { responsive: true, displayModeBar: false });
      const tbody = $('ag-latest-table')?.querySelector('tbody');
      if (tbody) tbody.innerHTML = sorted.map(r => `<tr><td>${r.district}</td><td>${fp(r.price)}</td><td class="${(r.yoy||0)>=0?'ag-up':'ag-down'}">${r.yoy!=null?fpct(r.yoy,true):'N/A'}</td></tr>`).join('');
      renderSubDistrictLatest();
      renderCommunities();
    }

    function renderSubDistrictLatest() {
      const dk = $('ag-latest-sub-district-parent')?.value;
      const tbody = $('ag-latest-sub-table')?.querySelector('tbody');
      if (!tbody || !cityData) return;
      if (!dk) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--ag-text3)">请先选择区域</td></tr>';
        return;
      }
      const d = cityData.districts[dk];
      const subs = d?.sub_districts ? Object.entries(d.sub_districts) : [];
      if (!subs.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--ag-text3)">该区暂无板块数据</td></tr>';
        return;
      }
      const rows = subs.map(([, info]) => ({ name: info.name, price: info.price, yoy: info.yoy })).filter(r => r.name);
      rows.sort((a, b) => (b.price || 0) - (a.price || 0));
      tbody.innerHTML = rows.map(r => `<tr><td>${r.name}</td><td>${fp(r.price)}</td><td class="${(r.yoy||0)>=0?'ag-up':'ag-down'}">${r.yoy!=null?fpct(r.yoy,true):'N/A'}</td></tr>`).join('');
    }

    // 价格区间（元/㎡）：[ 标签, 下限, 上限 ]
    const PRICE_BUCKETS = [
      ['<2万', 0, 20000], ['2-3万', 20000, 30000], ['3-4万', 30000, 40000], ['4-5万', 40000, 50000],
      ['5-6万', 50000, 60000], ['6-8万', 60000, 80000], ['8万+', 80000, Infinity]
    ];
    function getPriceBucket(price) {
      if (price == null || price <= 0) return null;
      const b = PRICE_BUCKETS.find(([, lo, hi]) => price >= lo && price < hi);
      return b ? b[0] : PRICE_BUCKETS[PRICE_BUCKETS.length - 1][0];
    }

    const COMM_PAGE_SIZE = 20;
    let commPageState = {}; // dk -> currentPage
    let commDisplayList = [];

    function makePager(onPage, pagerEl, page, totalPages, total, label) {
      if (!pagerEl) return;
      const prev = page > 0 ? `<button class="ag-btn ag-btn-ghost ag-btn-sm" onclick="(${onPage})(${page-1})">‹</button>` : '<button class="ag-btn ag-btn-ghost ag-btn-sm" disabled>‹</button>';
      const next = page < totalPages-1 ? `<button class="ag-btn ag-btn-ghost ag-btn-sm" onclick="(${onPage})(${page+1})">›</button>` : '<button class="ag-btn ag-btn-ghost ag-btn-sm" disabled>›</button>';
      const jumpId = pagerEl.id + '-jump';
      pagerEl.innerHTML = `${prev}<span style="font-size:11px;color:var(--ag-text3);padding:0 4px">${page+1}/${totalPages} 页·共${total}${label}</span>${next}<input id="${jumpId}" type="number" min="1" max="${totalPages}" placeholder="页" style="width:44px;font-size:11px;padding:2px 4px;border:1px solid var(--ag-border);border-radius:4px;background:var(--ag-bg2);color:var(--ag-text1)" onkeydown="if(event.key==='Enter'){const v=parseInt(this.value);if(v>=1&&v<=${totalPages})(${onPage})(v-1);}"><button class="ag-btn ag-btn-ghost ag-btn-sm" onclick="const v=parseInt(document.getElementById('${jumpId}').value);if(v>=1&&v<=${totalPages})(${onPage})(v-1);">跳转</button>`;
    }

    function renderCommPage(dk, page) {
      const d = cityData?.districts[dk];
      if (!d) return;
      const sorted = commDisplayList;
      const total = sorted.length;
      if (!total) return;
      commPageState[dk] = page;
      const totalPages = Math.ceil(total / COMM_PAGE_SIZE);
      const slice = sorted.slice(page * COMM_PAGE_SIZE, (page + 1) * COMM_PAGE_SIZE);
      const tbody = $('ag-comm-table')?.querySelector('tbody');
      if (tbody) tbody.innerHTML = slice.map(r => `<tr><td>${r.community}</td><td>${fp(r.price)}</td><td class="${(r.mom_pct||0)>=0?'ag-up':'ag-down'}">${r.mom_pct!=null?fpct(r.mom_pct,true):'N/A'}</td></tr>`).join('');
      makePager(`p=>AG.hp.commPage('${dk}',p)`, $('ag-comm-pager'), page, totalPages, total, '个');
    }

    function commPage(dk, page) { renderCommPage(dk, page); }

    // ── timing comm pagination ──
    let timingCommState = {}; // dk -> { sorted, page }

    function renderTimingCommPage(dk, page) {
      const d = cityData?.districts[dk];
      if (!d) return;
      if (!timingCommState[dk]) {
        timingCommState[dk] = { sorted: [...(d.communities||[])].filter(c=>c.price!=null&&c.price>0).sort((a,b)=>(b.price||0)-(a.price||0)) };
      }
      const sorted = timingCommState[dk].sorted;
      const total = sorted.length;
      if (!total) return;
      timingCommState[dk].page = page;
      const totalPages = Math.ceil(total / COMM_PAGE_SIZE);
      const slice = sorted.slice(page * COMM_PAGE_SIZE, (page + 1) * COMM_PAGE_SIZE);
      const tbody = document.querySelector(`#ag-timing-comm-${dk} tbody`);
      if (tbody) tbody.innerHTML = slice.map(r => `<tr><td>${r.community}</td><td>${fp(r.price)}</td><td class="${(r.mom_pct||0)>=0?'ag-up':'ag-down'}">${r.mom_pct!=null?fpct(r.mom_pct,true):'N/A'}</td></tr>`).join('');
      const hdr = document.getElementById(`ag-timing-comm-hdr-${dk}`);
      if (hdr) hdr.textContent = `小区（共 ${total} 个）`;
      makePager(`p=>AG.hp.timingCommPage('${dk}',p)`, document.getElementById(`ag-timing-comm-pager-${dk}`), page, totalPages, total, '个');
    }

    function timingCommPage(dk, page) { renderTimingCommPage(dk, page); }

    function renderCommunities() {
      const dk = $('ag-comm-district')?.value;
      if (!dk || !cityData) return;
      const d = cityData.districts[dk];
      const query = ($('ag-comm-search')?.value || '').trim().toLowerCase();
      const sort = $('ag-comm-sort')?.value || 'desc';
      const all = (d?.communities || []).filter(c => c.price != null && c.price > 0);
      const comms = all.filter(c => !query || (c.community || '').toLowerCase().includes(query));
      const compare = sort === 'asc'
        ? (a,b)=>(a.price||0)-(b.price||0)
        : sort === 'mom' ? (a,b)=>Math.abs(b.mom_pct||0)-Math.abs(a.mom_pct||0)
          : (a,b)=>(b.price||0)-(a.price||0);
      commDisplayList = [...comms].sort(compare);
      const summary = $('ag-comm-summary');
      if (summary) {
        const cov = cityData.coverage.districts[dk];
        const raw = (d?.communities || []).length;
        const base = query ? `找到 ${comms.length} / ${all.length} 个小区` : `共收录 ${all.length} 个小区`;
        // Every count below is derived from the same filtered set that is
        // actually on screen, so the numbers in this line always reconcile.
        const notes = [];
        // A district sitting exactly on the scraper's page cap has been
        // truncated, so "共收录 600 个" would read as a complete census when it
        // is not. Say so where the number is shown, not only in the caveats.
        if (cov?.commCapped) notes.push(`⚠️ 恰好 ${cityData.coverage.commCap} 个＝抓取上限，非全部小区`);
        if (raw > all.length) notes.push(`另有 ${raw - all.length} 个无价格已略去`);
        const noMom = all.filter(c => c.mom_pct == null).length;
        if (noMom) notes.push(`${noMom} 个无环比`);
        notes.push('当期快照，无历史序列');
        summary.textContent = `${base}（${notes.join(' · ')}）`;
      }
      const tbody = $('ag-comm-table')?.querySelector('tbody');
      const thead = $('ag-comm-table')?.querySelector('thead tr');
      if (thead) thead.innerHTML = '<th>小区</th><th>均价(元/㎡)</th><th>环比</th>';
      if (!comms.length) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--ag-text3)">暂无数据</td></tr>';
        if ($('ag-chart-comm')) Plotly.react('ag-chart-comm', [{x:[],y:[]}], bLayout({height:220}), {responsive:true,displayModeBar:false});
        const pager = $('ag-comm-pager'); if (pager) pager.innerHTML = '';
        return;
      }
      // 价格区间分布图
      const byBucket = {};
      PRICE_BUCKETS.forEach(([label]) => { byBucket[label] = []; });
      comms.forEach(c => { const label = getPriceBucket(c.price); if (label) byBucket[label].push(c); });
      const labels = PRICE_BUCKETS.map(([l]) => l).filter(l => byBucket[l].length > 0);
      const counts = labels.map(l => byBucket[l].length);
      const avgPrices = labels.map(l => { const arr = byBucket[l]; return arr.length ? Math.round(arr.reduce((a,c)=>a+(c.price||0),0)/arr.length) : 0; });
      if ($('ag-chart-comm')) Plotly.react('ag-chart-comm', [{
        x: labels, y: counts, type: 'bar',
        text: counts.map((n, i) => `${n} 个 · 均 ${fp(avgPrices[i])}`), textposition: 'outside',
        marker: { color: '#2563eb' },
      }], bLayout({ height: 260, yaxis: { title: '小区数', gridcolor: plotGrid() }, xaxis: { title: '均价区间', gridcolor: plotGrid() },
        title: { text: `${d.name} 小区价格区间分布`, font: { size: 13 } } }), { responsive: true, displayModeBar: false });
      // 分页表格（所有小区，价格降序）
      renderCommPage(dk, 0);
    }

    // ── 区域体检 ──
    //
    // This replaced a 0-100 "buy score". That score combined five dimensions
    // (price percentile, trend, momentum, YoY, volatility) which were all
    // transforms of the *same* price series, so it presented one signal as five
    // and manufactured false confidence. Worse, two of its terms were inverted
    // by construction -- `100 - percentile` and `50 - yoy*2` -- so the further a
    // district had fallen, the stronger the "buy" it emitted. Run on this data
    // it ranked 桐庐县 (-34% YoY, still setting new lows) as 建议买入 and the
    // only recovering district, 建德市 (+4.6% YoY), as 建议观望.
    //
    // What follows deliberately does not rank or recommend. It reports a small
    // set of independently meaningful, individually explainable facts, and
    // states how much data each one rests on.

    // A window of 12 months: "has this district set a new 1-year low recently?"
    const LOW_WINDOW = 12;

    // Descriptive market states. None of these is an instruction to buy.
    function marketState(a) {
      let base;
      if (a.stabMonths === 0) base = { label: '仍在创新低', tone: 'red' };
      else if (a.stabMonths < 6) base = { label: '刚止跌·未确认', tone: 'orange' };
      else if (a.slope6 > 1) base = { label: '回升中', tone: 'green' };
      else if (Math.abs(a.slope6) <= 1) base = { label: '低位盘整', tone: 'orange' };
      else base = { label: '缓慢下行', tone: 'red' };
      // A shallow drawdown means "near its own high", which changes the reading
      // of every other signal, so it is stated up front rather than buried.
      if (a.drawdown > -10) return { label: '接近前高·' + base.label, tone: base.tone };
      return base;
    }

    function monthsWithoutNewLow(px, window) {
      let n = 0;
      for (let i = px.length - 1; i > 0; i--) {
        const prior = px.slice(Math.max(0, i - window), i);
        if (!prior.length) break;
        if (px[i] < Math.min(...prior)) break;
        n++;
      }
      return n;
    }

    // Price relative to the city average, which strips out the city-wide cycle.
    // A district can be down 30% and still be historically expensive *relative
    // to the city* -- that is a different decision than being down 30% and
    // historically cheap relative to the city.
    function premiumSeries(dates, px, cityByDate) {
      const out = [];
      for (let i = 0; i < dates.length; i++) {
        const c = cityByDate[dates[i]];
        if (c) out.push(px[i] / c);
      }
      return out;
    }

    function analyzeDistrict(dk, col) {
      const d = cityData.districts[dk];
      const cov = cityData.coverage.districts[dk];
      const rows = (d.history || []).filter(r => r[col] != null && r[col] > 0);
      const name = d.name;

      if (rows.length < 6) {
        return { key: dk, name, ok: false, reason: `仅 ${rows.length} 个月有效数据，不足以计算`, cov };
      }

      const dates = rows.map(r => r.date);
      const px = rows.map(r => r[col]);
      const n = px.length;
      const latest = px[n - 1];
      const peak = Math.max(...px);
      const peakDate = dates[px.indexOf(peak)];
      const drawdown = (latest - peak) / peak * 100;
      const stabMonths = monthsWithoutNewLow(px, LOW_WINDOW);
      const r6 = px.slice(-6);
      const slope6 = (r6[r6.length - 1] - r6[0]) / r6[0] * 100;
      const mom = n >= 2 ? (px[n - 1] - px[n - 2]) / px[n - 2] * 100 : null;
      const yoy = n >= 13 ? (px[n - 1] - px[n - 13]) / px[n - 13] * 100 : null;

      const prem = premiumSeries(dates, px, cityData.coverage.cityByDate[col] || {});
      const premium = prem.length ? prem[prem.length - 1] : null;
      const premiumPct = prem.length > 12
        ? prem.filter(x => x < premium).length / prem.length * 100
        : null;

      const a = {
        key: dk, name, ok: true, cov,
        latest, latestDate: dates[n - 1], months: n,
        peak, peakDate, drawdown, stabMonths, slope6, mom, yoy,
        premium, premiumPct,
        stale: cov.stale,
      };
      const st = marketState(a);
      a.state = st.label;
      a.tone = st.tone;
      return a;
    }

    // How much weight the numbers above can carry, stated explicitly.
    function confidenceOf(a) {
      const issues = [];
      if (a.months < 36) issues.push(`历史仅 ${a.months} 个月`);
      if (a.stale) issues.push(`数据截止 ${a.latestDate}，落后全市`);
      if (a.premiumPct == null) issues.push('相对城市分位样本不足');
      if (a.cov.commCapped) issues.push(`小区样本被上限截断(${a.cov.commCount})`);
      const level = issues.length === 0 ? '高' : issues.length === 1 ? '中' : '低';
      return { level, issues };
    }

    function renderTiming() {
      if (!cityData || !$('ag-health-table')) return;
      const col = $('ag-price-type').value;
      analysisResults = Object.keys(cityData.districts)
        .map(dk => analyzeDistrict(dk, col))
        .filter(a => a.ok);
      // Sorted by drawdown, i.e. by fact, not by a manufactured ranking.
      analysisResults.sort((a, b) => a.drawdown - b.drawdown);

      renderVerdict(col);
      renderCityHealth(col);
      renderPositionMap();
      renderHealthTable();
      renderLimitations();
      renderTimingDetails();
    }

    // The one thing a reader wants and the old score pretended to give: a
    // bottom line. This one is assembled from the numbers actually on the page
    // and paired with how far those numbers can be trusted, so the conclusion
    // and its own reliability arrive together instead of the conclusion alone.
    function renderVerdict(col) {
      const el = $('ag-verdict');
      if (!el || !analysisResults.length) return;
      const cov = cityData.coverage;
      const rows = (cityData.city_history || []).filter(r => r[col] != null && r[col] > 0);
      const px = rows.map(r => r[col]);
      const cityPeak = Math.max(...px);
      const cityDd = (px[px.length - 1] - cityPeak) / cityPeak * 100;
      const cityStab = monthsWithoutNewLow(px, LOW_WINDOW);

      const falling = analysisResults.filter(a => a.stabMonths === 0);
      const rising = analysisResults.filter(a => a.tone === 'green');
      const n = analysisResults.length;
      const medDd = analysisResults.map(a => a.drawdown).sort((x, y) => x - y)[Math.floor(n / 2)];

      // Market read.
      let phase, phaseTone;
      if (falling.length > n / 2) { phase = '下行未止'; phaseTone = 'ag-score-red'; }
      else if (rising.length > n / 2) { phase = '普遍回升'; phaseTone = 'ag-score-green'; }
      else if (cityStab >= 12) { phase = '底部区域盘整'; phaseTone = 'ag-score-orange'; }
      else { phase = '筑底中·分化'; phaseTone = 'ag-score-orange'; }

      // Data grade, from coverage rather than opinion.
      const demerits =
        (cov.lagMonths >= 2 ? 1 : 0) +
        (cov.subDistrictsEmpty ? 1 : 0) +
        (cov.cappedDistricts.length ? 1 : 0) +
        (cov.staleDistricts.length ? 1 : 0) +
        (cov.mismatchDistricts.length ? 1 : 0) +
        (cov.commMomPct < 80 ? 1 : 0);
      const grade = demerits <= 1 ? 'B' : demerits <= 3 ? 'C' : 'D';
      const gradeTone = grade === 'B' ? 'ag-score-green' : grade === 'C' ? 'ag-score-orange' : 'ag-score-red';
      const gradeText = {
        B: '可支撑区域级判断',
        C: '仅可支撑区域级方向性判断，不支撑小区级结论',
        D: '仅可作趋势参考，不足以支撑任何购买决策',
      }[grade];

      const answerable = ['城市与区域的价格走势与回撤', '区域之间的相对贵贱变化', '各区是否仍在创新低'];
      const unanswerable = ['成交量与去化（无数据）', '租金回报率（无数据）', '小区级趋势（仅当期快照）'];
      if (cov.subDistrictsEmpty) unanswerable.push('板块级分化（89 个板块全空）');

      el.innerHTML = `
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">📋 数据评估结论</div>
        <div class="ag-metrics" style="margin-bottom:12px">
          <div class="ag-metric"><div class="ag-metric-label">市场阶段</div><div class="ag-metric-value ${phaseTone}">${phase}</div><div class="ag-metric-sub">${n} 区中 ${falling.length} 个仍在创新低、${rising.length} 个回升</div></div>
          <div class="ag-metric"><div class="ag-metric-label">全市距峰值</div><div class="ag-metric-value ag-down">${fpct(cityDd, true)}</div><div class="ag-metric-sub">区域中位 ${fpct(medDd, true)}</div></div>
          <div class="ag-metric"><div class="ag-metric-label">数据等级</div><div class="ag-metric-value ${gradeTone}">${grade}</div><div class="ag-metric-sub">${demerits} 项缺陷</div></div>
        </div>
        <div style="font-size:12px;line-height:1.9;color:var(--ag-text2)">
          <div><strong>这份数据能回答：</strong>${answerable.join('、')}。</div>
          <div><strong>不能回答：</strong>${unanswerable.join('、')}。</div>
          <div style="margin-top:6px"><strong>结论可信度：</strong><span class="${gradeTone}" style="font-weight:600">${grade} 级 — ${gradeText}</span>。
          下方所有指标均由单一价格序列派生，数据截止 ${cov.asOf}，滞后约 ${cov.lagMonths} 个月。</div>
        </div>`;
    }

    function renderCityHealth(col) {
      const el = $('ag-city-health');
      if (!el) return;
      const rows = (cityData.city_history || []).filter(r => r[col] != null && r[col] > 0);
      if (!rows.length) { el.innerHTML = '<div class="ag-empty">该口径暂无城市级数据</div>'; return; }
      const px = rows.map(r => r[col]);
      const peak = Math.max(...px);
      const peakDate = rows[px.indexOf(peak)].date;
      const dd = (px[px.length - 1] - peak) / peak * 100;
      const stab = monthsWithoutNewLow(px, LOW_WINDOW);
      const falling = analysisResults.filter(a => a.stabMonths === 0).length;
      el.innerHTML = `
        <div class="ag-metric"><div class="ag-metric-label">全市均价</div><div class="ag-metric-value">${fp(px[px.length-1])}</div><div class="ag-metric-sub">元/㎡ · ${rows[rows.length-1].date}</div></div>
        <div class="ag-metric"><div class="ag-metric-label">距峰值回撤</div><div class="ag-metric-value ${dd<0?'ag-down':'ag-up'}">${fpct(dd,true)}</div><div class="ag-metric-sub">峰值 ${fp(peak)} @ ${peakDate}</div></div>
        <div class="ag-metric"><div class="ag-metric-label">未创 12 月新低</div><div class="ag-metric-value">${stab}</div><div class="ag-metric-sub">个月${stab===0?' · 本月仍在创新低':''}</div></div>
        <div class="ag-metric"><div class="ag-metric-label">仍在创新低的区</div><div class="ag-metric-value ${falling?'ag-down':'ag-up'}">${falling}/${analysisResults.length}</div><div class="ag-metric-sub">个区域</div></div>`;
    }

    // Two independent axes: how far a district has fallen from its own peak,
    // and how it is priced relative to the city versus its own history. A
    // district can be cheap on one and expensive on the other; that tension is
    // the actual decision, and a single score destroys it.
    // Status trio. Red/green is indistinguishable under deuteranopia -- the
    // colour-blindness validator scores this pair at ΔE 4.1, far under the 8
    // gate, and no red/green pair can pass. So shape carries the meaning and
    // colour only reinforces it: ▼ falling, ● flat, ▲ rising. A hollow marker
    // means the district's data stops earlier than the city's.
    const STATE_STYLE = {
      // Labels state exactly what the tone covers: the red group is not only
      // districts setting new lows, it also holds ones still drifting down.
      red:    { symbol: 'triangle-down', color: '#d03b3b', label: '▼ 下行中（创新低或持续走弱）' },
      orange: { symbol: 'circle',        color: '#fab219', label: '● 止跌/盘整（未创新低，也未回升）' },
      green:  { symbol: 'triangle-up',   color: '#0ca30c', label: '▲ 回升中（近6个月上行）' },
    };

    function renderPositionMap() {
      const el = $('ag-chart-position');
      if (!el) return;
      const pts = analysisResults.filter(a => a.premiumPct != null);
      if (!pts.length) { el.innerHTML = ''; return; }

      const ink = plotText();
      const midY = pts.map(a => a.drawdown).sort((x, y) => x - y)[Math.floor(pts.length / 2)];
      const yMin = Math.min(...pts.map(a => a.drawdown));
      const yMax = Math.max(...pts.map(a => a.drawdown));
      const pad = Math.max(6, (yMax - yMin) * 0.18);

      // One trace per state so Plotly draws a real legend; identity is then
      // shape + colour + text, never colour alone.
      const traces = ['red', 'orange', 'green'].map(tone => {
        const g = pts.filter(a => a.tone === tone);
        const s = STATE_STYLE[tone];
        return {
          x: g.map(a => a.premiumPct),
          y: g.map(a => a.drawdown),
          text: g.map(a => a.name + (a.stale ? '*' : '')),
          customdata: g.map(a => [a.state, a.stabMonths, fp(a.latest), a.stale ? '（数据滞后）' : '']),
          name: s.label,
          textposition: 'top center',
          textfont: { size: 10, color: ink },
          mode: 'markers+text',
          type: 'scatter',
          marker: {
            size: 13,
            // Hollow = this district's series ends before the city's.
            symbol: g.map(a => s.symbol + (a.stale ? '-open' : '')),
            color: s.color,
            line: { width: 1.5, color: ink },
          },
          hovertemplate:
            '<b>%{text}</b> %{customdata[3]}<br>' +
            '状态：%{customdata[0]}（%{customdata[1]} 个月未创新低）<br>' +
            '均价：%{customdata[2]} 元/㎡<br>' +
            '相对全市分位：%{x:.0f}%（越右＝相对全市越贵）<br>' +
            '距自身峰值：%{y:.1f}%<extra></extra>',
        };
      }).filter(t => t.x.length);

      const guide = { type: 'line', line: { color: ink, width: 1, dash: 'dot' }, opacity: 0.35, layer: 'below' };
      const corner = (x, y, t, ax, ay) => ({
        x, y, text: t, showarrow: false, xref: 'x', yref: 'y',
        xanchor: ax, yanchor: ay, font: { size: 10, color: ink }, opacity: 0.75,
      });

      Plotly.react(el, traces, bLayout({
        height: 460,
        margin: { l: 62, r: 24, t: 34, b: 92 },
        // Quadrant guides at the medians, so "left/bottom" in the caption is
        // actually drawn instead of left to the reader to imagine.
        shapes: [
          { ...guide, x0: 50, x1: 50, y0: yMin - pad, y1: yMax + pad },
          { ...guide, x0: -5, x1: 105, y0: midY, y1: midY },
        ],
        annotations: [
          corner(2, yMax + pad * 0.9, '相对全市便宜 · 跌得少', 'left', 'top'),
          corner(98, yMax + pad * 0.9, '相对全市贵 · 跌得少', 'right', 'top'),
          corner(2, yMin - pad * 0.9, '相对全市便宜 · 跌得多', 'left', 'bottom'),
          corner(98, yMin - pad * 0.9, '相对全市贵 · 跌得多', 'right', 'bottom'),
        ],
        xaxis: {
          title: { text: '← 相对全市便宜      相对全市贵 →   （该区/全市 比值的历史分位）', font: { size: 11 } },
          gridcolor: plotGrid(), range: [-5, 105], zeroline: false,
          tickvals: [0, 25, 50, 75, 100], ticksuffix: '%',
        },
        yaxis: {
          title: { text: '距自身峰值 ↑ 接近前高', font: { size: 11 } },
          gridcolor: plotGrid(), range: [yMin - pad, yMax + pad], ticksuffix: '%', zeroline: false,
        },
        showlegend: true,
        legend: { orientation: 'h', y: -0.26, x: 0, font: { size: 10 } },
      }), { responsive: true, displayModeBar: false });
    }

    function renderHealthTable() {
      const tb = $('ag-health-table')?.querySelector('tbody');
      if (!tb) return;
      tb.innerHTML = analysisResults.map(a => {
        const conf = confidenceOf(a);
        const cls = a.tone === 'green' ? 'ag-score-green' : a.tone === 'orange' ? 'ag-score-orange' : 'ag-score-red';
        const confCls = conf.level === '高' ? 'ag-score-green' : conf.level === '中' ? 'ag-score-orange' : 'ag-score-red';
        return `<tr>
          <td>${a.name}${a.stale ? ' <span title="数据截止早于全市" style="color:var(--ag-orange)">◇</span>' : ''}</td>
          <td><span class="${cls}" style="font-weight:600">${a.state}</span></td>
          <td>${fp(a.latest)}</td>
          <td class="ag-down">${fpct(a.drawdown, true)}<div class="ag-data-note">峰值 ${a.peakDate}</div></td>
          <td>${a.stabMonths}<div class="ag-data-note">个月未创新低</div></td>
          <td class="${a.slope6>=0?'ag-up':'ag-down'}">${fpct(a.slope6, true)}</td>
          <td class="${(a.yoy||0)>=0?'ag-up':'ag-down'}">${fpct(a.yoy, true)}</td>
          <td>${a.premiumPct!=null?a.premiumPct.toFixed(0)+'%':'N/A'}<div class="ag-data-note">${a.premium!=null?a.premium.toFixed(2)+'× 全市':''}</div></td>
          <td><span class="${confCls}" style="font-weight:600">${conf.level}</span>${conf.issues.length?`<div class="ag-data-note">${conf.issues.join('；')}</div>`:''}</td>
        </tr>`;
      }).join('');
    }

    // Generated from the data actually loaded, so it cannot drift out of date
    // the way a hand-written disclaimer would.
    function renderLimitations() {
      const el = $('ag-limitations');
      if (!el) return;
      const cov = cityData.coverage;
      const items = [];
      items.push(`数据截止 <strong>${cov.asOf}</strong>，抓取于 ${cityData.updated_at}，两者相差约 ${cov.lagMonths} 个月。图表反映的不是当月市场。`);
      if (cov.subDistrictsEmpty) {
        items.push(`板块（sub-district）层<strong>暂无数据</strong>：${cov.subDistrictTotal} 个板块全部为空，相关视图已隐藏。`);
      }
      if (cov.cappedDistricts.length) {
        items.push(`${cov.cappedDistricts.join('、')} 的小区数恰好为 ${cov.commCap}，是抓取分页上限而非真实小区数，基于小区的聚合结论有偏。`);
      }
      items.push(`小区数据<strong>没有历史序列</strong>，仅有当期均价与环比；其中环比缺失 ${100 - cov.commMomPct}%（${cov.commCount - cov.commWithMom}/${cov.commCount}）。小区层无法做趋势判断。`);
      if (cov.staleDistricts.length) {
        items.push(`${cov.staleDistricts.join('、')} 的数据截止早于全市，且历史仅 ${cov.shortestMonths} 个月，与其他区不可直接横向比较。`);
      }
      if (cov.mismatchDistricts.length) {
        items.push(`${cov.mismatchDistricts.join('、')} 的小区价格中位数与该区均价明显对不上（括号为倍数），两者可能来自不同口径，<strong>不应放在一起解读</strong>。`);
      }
      if (cov.droppedPoints) {
        items.push(`已剔除 ${cov.droppedPoints} 个低于 ${MIN_PLAUSIBLE_PRICE} 元/㎡ 的异常点（新房口径在 2018 年整年为此类值，疑似把挂牌套数当成了价格）。`);
      }
      items.push(`本页所有指标均由<strong>单一价格序列</strong>派生，不含挂牌量、成交量、租金、房龄、学区等信息，无法回答"值不值得买"。`);
      el.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:8px">⚠️ 数据局限（自动生成）</div>
        <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.85;color:var(--ag-text2)">
        ${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }

    function renderTimingDetails() {
      const container = $('ag-timing-details');
      if (!container) return;
      container.innerHTML = '';
      for (const a of analysisResults) {
        const conf = confidenceOf(a);
        const cls = a.tone === 'green' ? 'ag-level-green' : a.tone === 'orange' ? 'ag-level-orange' : 'ag-level-red';
        const d = cityData.districts[a.key];
        const comms = d?.communities || [];
        const exp = document.createElement('div');
        exp.className = 'ag-expander';
        exp.innerHTML = `
          <div class="ag-expander-header" onclick="this.parentElement.classList.toggle('open');AG.hp.renderMini('${a.key}');AG.hp.renderTimingCommPage('${a.key}',0)">
            <span><strong>${a.name}</strong> — <span class="ag-score-level ${cls}" style="font-size:10px;padding:1px 6px">${a.state}</span>
              <span class="ag-data-note">数据可信度 ${conf.level}</span></span>
            <span class="ag-expander-arrow">▼</span>
          </div>
          <div class="ag-expander-body">
            <div class="ag-metrics">
              <div class="ag-metric"><div class="ag-metric-label">最新均价</div><div class="ag-metric-value">${fp(a.latest)}</div><div class="ag-metric-sub">${a.latestDate}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">距峰值</div><div class="ag-metric-value ag-down">${fpct(a.drawdown,true)}</div><div class="ag-metric-sub">${fp(a.peak)} @ ${a.peakDate}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">未创 12 月新低</div><div class="ag-metric-value">${a.stabMonths}</div><div class="ag-metric-sub">个月</div></div>
              <div class="ag-metric"><div class="ag-metric-label">近 6 个月</div><div class="ag-metric-value ${a.slope6>=0?'ag-up':'ag-down'}">${fpct(a.slope6,true)}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">年同比</div><div class="ag-metric-value ${(a.yoy||0)>=0?'ag-up':'ag-down'}">${fpct(a.yoy,true)}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">相对全市</div><div class="ag-metric-value">${a.premium!=null?a.premium.toFixed(2)+'×':'N/A'}</div><div class="ag-metric-sub">${a.premiumPct!=null?'历史分位 '+a.premiumPct.toFixed(0)+'%':'样本不足'}</div></div>
            </div>
            ${conf.issues.length ? `<div class="ag-data-note" style="margin-bottom:10px">⚠️ ${conf.issues.join('；')}</div>` : ''}
            <div class="ag-chart-mini" id="ag-mini-${a.key}"></div>
            ${comms.length ? `
              <div id="ag-timing-comm-hdr-${a.key}" style="font-weight:700;font-size:12px;margin:10px 0 6px">小区（当期快照，无历史）</div>
              <table class="ag-table" id="ag-timing-comm-${a.key}"><thead><tr><th>小区</th><th>均价</th><th>环比</th></tr></thead><tbody></tbody></table>
              <div id="ag-timing-comm-pager-${a.key}" style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap"></div>` : ''}
          </div>`;
        container.appendChild(exp);
      }
    }

    function renderMini(dk) {
      const el = $(`ag-mini-${dk}`);
      if (!el||el.dataset.rendered) return;
      el.dataset.rendered='1';
      const d = cityData.districts[dk]; if (!d?.history.length) return;
      const col = $('ag-price-type').value;
      const rec = d.history.slice(-12);
      const allP = d.history.map(r=>r[col]).filter(v=>v!=null);
      Plotly.react(el, [
        { x:rec.map(r=>r.date), y:rec.map(r=>r[col]), mode:'lines+markers', name:'均价', line:{width:2,color:'#2563eb'}, marker:{size:4} },
        { x:rec.map(r=>r.date), y:movAvg(allP,6).slice(-12), mode:'lines', name:'MA6', line:{width:1,dash:'dot',color:'#94a3b8'} },
      ], bLayout({ height:220, showlegend:false, title:{text:'近12个月走势',font:{size:12}}, margin:{l:45,r:15,t:30,b:30} }),
        { responsive:true, displayModeBar:false });
    }

    // ── AI ──
    async function runAI() {
      const apiKey = localStorage.getItem('ag_api_key');
      if (!apiKey) { openSettings(); alert('请先配置 DeepSeek API Key'); return; }
      const scope = $('ag-ai-scope').value;
      const btn = $('ag-ai-btn'), out = $('ag-ai-output');
      btn.disabled = true; btn.textContent = '分析中…';
      out.style.display = 'block';
      out.innerHTML = '<div class="ag-loading"><div class="ag-spinner"></div><p>正在生成…</p></div>';
      const prompt = scope === 'all' ? buildGlobalPrompt() : buildDistPrompt(scope);
      try {
        const resp = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: localStorage.getItem('ag_api_model') || 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是一位专业的中国房地产市场分析师，擅长基于数据进行买入时机判断。回答要专业、简洁、有数据支撑。' },
              { role: 'user', content: prompt },
            ], temperature: 0.7, max_tokens: 4000, stream: true,
          }),
        });
        if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
        out.innerHTML = '';
        const reader = resp.body.getReader(), dec = new TextDecoder();
        let buf = '', full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const ds = line.slice(6).trim();
            if (ds === '[DONE]') break;
            try {
              const c = JSON.parse(ds).choices?.[0]?.delta?.content || '';
              if (c) { full += c; out.innerHTML = renderMd(full); out.scrollTop = out.scrollHeight; }
            } catch {}
          }
        }
      } catch (e) { out.innerHTML = `<div style="color:var(--ag-red)">Failed: ${e.message}</div>`; }
      btn.disabled = false; btn.textContent = '生成分析报告';
    }

    function histSummary(history, col, months) {
      if (!history || !history.length) return '暂无';
      const rows = history.slice(-months).filter(r => r[col] != null && r[col] > 0);
      if (!rows.length) return '暂无';
      return rows.map(r => `${r.date}:${r[col]}`).join(', ');
    }

    // Every prompt is prefixed with what the data cannot support. Without this
    // the model confidently answers questions the inputs never covered
    // (rental yield, supply, schools) and invents the numbers.
    function dataCaveats() {
      const cov = cityData.coverage;
      const c = [
        `数据截止 ${cov.asOf}，抓取于 ${cityData.updated_at}，滞后约 ${cov.lagMonths} 个月，不代表当月市场。`,
        `仅有价格序列，没有挂牌量、成交量、租金、房龄、学区、地铁等任何其他维度。`,
        `小区数据只有当期均价与环比快照，没有历史序列，无法做小区级趋势判断；环比缺失 ${100 - cov.commMomPct}%。`,
      ];
      if (cov.subDistrictsEmpty) c.push(`板块层无数据（${cov.subDistrictTotal} 个板块全空）。`);
      if (cov.cappedDistricts.length) c.push(`${cov.cappedDistricts.join('、')} 的小区列表被抓取上限 ${cov.commCap} 截断，非全量。`);
      if (cov.staleDistricts.length) c.push(`${cov.staleDistricts.join('、')} 数据更短更旧，与其他区不可直接比较。`);
      return c.map(x => `- ${x}`).join('\n');
    }

    function districtBlock(a, commLimit) {
      const d = cityData.districts[a.key];
      const comms = [...(d?.communities || [])].filter(c => c.price != null && c.price > 0)
        .sort((x, y) => (y.price || 0) - (x.price || 0));
      // Sending only the priciest N made every district look expensive and let
      // the model mistake the top of the tail for the typical home. Send the
      // shape of the distribution, then a sample from each end.
      const asc = [...comms].map(c => c.price).sort((x, y) => x - y);
      const q = f => asc.length ? asc[Math.min(asc.length - 1, Math.floor(asc.length * f))] : null;
      const dist = asc.length
        ? `小区价格分布(共${asc.length}个): 最低${fp(asc[0])} / P25 ${fp(q(0.25))} / 中位 ${fp(q(0.5))} / P75 ${fp(q(0.75))} / 最高${fp(asc[asc.length-1])}\n`
        : '';
      const fmt = c => `${c.community}:${fp(c.price)}${c.mom_pct != null ? '(' + fpct(c.mom_pct, true) + ')' : ''}`;
      const half = Math.floor(commLimit / 2);
      const line = commLimit && comms.length
        ? `最贵${half}个: ${comms.slice(0, half).map(fmt).join('、')}\n最便宜${half}个: ${comms.slice(-half).reverse().map(fmt).join('、')}\n`
        : '';
      let s = `\n### ${a.name}（${a.state}）\n`;
      s += `均价:${fp(a.latest)}元/㎡(${a.latestDate}), 距峰值:${fpct(a.drawdown, true)}(峰值${fp(a.peak)}@${a.peakDate}), `;
      s += `未创12月新低:${a.stabMonths}个月, 近6月:${fpct(a.slope6, true)}, 同比:${fpct(a.yoy, true)}, `;
      s += `相对全市:${a.premium != null ? a.premium.toFixed(2) + '倍' : 'N/A'}`;
      s += `${a.premiumPct != null ? `(历史分位${a.premiumPct.toFixed(0)}%)` : ''}, 历史${a.months}个月\n`;
      const cov = a.cov;
      if (cov?.commCapped) s += `注意: 小区列表被抓取上限 ${cityData.coverage.commCap} 截断，非全量\n`;
      if (cov?.commMismatch) s += `注意: 小区中位数为该区均价的 ${cov.commRatio.toFixed(2)} 倍，口径可能不一致，勿与区均价混用\n`;
      s += dist;
      s += line;
      return s;
    }

    function buildGlobalPrompt() {
      const col = 'second_hand_price';
      const cityHist = histSummary(cityData.city_history, col, 24);
      const dt = analysisResults.map(a => districtBlock(a, 20)).join('');
      return `你是一位严谨的房地产数据分析师。请基于以下${cityData.city}二手房数据做分析。

## 数据局限（必须遵守，不得超出这些数据下结论）
${dataCaveats()}

## 城市整体近24个月走势
${cityHist}

## 各区域指标（按回撤排序，非推荐排序）
${dt}

请输出：
1. 市场阶段判断：城市整体处于周期什么位置，依据是哪几个数字。
2. 区域分化：哪些区已出现企稳迹象、哪些仍在创新低，用"未创12月新低"和"近6月"两个字段说明。
3. 相对价值：结合"相对全市历史分位"，指出哪些区相对全市变便宜了、哪些变贵了——注意这与绝对跌幅是两件事。
4. 明确说明：基于现有数据，哪些问题你无法回答（例如租金回报、供给去化、学区），以及要回答它们需要补充什么数据。

要求：每个结论都必须引用上面出现过的具体数字。不要给出"建议买入/卖出"的指令性结论，只做状态描述与风险提示。`;
    }

    function buildDistPrompt(dk) {
      const d = cityData.districts[dk]; if (!d) return '';
      const a = analysisResults.find(x => x.key === dk);
      if (!a) return '';
      const conf = confidenceOf(a);
      const hist = histSummary(d.history, 'second_hand_price', 36);
      const comms = [...(d.communities || [])].filter(c => c.price != null && c.price > 0)
        .sort((x, y) => (y.price || 0) - (x.price || 0));
      const ct = comms.map(c => `${c.community}:${fp(c.price)}元/㎡${c.mom_pct != null ? ' 环比' + fpct(c.mom_pct, true) : ''}`).join('\n');
      return `你是一位严谨的房地产数据分析师。请基于以下${cityData.city}${d.name}的二手房数据做分析。

## 数据局限（必须遵守，不得超出这些数据下结论）
${dataCaveats()}
- 本区数据可信度：${conf.level}${conf.issues.length ? `（${conf.issues.join('；')}）` : ''}

## 本区指标
${districtBlock(a, 0).trim()}

## 历史价格（近36个月）
${hist}

## 小区当期快照（共${comms.length}个，价格降序，无历史数据）
${ct || '暂无'}

请输出：
1. 该区处于自身周期的什么位置：结合峰值${fp(a.peak)}(${a.peakDate})、当前${fp(a.latest)}、以及"未创12月新低${a.stabMonths}个月"说明。
2. 相对全市是变便宜还是变贵了：用"相对全市${a.premium != null ? a.premium.toFixed(2) + '倍' : 'N/A'}、历史分位${a.premiumPct != null ? a.premiumPct.toFixed(0) + '%' : 'N/A'}"作答，并说明它与绝对跌幅${fpct(a.drawdown, true)}的差异含义。
3. 小区价格分布特征：只描述当期分布（区间、集中度、离散度），不得推断小区趋势——没有历史数据。
4. 明确列出：要判断这个区"值不值得买"还缺哪些数据。

要求：每个结论引用具体数字。不要给出买入/卖出的指令性结论，也不要预测具体点位。`;
    }

    function renderMd(t) {
      return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/^\- (.+)$/gm,'• $1')
        .replace(/\n/g,'<br>');
    }

    return {
      get cityData() { return cityData; },
      loadCity, refresh, switchTab, renderAll, renderCommunities, renderMini, renderSubDistrictLatest, runAI,
      onSubDistrictParentChange, commPage, timingCommPage, renderTimingCommPage,
    };
  })();

  // ── Theme observer ──
  new MutationObserver(() => { if (hp.cityData) hp.renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => renderHub());

  return { hp, openAgent, backToHub, openSettings, closeSettings, overlayClick, saveSettings };
})();
