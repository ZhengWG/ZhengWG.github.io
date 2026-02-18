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

<style>
/* ── AI Tracker (embedded in Agents) ── */
.ai-tracker {
  --ai-card:    #ffffff;
  --ai-card2:   #f8f9fa;
  --ai-border:  #e2e8f0;
  --ai-text:    #1e293b;
  --ai-text2:   #475569;
  --ai-text3:   #94a3b8;
  --ai-accent:  #2563eb;
  --ai-accent2: #7c3aed;
  --ai-green:   #16a34a;
  --ai-yellow:  #d97706;
  --ai-red:     #dc2626;
  --ai-tag-bg:  #eff6ff;
  --ai-tag:     #2563eb;
  --ai-radius:  7px;
  --ai-shadow:  0 2px 12px rgba(0,0,0,.08);
}
html[data-mode="dark"] .ai-tracker {
  --ai-card:    #1e2235;
  --ai-card2:   #262b42;
  --ai-border:  #333a55;
  --ai-text:    #e2e8f0;
  --ai-text2:   #94a3b8;
  --ai-text3:   #64748b;
  --ai-accent:  #60a5fa;
  --ai-accent2: #a78bfa;
  --ai-green:   #4ade80;
  --ai-yellow:  #fbbf24;
  --ai-red:     #f87171;
  --ai-tag-bg:  #1e3a5f;
  --ai-tag:     #93c5fd;
  --ai-shadow:  0 2px 16px rgba(0,0,0,.4);
}
.ai-tracker { font-size: 13px; line-height: 1.6; }
.ai-hdr { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: var(--ai-card); border: 1px solid var(--ai-border); border-radius: var(--ai-radius); margin-bottom: 14px; box-shadow: var(--ai-shadow); }
.ai-hdr-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ai-hdr-right { display: flex; align-items: center; gap: 8px; }
.ai-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; letter-spacing: .3px; text-transform: uppercase; }
.ai-badge-p { background: var(--ai-tag-bg); color: var(--ai-accent); border: 1px solid var(--ai-accent)44; }
.ai-badge-r { background: #f5f3ff; color: var(--ai-accent2); border: 1px solid var(--ai-accent2)44; }
html[data-mode="dark"] .ai-badge-r { background: #2e1f5e; }
.ai-status { font-size: 11px; color: var(--ai-text3); text-align: right; }
.ai-status span { display: block; }
.ai-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 13px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all .15s; line-height: 1.4; }
.ai-btn-primary { background: var(--ai-accent); color: #fff; }
.ai-btn-primary:hover { filter: brightness(1.1); }
.ai-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.ai-btn-primary.loading { opacity: .7; cursor: wait; }
.ai-btn-ghost { background: transparent; color: var(--ai-text2); border: 1px solid var(--ai-border); }
.ai-btn-ghost:hover { background: var(--ai-card2); color: var(--ai-text); }
@keyframes ai-spin { to { transform: rotate(360deg); } }
.ai-spinning { display: inline-block; animation: ai-spin .7s linear infinite; }
.ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
@media (max-width: 800px) { .ai-grid { grid-template-columns: 1fr; } }
.ai-col-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 7px; margin-bottom: 10px; color: var(--ai-text); }
.ai-col-title svg { flex-shrink: 0; }
.ai-count-pill { font-size: 10px; background: var(--ai-card2); color: var(--ai-text3); padding: 1px 7px; border-radius: 8px; font-weight: 500; }
.ai-filter-bar { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
.ai-input { flex: 1; min-width: 140px; padding: 6px 10px; background: var(--ai-card2); border: 1px solid var(--ai-border); border-radius: 6px; color: var(--ai-text); font-size: 12px; outline: none; }
.ai-input:focus { border-color: var(--ai-accent); }
.ai-input::placeholder { color: var(--ai-text3); }
.ai-date-input { padding: 5px 8px; background: var(--ai-card2); border: 1px solid var(--ai-border); border-radius: 6px; color: var(--ai-text); font-size: 11px; outline: none; width: 118px; }
.ai-date-input:focus { border-color: var(--ai-accent); }
.ai-date-label { font-size: 11px; color: var(--ai-text3); white-space: nowrap; }
.ai-papers-list { display: flex; flex-direction: column; gap: 8px; }
.ai-paper-card { background: var(--ai-card); border: 1px solid var(--ai-border); border-radius: var(--ai-radius); padding: 12px 14px; transition: border-color .2s, box-shadow .2s; }
.ai-paper-card:hover { border-color: var(--ai-accent)60; box-shadow: var(--ai-shadow); }
.ai-paper-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
.ai-date { font-size: 10px; color: var(--ai-text3); font-family: monospace; }
.ai-tag { font-size: 10px; padding: 1px 6px; background: var(--ai-tag-bg); color: var(--ai-tag); border-radius: 4px; font-weight: 500; white-space: nowrap; }
.ai-cat { background: #f0fdf4; color: #15803d; }
html[data-mode="dark"] .ai-cat { background: #14532d30; color: #86efac; }
.ai-paper-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; line-height: 1.4; }
.ai-paper-title a { color: var(--ai-text); text-decoration: none; }
.ai-paper-title a:hover { color: var(--ai-accent); }
.ai-paper-authors { font-size: 11px; color: var(--ai-text3); margin-bottom: 6px; font-style: italic; }
.ai-abstract { font-size: 12px; color: var(--ai-text2); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ai-abstract.expanded { -webkit-line-clamp: unset; }
.ai-paper-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.ai-link-btn { font-size: 11px; color: var(--ai-accent); background: none; border: none; cursor: pointer; padding: 0; text-decoration: none; }
.ai-link-btn:hover { text-decoration: underline; }
.ai-trans-btn { margin-left: auto; padding: 3px 9px; border: 1px solid var(--ai-border); border-radius: 5px; background: var(--ai-card2); color: var(--ai-text2); font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s; }
.ai-trans-btn:hover { border-color: var(--ai-accent2); color: var(--ai-accent2); }
.ai-trans-btn.active { background: #f5f3ff; border-color: var(--ai-accent2)80; color: var(--ai-accent2); }
html[data-mode="dark"] .ai-trans-btn.active { background: #2e1f5e; }
.ai-repos-list { display: flex; flex-direction: column; gap: 8px; }
.ai-repo-card { background: var(--ai-card); border: 1px solid var(--ai-border); border-radius: var(--ai-radius); overflow: hidden; transition: border-color .2s, box-shadow .2s; }
.ai-repo-card:hover { border-color: var(--ai-accent2)60; box-shadow: var(--ai-shadow); }
.ai-repo-header { padding: 11px 14px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--ai-border); }
.ai-repo-header-left { flex: 1; min-width: 0; }
.ai-repo-name { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
.ai-repo-name a { color: var(--ai-text); text-decoration: none; }
.ai-repo-name a:hover { color: var(--ai-accent2); }
.ai-repo-label { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600; background: #f5f3ff; color: var(--ai-accent2); border: 1px solid var(--ai-accent2)44; }
html[data-mode="dark"] .ai-repo-label { background: #2e1f5e; }
.ai-repo-desc { font-size: 11px; color: var(--ai-text2); line-height: 1.5; }
.ai-repo-stats { display: flex; gap: 8px; flex-shrink: 0; }
.ai-stat { font-size: 11px; color: var(--ai-text3); white-space: nowrap; }
.ai-repo-body { padding: 10px 14px; }
.ai-section { margin-bottom: 10px; }
.ai-section:last-child { margin-bottom: 0; }
.ai-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: var(--ai-text3); margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
.ai-section-label::after { content: ''; flex: 1; height: 1px; background: var(--ai-border); }
.ai-release-card { background: var(--ai-card2); border-radius: 6px; padding: 9px 11px; border: 1px solid var(--ai-border); }
.ai-release-tag { font-family: monospace; font-weight: 700; color: var(--ai-green); font-size: 12px; margin-bottom: 2px; }
.ai-release-date { font-size: 11px; color: var(--ai-text3); margin-bottom: 5px; }
.ai-release-date a { color: var(--ai-accent); text-decoration: none; }
.ai-release-date a:hover { text-decoration: underline; }
.ai-release-body { font-size: 11px; color: var(--ai-text2); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-wrap; word-break: break-word; margin-bottom: 3px; }
.ai-release-body.expanded { -webkit-line-clamp: unset; }
.ai-milestone { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
.ai-ms-icon { color: var(--ai-yellow); font-size: 12px; flex-shrink: 0; margin-top: 1px; }
.ai-ms-body { flex: 1; min-width: 0; }
.ai-ms-title { font-weight: 600; font-size: 12px; margin-bottom: 2px; }
.ai-ms-title a { color: var(--ai-text); text-decoration: none; }
.ai-ms-title a:hover { color: var(--ai-accent); }
.ai-ms-desc { font-size: 11px; color: var(--ai-text3); margin-bottom: 3px; }
.ai-ms-meta { font-size: 10px; color: var(--ai-text3); }
.ai-progress { height: 3px; background: var(--ai-border); border-radius: 2px; margin-top: 4px; }
.ai-progress-fill { height: 100%; background: var(--ai-green); border-radius: 2px; }
.ai-issue { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 5px; padding: 6px 8px; background: var(--ai-card2); border-radius: 5px; }
.ai-issue-num { font-family: monospace; font-size: 10px; color: var(--ai-text3); flex-shrink: 0; margin-top: 1px; }
.ai-issue-body { flex: 1; min-width: 0; }
.ai-issue-body a { color: var(--ai-text); text-decoration: none; font-size: 12px; font-weight: 500; }
.ai-issue-body a:hover { color: var(--ai-accent); }
.ai-issue-labels { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 3px; }
.ai-issue-label { font-size: 10px; padding: 1px 6px; border-radius: 8px; font-weight: 500; }
.ai-issue-meta { font-size: 10px; color: var(--ai-text3); margin-top: 2px; }
.ai-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 16px; gap: 10px; color: var(--ai-text3); }
.ai-spinner { width: 26px; height: 26px; border: 3px solid var(--ai-border); border-top-color: var(--ai-accent); border-radius: 50%; animation: ai-spin .7s linear infinite; }
.ai-loading p { font-size: 12px; }
.ai-empty { padding: 20px; text-align: center; color: var(--ai-text3); font-size: 12px; }
.ai-error-banner { background: #fef2f2; border: 1px solid #fecaca; color: var(--ai-red); border-radius: 6px; padding: 8px 12px; font-size: 11px; margin-bottom: 8px; }
html[data-mode="dark"] .ai-error-banner { background: #450a0a; border-color: #7f1d1d; }
.ai-settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1060; display: none; justify-content: flex-end; }
.ai-settings-overlay.open { display: flex; }
.ai-settings-panel { background: var(--ai-card); border-left: 1px solid var(--ai-border); width: 380px; max-width: 100vw; display: flex; flex-direction: column; height: 100vh; overflow: hidden; box-shadow: -4px 0 20px rgba(0,0,0,.2); animation: ai-slide-in .18s ease; }
@keyframes ai-slide-in { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
.ai-settings-hdr { padding: 14px 16px; border-bottom: 1px solid var(--ai-border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.ai-settings-title { font-size: 14px; font-weight: 700; color: var(--ai-text); }
.ai-settings-body { overflow-y: auto; flex: 1; padding: 16px; }
.ai-settings-section { margin-bottom: 22px; }
.ai-settings-section:last-child { margin-bottom: 0; }
.ai-settings-section-title { font-size: 12px; font-weight: 700; color: var(--ai-text); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
.ai-settings-note { font-size: 11px; color: var(--ai-text3); margin-top: 5px; }
.ai-kw-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.ai-kw-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--ai-card2); border-radius: 6px; border: 1px solid var(--ai-border); }
.ai-kw-text { flex: 1; font-size: 12px; color: var(--ai-text); word-break: break-word; }
.ai-del-btn { padding: 2px 6px; border-radius: 4px; border: none; background: transparent; color: var(--ai-text3); cursor: pointer; font-size: 12px; line-height: 1; flex-shrink: 0; }
.ai-del-btn:hover { background: #fef2f2; color: var(--ai-red); }
html[data-mode="dark"] .ai-del-btn:hover { background: #450a0a; }
.ai-add-row { display: flex; gap: 7px; }
.ai-add-input { flex: 1; padding: 6px 10px; background: var(--ai-card2); border: 1px solid var(--ai-border); border-radius: 6px; color: var(--ai-text); font-size: 12px; outline: none; }
.ai-add-input:focus { border-color: var(--ai-accent); }
.ai-add-input::placeholder { color: var(--ai-text3); }
.ai-repo-settings-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.ai-repo-settings-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--ai-card2); border-radius: 6px; border: 1px solid var(--ai-border); }
.ai-rs-name { font-size: 12px; font-weight: 600; color: var(--ai-text); }
.ai-rs-label { font-size: 11px; color: var(--ai-text3); }
.ai-add-repo-form { padding: 10px; background: var(--ai-card2); border: 1px solid var(--ai-border); border-radius: 6px; margin-top: 6px; }
.ai-form-label { font-size: 10px; color: var(--ai-text3); margin-bottom: 3px; display: block; }
.ai-form-row { display: flex; gap: 6px; margin-bottom: 7px; align-items: center; }
.ai-form-row span { color: var(--ai-text3); font-size: 13px; }
.ai-form-row .ai-add-input { margin-bottom: 0; }
.ai-api-row { display: flex; gap: 6px; align-items: center; }
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

  <!-- ====== Sub-agent: ai_tracker ====== -->
  <div id="ag-ai-tracker" style="display:none">
    <div class="ag-sub-header">
      <div class="ag-sub-left">
        <div class="ag-breadcrumb">
          <a onclick="AG.backToHub()">Agents</a> / <span>ai_tracker</span>
        </div>
      </div>
    </div>
    <div id="ai-tracker" class="ai-tracker">
      <div class="ai-hdr">
        <div class="ai-hdr-left">
          <span class="ai-badge ai-badge-p" id="ai-badge-papers">– papers</span>
          <span class="ai-badge ai-badge-r" id="ai-badge-repos">– repos</span>
        </div>
        <div class="ai-hdr-right">
          <div class="ai-status">
            <span id="ai-status-text">Loading…</span>
            <span id="ai-last-updated"></span>
          </div>
          <button class="ai-btn ai-btn-ghost" onclick="aiOpenSettings()">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
              <circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1"/>
            </svg>
            Settings
          </button>
          <button class="ai-btn ai-btn-primary" id="ai-refresh-btn" onclick="aiDoRefresh()">
            <span id="ai-refresh-icon">&#8635;</span>
            Refresh
          </button>
        </div>
      </div>
      <div class="ai-grid">
        <div>
          <div class="ai-col-title">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="color:var(--ai-accent)">
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
            </svg>
            Papers
            <span class="ai-count-pill" id="ai-paper-count">0</span>
          </div>
          <div class="ai-filter-bar">
            <input class="ai-input" id="ai-paper-filter" placeholder="Filter by title, author, keyword…" oninput="aiFilterPapers()">
            <span class="ai-date-label">From</span>
            <input class="ai-date-input" type="date" id="ai-date-from" onchange="aiFilterPapers()">
            <span class="ai-date-label">To</span>
            <input class="ai-date-input" type="date" id="ai-date-to" onchange="aiFilterPapers()">
          </div>
          <div id="ai-papers-list">
            <div class="ai-loading"><div class="ai-spinner"></div><p>Initializing…</p></div>
          </div>
        </div>
        <div>
          <div class="ai-col-title">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="color:var(--ai-accent2)">
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8V1.5Z"/>
            </svg>
            GitHub Repos
            <span class="ai-count-pill" id="ai-repo-count">0</span>
          </div>
          <div id="ai-repos-list">
            <div class="ai-loading"><div class="ai-spinner"></div><p>Initializing…</p></div>
          </div>
        </div>
      </div>
      <div id="ai-settings-overlay" class="ai-settings-overlay" onclick="aiOverlayClick(event)">
        <div class="ai-settings-panel">
          <div class="ai-settings-hdr">
            <div class="ai-settings-title">Settings</div>
            <button class="ai-btn ai-btn-ghost" style="padding:4px 8px" onclick="aiCloseSettings()">&#10005;</button>
          </div>
          <div class="ai-settings-body">
            <div class="ai-settings-section">
              <div class="ai-settings-section-title">
                arXiv Keywords
                <span id="ai-kw-count" style="font-size:11px;font-weight:400;color:var(--ai-text3)"></span>
              </div>
              <div class="ai-kw-list" id="ai-kw-list"></div>
              <div class="ai-add-row">
                <input class="ai-add-input" id="ai-new-kw" placeholder="e.g. speculative decoding LLM" onkeydown="if(event.key==='Enter')aiAddKeyword()">
                <button class="ai-btn ai-btn-primary" style="font-size:11px;padding:5px 11px" onclick="aiAddKeyword()">+ Add</button>
              </div>
              <div class="ai-settings-note">* Changes apply on next Refresh</div>
            </div>
            <div class="ai-settings-section">
              <div class="ai-settings-section-title">
                GitHub Repos
                <span id="ai-repo-settings-count" style="font-size:11px;font-weight:400;color:var(--ai-text3)"></span>
              </div>
              <div class="ai-repo-settings-list" id="ai-repo-settings-list"></div>
              <div class="ai-add-repo-form">
                <label class="ai-form-label">owner / repo</label>
                <div class="ai-form-row">
                  <input class="ai-add-input" id="ai-new-repo-owner" placeholder="owner" style="flex:1">
                  <span>/</span>
                  <input class="ai-add-input" id="ai-new-repo-name" placeholder="repo" style="flex:1.4">
                </div>
                <label class="ai-form-label">Display label</label>
                <div class="ai-form-row">
                  <input class="ai-add-input" id="ai-new-repo-label" placeholder="e.g. MyProject" style="flex:1" onkeydown="if(event.key==='Enter')aiAddRepo()">
                  <button class="ai-btn ai-btn-primary" style="font-size:11px;padding:5px 11px;flex-shrink:0" onclick="aiAddRepo()">+ Add</button>
                </div>
                <div id="ai-add-repo-msg" style="font-size:11px;min-height:14px"></div>
              </div>
              <div class="ai-settings-note">* Newly added repos load on next Refresh</div>
            </div>
            <div class="ai-settings-section">
              <div class="ai-settings-section-title">API Settings</div>
              <label class="ai-form-label">GitHub Token <span style="font-weight:400">(optional — avoids 60 req/h rate limit)</span></label>
              <div class="ai-api-row" style="margin-bottom:10px">
                <input class="ai-add-input" id="ai-token-input" type="password" placeholder="ghp_xxxx…" style="flex:1">
              </div>
              <label class="ai-form-label">Max papers per keyword query</label>
              <div class="ai-api-row">
                <input class="ai-add-input" id="ai-max-results" type="number" min="3" max="25" value="8" style="width:70px">
                <button class="ai-btn ai-btn-primary" style="font-size:11px;padding:5px 11px" onclick="aiSaveApiSettings()">Save</button>
                <span id="ai-token-msg" style="font-size:11px"></span>
              </div>
              <div class="ai-settings-note">Token is stored only in your browser's localStorage and sent only to api.github.com.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

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
      </div>
    </div>
  </div>

</div>

<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
<script src="{{ '/assets/js/agents.js' | relative_url }}"></script>
<script src="{{ '/assets/js/aiinfra.js' | relative_url }}"></script>
