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
    // future agents go here
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
    if (id === 'house_price_analyzer') {
      $('ag-hub').style.display = 'none';
      $('ag-hp').style.display = 'block';
      if (!hp.cityData) hp.loadCity('hz');
    }
  }

  function backToHub() {
    $('ag-hub').style.display = 'block';
    $('ag-hp').style.display = 'none';
  }

  // ====== SETTINGS ======
  function openSettings() { $('ag-settings-overlay').classList.add('open'); loadSettings(); }
  function closeSettings() { $('ag-settings-overlay').classList.remove('open'); }
  function overlayClick(e) { if (e.target === $('ag-settings-overlay')) closeSettings(); }
  function loadSettings() {
    $('ag-api-key').value = localStorage.getItem('ag_api_key') || '';
    $('ag-api-model').value = localStorage.getItem('ag_api_model') || 'deepseek-chat';
    $('ag-server-url').value = localStorage.getItem('ag_server_url') || '';
  }
  function saveSettings() {
    localStorage.setItem('ag_api_key', $('ag-api-key').value.trim());
    localStorage.setItem('ag_api_model', $('ag-api-model').value.trim() || 'deepseek-chat');
    localStorage.setItem('ag_server_url', $('ag-server-url').value.trim());
    closeSettings();
  }

  // ====== HOUSE PRICE ANALYZER ======
  const hp = (() => {
    let cityData = null;
    let selectedDistricts = new Set();
    let scoringResults = [];

    async function loadCity(key) {
      $('ag-hp').querySelectorAll('.ag-panel.active').forEach(p => {
        p.innerHTML = '<div class="ag-loading"><div class="ag-spinner"></div><p>Loading…</p></div>';
      });
      try {
        const url = `${DATA_BASE}/${key}.json`;
        const resp = await fetch(url, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        cityData = await resp.json();
      } catch (e) {
        $('ag-hp').querySelector('.ag-panel.active').innerHTML =
          `<div class="ag-empty">Data load failed: ${e.message}</div>`;
        return;
      }
      $('ag-hp-updated').textContent = `Updated: ${cityData.updated_at}`;
      selectedDistricts.clear();
      Object.keys(cityData.districts).slice(0, 5).forEach(d => selectedDistricts.add(d));
      initChips(); initCommSelect(); initAIScope();
      restorePanels();
      renderAll();
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
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:10px">小区价格细分</div><select class="ag-select" id="ag-comm-district" onchange="AG.hp.renderCommunities()"></select><div style="margin-top:10px"><div class="ag-chart-mini" id="ag-chart-comm"></div><table class="ag-table" id="ag-comm-table" style="margin-top:10px"><thead><tr><th>小区</th><th>均价(元/㎡)</th><th>环比(%)</th></tr></thead><tbody></tbody></table></div></div>`;
          initCommSelect();
        }
        if (t === 'timing') {
          p.innerHTML = `
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:4px">买入时机评估</div><div style="font-size:11px;color:var(--ag-text3);margin-bottom:12px">评分 0-100，综合价格位置、趋势、动量、同比、波动率五个维度</div><div class="ag-score-grid" id="ag-score-grid"></div></div>
            <div class="ag-card"><div style="font-weight:700;font-size:14px;margin-bottom:10px">指标对比雷达图</div><div class="ag-chart" id="ag-chart-radar"></div></div>
            <div class="ag-card"><table class="ag-table" id="ag-score-table"><thead><tr><th>区域</th><th>综合</th><th>建议</th><th>价格位置</th><th>趋势</th><th>动量</th><th>同比</th><th>波动率</th></tr></thead><tbody></tbody></table></div>
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

      const serverUrl = localStorage.getItem('ag_server_url');
      const cityKey = $('ag-city-select').value || 'hz';

      try {
        if (serverUrl) {
          const resp = await fetch(`${serverUrl}/export/${cityKey}`, { method: 'POST' });
          if (!resp.ok) throw new Error(`Server: ${resp.status}`);
          const data = await resp.json();
          if (data.status === 'ok' && data.data) {
            cityData = data.data;
          } else {
            await loadCity(cityKey);
          }
        } else {
          await loadCity(cityKey);
        }
        $('ag-hp-updated').textContent = `Updated: ${cityData?.updated_at || 'now'}`;
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
      renderCommunities();
    }

    function renderCommunities() {
      const dk = $('ag-comm-district')?.value;
      if (!dk || !cityData) return;
      const d = cityData.districts[dk], comms = d?.communities || [];
      const tbody = $('ag-comm-table')?.querySelector('tbody');
      if (!comms.length) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--ag-text3)">暂无数据</td></tr>';
        if ($('ag-chart-comm')) Plotly.react('ag-chart-comm', [{x:[],y:[]}], bLayout({height:220}), {responsive:true,displayModeBar:false});
        return;
      }
      const sorted = [...comms].sort((a,b)=>(b.price||0)-(a.price||0));
      if ($('ag-chart-comm')) Plotly.react('ag-chart-comm', [{
        x: sorted.map(r=>r.community), y: sorted.map(r=>r.price), type: 'bar',
        text: sorted.map(r=>fp(r.price)), textposition: 'outside',
        marker: { color: sorted.map(r=>(r.mom_pct||0)>=0?'#16a34a':'#dc2626') },
      }], bLayout({ height: 280, yaxis: { title: '均价(元/㎡)', gridcolor: plotGrid() }, xaxis: { tickangle: -30, gridcolor: plotGrid() },
        title: { text: `${d.name}热门小区均价`, font: { size: 13 } } }), { responsive: true, displayModeBar: false });
      if (tbody) tbody.innerHTML = sorted.map(r => `<tr><td>${r.community}</td><td>${fp(r.price)}</td><td class="${(r.mom_pct||0)>=0?'ag-up':'ag-down'}">${r.mom_pct!=null?fpct(r.mom_pct,true):'N/A'}</td></tr>`).join('');
    }

    // ── Timing ──
    const LEVELS = [[80,'强烈建议买入'],[65,'建议买入'],[50,'可考虑入手'],[35,'建议观望'],[0,'强烈建议观望']];
    function lvl(s) { for (const [t,l] of LEVELS) if (s>=t) return l; return LEVELS[LEVELS.length-1][1]; }

    function evalDist(name, key, prices) {
      const n = prices.length, latest = prices[n-1];
      const high = Math.max(...prices), low = Math.min(...prices);
      const pct = prices.filter(p=>p<latest).length/n*100;
      const ch = []; for (let i=1;i<n;i++) ch.push((prices[i]-prices[i-1])/prices[i-1]*100);
      const mom = ch.length ? ch[ch.length-1] : null;
      const yoy = n>=13 ? (prices[n-1]-prices[n-13])/prices[n-13]*100 : null;
      const t6 = prices.slice(-6), m6 = t6.reduce((a,b)=>a+b,0)/t6.length;
      const std6 = Math.sqrt(t6.reduce((a,v)=>a+(v-m6)**2,0)/t6.length);
      const vol = m6>0 ? std6/m6*100 : 0;
      const trend = dtTrend(prices);
      const ps = Math.max(0,100-pct);
      const ts = sTrend(trend,prices);
      const ms = sMom(ch);
      const ys = sYoy(yoy);
      const vs = vol<1?80:vol<3?60:vol<5?40:20;
      const total = Math.max(0, Math.min(100, ps*.30+ts*.25+ms*.20+ys*.15+vs*.10));
      const score = Math.round(total*10)/10;
      return { name, key, score, level: lvl(score),
        priceScore: Math.round(ps*10)/10, trendScore: Math.round(ts*10)/10,
        momentumScore: Math.round(ms*10)/10, yoyScore: Math.round(ys*10)/10, volScore: Math.round(vs*10)/10,
        details: { latestPrice: latest, mom, yoy, percentile: pct, trend, vol, high, low } };
    }
    function dtTrend(p) {
      if (p.length<6) return '盘整';
      const ms = movAvg(p,3), ml = movAvg(p,6), n = ms.length;
      const sl = ms.slice(-3); const slope = sl.length>=2?(sl[sl.length-1]-sl[0])/sl.length:0;
      if (ms[n-1]>ml[n-1]&&slope>0) return '上升';
      if (ms[n-1]<ml[n-1]&&slope<0) return '下降';
      return '盘整';
    }
    function sTrend(t,p) {
      if (t==='盘整') return 60;
      if (p.length<6) return 50;
      const ms=movAvg(p,3), ml=movAvg(p,6), n=ms.length;
      const d=ms[n-1]-ml[n-1], pd=n>=3?ms[n-3]-ml[n-3]:d;
      if (t==='下降') return Math.abs(d)<Math.abs(pd)?80:30;
      return d>pd?40:55;
    }
    function sMom(ch) {
      if (ch.length<3) return 50;
      const r=ch.slice(-3), nc=r.filter(v=>v<0).length, l=r[2], p=r[1];
      if (p<0&&l>0) return 85;
      if (nc>=2&&l<0&&Math.abs(l)<Math.abs(p)) return 75;
      if (nc===3&&Math.abs(l)>Math.abs(p)) return 25;
      if (r.filter(v=>v>0).length===3) return 35;
      return 50;
    }
    function sYoy(y) { return y==null?50:Math.max(0,Math.min(100,50-y*2)); }

    function renderTiming() {
      if (!cityData || !$('ag-score-grid')) return;
      const col = $('ag-price-type').value;
      scoringResults = [];
      for (const [dk,d] of Object.entries(cityData.districts)) {
        if (!d.history||d.history.length<6) continue;
        const prices = d.history.map(r=>r[col]).filter(v=>v!=null&&v>0);
        if (prices.length<6) continue;
        scoringResults.push(evalDist(d.name, dk, prices));
      }
      scoringResults.sort((a,b)=>b.score-a.score);
      $('ag-score-grid').innerHTML = scoringResults.slice(0,6).map(r => {
        const c = r.score>=75?'green':r.score>=55?'orange':'red';
        return `<div class="ag-score-card"><div class="ag-score-name">${r.name}</div><div class="ag-score-value ag-score-${c}">${r.score}</div><span class="ag-score-level ag-level-${c}">${r.level}</span></div>`;
      }).join('');
      const tb = $('ag-score-table')?.querySelector('tbody');
      if (tb) tb.innerHTML = scoringResults.map(r => {
        const c = r.score>=75?'green':r.score>=55?'orange':'red';
        return `<tr><td>${r.name}</td><td><strong class="ag-score-${c}">${r.score}</strong></td><td><span class="ag-score-level ag-level-${c}" style="font-size:10px;padding:1px 6px">${r.level}</span></td><td>${r.priceScore}</td><td>${r.trendScore}</td><td>${r.momentumScore}</td><td>${r.yoyScore}</td><td>${r.volScore}</td></tr>`;
      }).join('');
      const top6 = scoringResults.slice(0,6);
      const cats = ['价格位置','趋势','动量','同比','波动率'];
      if ($('ag-chart-radar')) Plotly.react('ag-chart-radar',
        top6.length ? top6.map((r,i) => ({
          type:'scatterpolar', r:[r.priceScore,r.trendScore,r.momentumScore,r.yoyScore,r.volScore],
          theta:cats, fill:'toself', name:r.name, opacity:0.6, line:{color:COLORS[i%COLORS.length]},
        })) : [{type:'scatterpolar',r:[],theta:[]}],
        bLayout({ height:420, polar:{radialaxis:{visible:true,range:[0,100],gridcolor:plotGrid()},bgcolor:plotBg()}, showlegend:true }),
        { responsive:true, displayModeBar:false });
      renderTimingDetails();
    }

    function renderTimingDetails() {
      const container = $('ag-timing-details');
      if (!container) return;
      container.innerHTML = '';
      for (const r of scoringResults) {
        const cc = r.score>=75?'green':r.score>=55?'orange':'red';
        const d = cityData.districts[r.key];
        const comms = d?.communities || [];
        const exp = document.createElement('div');
        exp.className = 'ag-expander';
        exp.innerHTML = `
          <div class="ag-expander-header" onclick="this.parentElement.classList.toggle('open');AG.hp.renderMini('${r.key}')">
            <span><strong>${r.name}</strong> — <span class="ag-score-level ag-level-${cc}" style="font-size:10px;padding:1px 6px">${r.level}</span>（${r.score}分）</span>
            <span class="ag-expander-arrow">▼</span>
          </div>
          <div class="ag-expander-body">
            <div class="ag-metrics">
              <div class="ag-metric"><div class="ag-metric-label">最新均价</div><div class="ag-metric-value">${fp(r.details.latestPrice)}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">月环比</div><div class="ag-metric-value ${(r.details.mom||0)>=0?'ag-up':'ag-down'}">${fpct(r.details.mom,true)}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">年同比</div><div class="ag-metric-value ${(r.details.yoy||0)>=0?'ag-up':'ag-down'}">${fpct(r.details.yoy,true)}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">百分位</div><div class="ag-metric-value">${r.details.percentile!=null?r.details.percentile.toFixed(1)+'%':'N/A'}</div></div>
              <div class="ag-metric"><div class="ag-metric-label">趋势</div><div class="ag-metric-value">${r.details.trend}</div></div>
            </div>
            <div style="font-size:11px;color:var(--ag-text3);margin-bottom:10px">最高:${fp(r.details.high)} | 最低:${fp(r.details.low)} | 波动率:${r.details.vol?.toFixed(2)||'N/A'}%</div>
            <div class="ag-chart-mini" id="ag-mini-${r.key}"></div>
            ${comms.length?`<div style="font-weight:700;font-size:12px;margin:10px 0 6px">热门小区</div><table class="ag-table"><thead><tr><th>小区</th><th>均价</th><th>环比</th></tr></thead><tbody>${comms.slice(0,8).map(c=>`<tr><td>${c.community}</td><td>${fp(c.price)}</td><td class="${(c.mom_pct||0)>=0?'ag-up':'ag-down'}">${c.mom_pct!=null?fpct(c.mom_pct,true):'N/A'}</td></tr>`).join('')}</tbody></table>`:''}
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

    function buildGlobalPrompt() {
      const col = $('ag-price-type').value;
      const pt = col==='second_hand_price'?'二手房':'新房';
      let dt = scoringResults.map(r => `- **${r.name}**: ${r.score}分(${r.level}), ${fp(r.details.latestPrice)}元/㎡, 环比${fpct(r.details.mom,true)}, 同比${fpct(r.details.yoy,true)}, ${r.details.trend}, 百分位${r.details.percentile?.toFixed(1)}%`).join('\n');
      let ct = '';
      for (const r of scoringResults.slice(0,8)) {
        const comms = cityData.districts[r.key]?.communities || [];
        if (!comms.length) continue;
        ct += `\n### ${r.name}\n`;
        comms.slice(0,8).forEach(c => { ct += `  - ${c.community}: ${fp(c.price)}元/㎡ ${c.mom_pct!=null?'环比'+fpct(c.mom_pct,true):''}\n`; });
      }
      return `请基于以下${cityData.city}${pt}数据给出买入时机分析报告。\n\n## 各区域数据\n${dt}\n\n## 小区价格\n${ct}\n\n请分析: 1.市场阶段判断 2.区域对比 3.TOP5性价比小区 4.刚需/投资建议 5.关键信号`;
    }

    function buildDistPrompt(dk) {
      const d = cityData.districts[dk]; if (!d) return '';
      const r = scoringResults.find(x=>x.key===dk);
      const pt = $('ag-price-type').value==='second_hand_price'?'二手房':'新房';
      const comms = d.communities||[];
      let ct = comms.map(c=>`  ${c.community}: ${fp(c.price)}元/㎡ ${c.mom_pct!=null?'(环比'+fpct(c.mom_pct,true)+')':''}`).join('\n');
      return `请基于以下${cityData.city}${d.name}${pt}数据给出深度分析。\n\n## 数据\n评分${r?.score||'N/A'}/100, 均价${fp(r?.details?.latestPrice)}元/㎡, 环比${fpct(r?.details?.mom,true)}, 同比${fpct(r?.details?.yoy,true)}, ${r?.details?.trend||'N/A'}, 百分位${r?.details?.percentile?.toFixed(1)||'N/A'}%\n\n## 小区\n${ct||'暂无'}\n\n请分析: 1.市场阶段 2.小区级推荐 3.未来走势 4.操作建议`;
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
      loadCity, refresh, switchTab, renderAll, renderCommunities, renderMini, runAI,
    };
  })();

  // ── Theme observer ──
  new MutationObserver(() => { if (hp.cityData) hp.renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => renderHub());

  return { hp, openAgent, backToHub, openSettings, closeSettings, overlayClick, saveSettings };
})();
