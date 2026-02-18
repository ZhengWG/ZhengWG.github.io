---
title: Agents
icon: fas fa-robot
order: 6
---

<style>
/* ── Theme variables ── */
.ag-app {
  --ag-card:    #ffffff;
  --ag-card2:   #f8f9fa;
  --ag-border:  #e2e8f0;
  --ag-text:    #1e293b;
  --ag-text2:   #475569;
  --ag-text3:   #94a3b8;
  --ag-accent:  #2563eb;
  --ag-green:   #16a34a;
  --ag-yellow:  #d97706;
  --ag-red:     #dc2626;
  --ag-orange:  #ea580c;
  --ag-radius:  7px;
  --ag-shadow:  0 2px 12px rgba(0,0,0,.08);
}
html[data-mode="dark"] .ag-app {
  --ag-card:    #1e2235;
  --ag-card2:   #262b42;
  --ag-border:  #333a55;
  --ag-text:    #e2e8f0;
  --ag-text2:   #94a3b8;
  --ag-text3:   #64748b;
  --ag-accent:  #60a5fa;
  --ag-green:   #4ade80;
  --ag-yellow:  #fbbf24;
  --ag-red:     #f87171;
  --ag-orange:  #fb923c;
  --ag-shadow:  0 2px 16px rgba(0,0,0,.4);
}

.ag-app { font-size: 13px; line-height: 1.6; color: var(--ag-text); }

/* ── Buttons ── */
.ag-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 13px; border-radius: 6px; font-size: 12px; font-weight: 600;
  cursor: pointer; border: none; transition: all .15s; line-height: 1.4;
}
.ag-btn-primary { background: var(--ag-accent); color: #fff; }
.ag-btn-primary:hover { filter: brightness(1.1); }
.ag-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.ag-btn-ghost {
  background: transparent; color: var(--ag-text2);
  border: 1px solid var(--ag-border);
}
.ag-btn-ghost:hover { background: var(--ag-card2); color: var(--ag-text); }
.ag-btn-sm { padding: 3px 10px; font-size: 11px; }

/* ── Agent hub overview ── */
.ag-hub-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px; margin-bottom: 16px;
}
.ag-hub-title { font-size: 18px; font-weight: 800; color: var(--ag-text); }
.ag-hub-subtitle { font-size: 12px; color: var(--ag-text3); margin-top: 2px; }
.ag-agent-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.ag-agent-card {
  background: var(--ag-card); border: 1px solid var(--ag-border);
  border-radius: 10px; padding: 20px; cursor: pointer;
  transition: all .2s; box-shadow: var(--ag-shadow);
}
.ag-agent-card:hover { border-color: var(--ag-accent); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.12); }
html[data-mode="dark"] .ag-agent-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.4); }
.ag-agent-icon { font-size: 28px; margin-bottom: 10px; }
.ag-agent-name { font-size: 15px; font-weight: 700; color: var(--ag-text); margin-bottom: 4px; font-family: 'SF Mono', 'Fira Code', monospace; }
.ag-agent-desc { font-size: 12px; color: var(--ag-text2); line-height: 1.5; margin-bottom: 10px; }
.ag-agent-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.ag-agent-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: var(--ag-card2); color: var(--ag-text3);
  border: 1px solid var(--ag-border); font-weight: 500;
}
.ag-agent-status {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
}
.ag-status-online { background: #dcfce7; color: #166534; }
html[data-mode="dark"] .ag-status-online { background: #14532d40; color: #86efac; }

/* ── Sub-agent header bar ── */
.ag-sub-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px;
  padding: 10px 14px;
  background: var(--ag-card);
  border: 1px solid var(--ag-border);
  border-radius: var(--ag-radius);
  margin-bottom: 14px;
  box-shadow: var(--ag-shadow);
}
.ag-sub-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ag-sub-right { display: flex; align-items: center; gap: 8px; }
.ag-breadcrumb { font-size: 12px; color: var(--ag-text3); }
.ag-breadcrumb a { color: var(--ag-accent); text-decoration: none; cursor: pointer; }
.ag-breadcrumb a:hover { text-decoration: underline; }
.ag-breadcrumb span { color: var(--ag-text); font-weight: 600; }

/* ── HP specific styles ── */
.ag-select {
  padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--ag-border); background: var(--ag-card2);
  color: var(--ag-text); cursor: pointer; outline: none;
}
.ag-select:focus { border-color: var(--ag-accent); }

.ag-tabs {
  display: flex; gap: 0; border-bottom: 2px solid var(--ag-border);
  margin-bottom: 16px;
}
.ag-tab {
  padding: 8px 18px; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; background: none;
  color: var(--ag-text3); border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: all .15s;
}
.ag-tab:hover { color: var(--ag-text2); }
.ag-tab.active { color: var(--ag-accent); border-bottom-color: var(--ag-accent); }

.ag-panel { display: none; }
.ag-panel.active { display: block; }

.ag-card {
  background: var(--ag-card); border: 1px solid var(--ag-border);
  border-radius: var(--ag-radius); padding: 14px;
  margin-bottom: 14px; box-shadow: var(--ag-shadow);
}

.ag-metrics {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px; margin-bottom: 14px;
}
.ag-metric {
  text-align: center; padding: 12px 10px;
  background: var(--ag-card2); border-radius: var(--ag-radius);
  border: 1px solid var(--ag-border);
}
.ag-metric-label { font-size: 11px; color: var(--ag-text3); margin-bottom: 4px; }
.ag-metric-value { font-size: 18px; font-weight: 700; color: var(--ag-text); }
.ag-metric-sub { font-size: 11px; margin-top: 2px; }
.ag-up { color: var(--ag-red); }
.ag-down { color: var(--ag-green); }

.ag-district-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.ag-district-chip {
  padding: 4px 12px; border-radius: 16px; font-size: 11px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--ag-border);
  background: var(--ag-card2); color: var(--ag-text2); transition: all .15s;
}
.ag-district-chip:hover { border-color: var(--ag-accent); color: var(--ag-accent); }
.ag-district-chip.active { background: var(--ag-accent); color: #fff; border-color: var(--ag-accent); }

.ag-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ag-table th {
  text-align: left; padding: 8px 10px; font-weight: 700;
  background: var(--ag-card2); color: var(--ag-text2);
  border-bottom: 2px solid var(--ag-border); font-size: 11px;
  text-transform: uppercase; letter-spacing: .3px;
}
.ag-table td { padding: 7px 10px; border-bottom: 1px solid var(--ag-border); color: var(--ag-text); }
.ag-table tr:hover td { background: var(--ag-card2); }

.ag-score-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px; margin-bottom: 14px;
}
.ag-score-card { text-align: center; padding: 14px 10px; border-radius: var(--ag-radius); border: 1px solid var(--ag-border); background: var(--ag-card); }
.ag-score-name { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
.ag-score-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.ag-score-level { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 10px; display: inline-block; }
.ag-score-green  { color: var(--ag-green); }
.ag-score-orange { color: var(--ag-orange); }
.ag-score-red    { color: var(--ag-red); }
.ag-level-green  { background: #dcfce7; color: #166534; }
.ag-level-orange { background: #fef3c7; color: #92400e; }
.ag-level-red    { background: #fee2e2; color: #991b1b; }
html[data-mode="dark"] .ag-level-green  { background: #14532d40; color: #86efac; }
html[data-mode="dark"] .ag-level-orange { background: #78350f40; color: #fde68a; }
html[data-mode="dark"] .ag-level-red    { background: #7f1d1d40; color: #fca5a5; }

.ag-expander { margin-bottom: 8px; }
.ag-expander-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; cursor: pointer;
  background: var(--ag-card); border: 1px solid var(--ag-border);
  border-radius: var(--ag-radius); transition: all .15s;
}
.ag-expander-header:hover { border-color: var(--ag-accent); }
.ag-expander-body {
  display: none; padding: 14px;
  border: 1px solid var(--ag-border); border-top: none;
  border-radius: 0 0 var(--ag-radius) var(--ag-radius);
  background: var(--ag-card);
}
.ag-expander.open .ag-expander-body { display: block; }
.ag-expander.open .ag-expander-header { border-radius: var(--ag-radius) var(--ag-radius) 0 0; }
.ag-expander-arrow { transition: transform .2s; }
.ag-expander.open .ag-expander-arrow { transform: rotate(180deg); }

.ag-ai-output {
  padding: 14px; background: var(--ag-card2); border-radius: var(--ag-radius);
  border: 1px solid var(--ag-border); font-size: 13px; line-height: 1.7;
  white-space: pre-wrap; word-break: break-word;
  max-height: 600px; overflow-y: auto;
}

.ag-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px; gap: 10px; color: var(--ag-text3);
}
.ag-spinner {
  width: 26px; height: 26px;
  border: 3px solid var(--ag-border); border-top-color: var(--ag-accent);
  border-radius: 50%; animation: ag-spin .7s linear infinite;
}
@keyframes ag-spin { to { transform: rotate(360deg); } }
.ag-empty { padding: 30px; text-align: center; color: var(--ag-text3); font-size: 13px; }

.ag-chart { width: 100%; min-height: 350px; }
.ag-chart-mini { width: 100%; min-height: 220px; }

.ag-settings-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  z-index: 1060; display: none; justify-content: flex-end;
}
.ag-settings-overlay.open { display: flex; }
.ag-settings-panel {
  background: var(--ag-card); border-left: 1px solid var(--ag-border);
  width: 360px; max-width: 100vw;
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
  box-shadow: -4px 0 20px rgba(0,0,0,.2);
  animation: ag-slide .18s ease;
}
@keyframes ag-slide { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
.ag-settings-hdr {
  padding: 14px 16px; border-bottom: 1px solid var(--ag-border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.ag-settings-title { font-size: 14px; font-weight: 700; color: var(--ag-text); }
.ag-settings-body { overflow-y: auto; flex: 1; padding: 16px; }
.ag-settings-section { margin-bottom: 22px; }
.ag-settings-section-title { font-size: 12px; font-weight: 700; color: var(--ag-text); margin-bottom: 8px; }
.ag-settings-note { font-size: 11px; color: var(--ag-text3); margin-top: 5px; }
.ag-form-label { font-size: 10px; color: var(--ag-text3); margin-bottom: 3px; display: block; }
.ag-input {
  width: 100%; padding: 6px 10px; background: var(--ag-card2);
  border: 1px solid var(--ag-border); border-radius: 6px;
  color: var(--ag-text); font-size: 12px; outline: none; box-sizing: border-box;
}
.ag-input:focus { border-color: var(--ag-accent); }

.ag-refresh-ok { color: var(--ag-green); font-size: 11px; margin-left: 6px; opacity: 0; transition: opacity .3s; }
.ag-refresh-ok.show { opacity: 1; }

@media (max-width: 768px) {
  .ag-metrics { grid-template-columns: repeat(2, 1fr); }
  .ag-score-grid { grid-template-columns: repeat(2, 1fr); }
  .ag-tab { padding: 6px 12px; font-size: 12px; }
  .ag-agent-grid { grid-template-columns: 1fr; }
}
</style>

<div id="ag-app" class="ag-app">

  <!-- ====== Agent Hub (overview) ====== -->
  <div id="ag-hub">
    <div class="ag-hub-header">
      <div>
        <div class="ag-hub-title">Agents</div>
        <div class="ag-hub-subtitle">Interactive analysis tools</div>
      </div>
      <button class="ag-btn ag-btn-ghost" onclick="AG.openSettings()">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1"/></svg>
        Settings
      </button>
    </div>
    <div class="ag-agent-grid" id="ag-agent-grid"></div>
  </div>

  <!-- ====== Sub-agent: house_price_analyzer ====== -->
  <div id="ag-hp" style="display:none">

    <!-- Sub header -->
    <div class="ag-sub-header">
      <div class="ag-sub-left">
        <div class="ag-breadcrumb">
          <a onclick="AG.backToHub()">Agents</a> / <span>house_price_analyzer</span>
        </div>
        <select class="ag-select" id="ag-city-select" onchange="AG.hp.loadCity(this.value)">
          <option value="hz">杭州</option>
        </select>
        <span style="font-size:11px;color:var(--ag-text3)" id="ag-hp-updated"></span>
      </div>
      <div class="ag-sub-right">
        <button class="ag-btn ag-btn-ghost ag-btn-sm" id="ag-refresh-btn" onclick="AG.hp.refresh()">
          <span id="ag-refresh-icon">&#8635;</span> Refresh
        </button>
        <span class="ag-refresh-ok" id="ag-refresh-ok">✓</span>
        <select class="ag-select" id="ag-price-type" onchange="AG.hp.renderAll()" style="font-size:11px">
          <option value="second_hand_price">二手房</option>
          <option value="new_house_price">新房</option>
        </select>
      </div>
    </div>

    <!-- Sub tabs -->
    <div class="ag-tabs">
      <button class="ag-tab active" data-tab="trend" onclick="AG.hp.switchTab('trend')">📈 价格走势</button>
      <button class="ag-tab" data-tab="latest" onclick="AG.hp.switchTab('latest')">🏘️ 最新房价</button>
      <button class="ag-tab" data-tab="timing" onclick="AG.hp.switchTab('timing')">🎯 买入时机</button>
    </div>

    <!-- Panel: 价格走势 -->
    <div class="ag-panel active" id="ag-panel-trend">
      <div class="ag-card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px" id="ag-trend-title">城市整体走势</div>
        <div class="ag-chart" id="ag-chart-city"></div>
      </div>
      <div style="font-weight:700;font-size:13px;margin-bottom:8px">选择区域对比</div>
      <div class="ag-district-bar" id="ag-district-chips"></div>
      <div class="ag-card">
        <div class="ag-chart" id="ag-chart-districts"></div>
      </div>
    </div>

    <!-- Panel: 最新房价 -->
    <div class="ag-panel" id="ag-panel-latest">
      <div class="ag-metrics" id="ag-latest-metrics"></div>
      <div class="ag-card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">各区域最新均价</div>
        <div class="ag-chart" id="ag-chart-bar"></div>
      </div>
      <div class="ag-card">
        <table class="ag-table" id="ag-latest-table"><thead><tr><th>区域</th><th>均价(元/㎡)</th><th>同比</th></tr></thead><tbody></tbody></table>
      </div>
      <div class="ag-card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">小区价格细分</div>
        <select class="ag-select" id="ag-comm-district" onchange="AG.hp.renderCommunities()"></select>
        <div style="margin-top:10px">
          <div class="ag-chart-mini" id="ag-chart-comm"></div>
          <table class="ag-table" id="ag-comm-table" style="margin-top:10px"><thead><tr><th>小区</th><th>均价(元/㎡)</th><th>环比(%)</th></tr></thead><tbody></tbody></table>
        </div>
      </div>
    </div>

    <!-- Panel: 买入时机 -->
    <div class="ag-panel" id="ag-panel-timing">
      <div class="ag-card">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">买入时机评估</div>
        <div style="font-size:11px;color:var(--ag-text3);margin-bottom:12px">评分 0-100，综合价格位置、趋势、动量、同比、波动率五个维度</div>
        <div class="ag-score-grid" id="ag-score-grid"></div>
      </div>
      <div class="ag-card">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px">指标对比雷达图</div>
        <div class="ag-chart" id="ag-chart-radar"></div>
      </div>
      <div class="ag-card">
        <table class="ag-table" id="ag-score-table"><thead><tr><th>区域</th><th>综合</th><th>建议</th><th>价格位置</th><th>趋势</th><th>动量</th><th>同比</th><th>波动率</th></tr></thead><tbody></tbody></table>
      </div>
      <div id="ag-timing-details"></div>

      <!-- AI -->
      <div class="ag-card" style="margin-top:14px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">🤖 AI 深度分析</div>
        <div style="font-size:11px;color:var(--ag-text3);margin-bottom:10px">基于量化数据 + 小区价格，调用 DeepSeek 生成分析报告</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
          <select class="ag-select" id="ag-ai-scope"><option value="all">全局分析</option></select>
          <button class="ag-btn ag-btn-primary" id="ag-ai-btn" onclick="AG.hp.runAI()">生成分析报告</button>
        </div>
        <div class="ag-ai-output" id="ag-ai-output" style="display:none"></div>
      </div>
    </div>

  </div><!-- #ag-hp -->

  <!-- Settings overlay -->
  <div id="ag-settings-overlay" class="ag-settings-overlay" onclick="AG.overlayClick(event)">
    <div class="ag-settings-panel">
      <div class="ag-settings-hdr">
        <div class="ag-settings-title">Settings</div>
        <button class="ag-btn ag-btn-ghost" style="padding:4px 8px" onclick="AG.closeSettings()">✕</button>
      </div>
      <div class="ag-settings-body">
        <div class="ag-settings-section">
          <div class="ag-settings-section-title">DeepSeek API</div>
          <label class="ag-form-label">API Key</label>
          <input class="ag-input" id="ag-api-key" type="password" placeholder="sk-..." style="margin-bottom:8px">
          <label class="ag-form-label">Model</label>
          <input class="ag-input" id="ag-api-model" value="deepseek-chat" style="margin-bottom:8px">
          <button class="ag-btn ag-btn-primary" onclick="AG.saveSettings()">Save</button>
          <div class="ag-settings-note">API Key is stored only in your browser's localStorage.</div>
        </div>
        <div class="ag-settings-section">
          <div class="ag-settings-section-title">Data Refresh Server</div>
          <label class="ag-form-label">Local server URL (for live data refresh)</label>
          <input class="ag-input" id="ag-server-url" placeholder="http://localhost:5100" style="margin-bottom:8px">
          <button class="ag-btn ag-btn-primary" onclick="AG.saveSettings()">Save</button>
          <div class="ag-settings-note">
            Run <code style="font-size:11px;background:var(--ag-card2);padding:2px 6px;border-radius:4px">python refresh_server.py</code> in house_search project for live data refresh.<br>
            Leave empty to use pre-exported static data only.
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
<script src="{{ '/assets/js/agents.js' | relative_url }}"></script>
