// AI Infra Tracker — client-side logic
// No YAML front matter: Jekyll serves this file as-is (no Liquid processing).
// Papers via Semantic Scholar API (CORS-enabled). GitHub via api.github.com.

(function () {

  // ── Defaults ──────────────────────────────────────────────────────────────
  var DEFAULTS = {
    queries: [
      "Eagle VLM inference",
      "LLM inference optimization",
      "low latency LLM inference",
      "quantization LLM inference",
      "multimodal model inference",
      "RL infrastructure LLM",
      "vLLM SGLang serving",
      "speculative decoding LLM",
      "FlashAttention kernel inference",
      "continuous batching LLM"
    ],
    repos: [
      { owner: "sgl-project",  repo: "sglang",   label: "SGLang"   },
      { owner: "vllm-project",  repo: "vllm",     label: "vLLM"     },
      { owner: "OpenRLHF",      repo: "OpenRLHF", label: "OpenRLHF" },
      { owner: "volcengine",    repo: "verl",      label: "Verl"     },
      { owner: "THUDM",         repo: "slime",     label: "Slime"    },
      { owner: "inclusionAI",   repo: "AReaL",     label: "AReaL"    }
    ],
    githubToken: "",
    maxResults: 8
  };

  // ── State ─────────────────────────────────────────────────────────────────
  var cfg         = loadCfg();
  var allPapers   = [];
  var translCache = {};
  var isLoading   = false;
  var translating = {};

  // ── Config (localStorage) ─────────────────────────────────────────────────
  function loadCfg() {
    try {
      var s = localStorage.getItem("aiinfra-v1");
      if (s) {
        var p = JSON.parse(s);
        return {
          queries:     p.queries     && p.queries.length     ? p.queries     : DEFAULTS.queries.slice(),
          repos:       p.repos       && p.repos.length       ? p.repos       : DEFAULTS.repos.slice(),
          githubToken: p.githubToken || "",
          maxResults:  p.maxResults  || 8
        };
      }
    } catch (e) {}
    return {
      queries:     DEFAULTS.queries.slice(),
      repos:       DEFAULTS.repos.slice(),
      githubToken: "",
      maxResults:  8
    };
  }

  function saveCfg() { localStorage.setItem("aiinfra-v1", JSON.stringify(cfg)); }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function esc(s) {
    return s ? String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
  }

  function fmt(n) {
    n = parseInt(n) || 0;
    return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
  }

  function labelStyle(label) {
    var map = {
      "roadmap": "#16a34a", "planning": "#7c3aed", "enhancement": "#2563eb",
      "feature": "#0891b2", "feature request": "#0891b2", "bug": "#dc2626",
      "good first issue": "#65a30d", "help wanted": "#d97706", "documentation": "#6b7280"
    };
    var k = label.toLowerCase();
    for (var kk in map) {
      if (k.indexOf(kk) !== -1)
        return "background:" + map[kk] + "22;color:" + map[kk] + ";border:1px solid " + map[kk] + "44";
    }
    return "background:#1d4ed820;color:#3b82f6;border:1px solid #1d4ed860";
  }

  function $(id) { return document.getElementById(id); }

  function setStatus(text, color) {
    var el = $("ai-status-text");
    if (!el) return;
    el.textContent = text;
    el.style.color = color || "";
  }

  // ── Paper fetch — Semantic Scholar (CORS-enabled) ─────────────────────────
  // Rate limit: ~1 req/s without API key. We stagger by 1200 ms between queries.
  async function fetchPapers() {
    var seenIds = {};
    var papers  = [];

    for (var i = 0; i < cfg.queries.length; i++) {
      if (i > 0) await sleep(1200);
      var query = cfg.queries[i];
      try {
        var url = "https://api.semanticscholar.org/graph/v1/paper/search"
          + "?query="  + encodeURIComponent(query)
          + "&fields=title,authors,abstract,year,publicationDate,externalIds,openAccessPdf,fieldsOfStudy"
          + "&limit="  + Math.min(cfg.maxResults, 20);

        var resp = await fetch(url, { signal: AbortSignal.timeout(25000) });

        if (resp.status === 429) {
          // Rate-limited: wait 5 s and retry once
          await sleep(5000);
          resp = await fetch(url, { signal: AbortSignal.timeout(25000) });
        }
        if (!resp.ok) { console.warn("S2 API", resp.status, "for:", query); continue; }

        var data  = await resp.json();
        var items = data.data || [];

        for (var j = 0; j < items.length; j++) {
          var p = items[j];
          if (!p.paperId || !p.title) continue;

          var arxivId  = (p.externalIds || {}).ArXiv || null;
          var dedupeId = arxivId || p.paperId;
          if (seenIds[dedupeId]) continue;
          seenIds[dedupeId] = true;

          var link    = arxivId
            ? "https://arxiv.org/abs/" + arxivId
            : "https://www.semanticscholar.org/paper/" + p.paperId;
          var pdfLink = (p.openAccessPdf && p.openAccessPdf.url)
            ? p.openAccessPdf.url
            : (arxivId ? "https://arxiv.org/pdf/" + arxivId : link);

          var authors = (p.authors || []).slice(0, 5)
            .map(function (a) { return a.name || ""; }).filter(Boolean);
          var date    = p.publicationDate || (p.year ? String(p.year) : "");

          papers.push({
            id:            dedupeId,
            title:         p.title,
            authors:       authors,
            abstract:      p.abstract || "(No abstract available)",
            date:          date,
            link:          link,
            pdf_link:      pdfLink,
            categories:    p.fieldsOfStudy || [],
            matched_query: query
          });
        }
      } catch (e) {
        console.warn("S2 fetch failed for:", query, e);
      }
    }

    papers.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return papers;
  }

  // ── GitHub fetch ──────────────────────────────────────────────────────────
  async function fetchRepo(owner, repo, label) {
    var h    = cfg.githubToken ? { Authorization: "Bearer " + cfg.githubToken } : {};
    var base = "https://api.github.com/repos/" + owner + "/" + repo;

    async function tryGet(url) {
      try {
        var r = await fetch(url, { headers: h, signal: AbortSignal.timeout(20000) });
        return r.ok ? r.json() : null;
      } catch (e) { return null; }
    }

    var res        = await Promise.all([
      tryGet(base),
      tryGet(base + "/releases/latest"),
      tryGet(base + "/milestones?state=open&sort=due_on&per_page=5"),
      tryGet(base + "/issues?state=open&sort=updated&per_page=15")
    ]);
    var info       = res[0], release = res[1], milestones = res[2], issues = res[3];

    return {
      owner:   owner, repo: repo, label: label,
      link:    "https://github.com/" + owner + "/" + repo,
      description:  info ? (info.description || "") : "",
      stars:        info ? (info.stargazers_count || 0) : 0,
      forks:        info ? (info.forks_count || 0) : 0,
      error:        info ? null : ("Could not load " + owner + "/" + repo + " — GitHub API rate limit? Add a token in Settings."),
      latest_release: (release && release.tag_name) ? {
        tag:  release.tag_name,
        name: release.name || release.tag_name,
        date: (release.published_at || "").slice(0, 10),
        url:  release.html_url,
        body: (release.body || "").slice(0, 800)
      } : null,
      milestones: Array.isArray(milestones) ? milestones.map(function (m) {
        return {
          title: m.title, description: (m.description || "").slice(0, 300),
          due_on: (m.due_on || "").slice(0, 10),
          open_issues: m.open_issues || 0, closed_issues: m.closed_issues || 0,
          url: m.html_url
        };
      }) : [],
      recent_issues: Array.isArray(issues)
        ? issues.filter(function (i) { return !i.pull_request; }).slice(0, 10)
            .map(function (i) {
              return {
                number: i.number, title: i.title,
                labels: (i.labels || []).map(function (l) { return l.name; }),
                updated_at: (i.updated_at || "").slice(0, 10),
                url: i.html_url, comments: i.comments || 0
              };
            })
        : []
    };
  }

  async function fetchAllRepos() {
    return Promise.all(cfg.repos.map(function (r) {
      return fetchRepo(r.owner, r.repo, r.label);
    }));
  }

  // ── Translation — MyMemory (CORS-enabled, 500 chars/chunk) ────────────────
  async function translateChunk(text) {
    var r = await fetch(
      "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=en|zh-CN",
      { signal: AbortSignal.timeout(15000) }
    );
    var d = await r.json();
    var t = (d && d.responseData && d.responseData.translatedText) || "";
    if (t && t.toUpperCase().indexOf("QUERY LENGTH LIMIT") === -1
           && t.toUpperCase().indexOf("MYMEMORY WARNING") === -1) return t;
    return text;
  }

  async function translateText(text) {
    if (!text) return "";
    var CHUNK = 480;
    var sents  = text.replace(/\. /g, ".\n").split("\n");
    var chunks = [], cur = "";
    for (var i = 0; i < sents.length; i++) {
      var joined = cur ? cur + " " + sents[i] : sents[i];
      if (joined.length <= CHUNK) { cur = joined; }
      else { if (cur) chunks.push(cur); cur = sents[i].slice(0, CHUNK); }
    }
    if (cur) chunks.push(cur);
    var parts = [];
    for (var j = 0; j < chunks.length; j++) {
      parts.push(await translateChunk(chunks[j]));
      if (chunks.length > 1) await sleep(300);
    }
    return parts.join(" ");
  }

  // ── Render: Papers ────────────────────────────────────────────────────────
  function filterPapers() {
    var q    = ($("ai-paper-filter") ? $("ai-paper-filter").value : "").toLowerCase().trim();
    var from = $("ai-date-from") ? $("ai-date-from").value : "";
    var to   = $("ai-date-to")   ? $("ai-date-to").value   : "";

    var filtered = allPapers.filter(function (p) {
      if (from && p.date && p.date < from) return false;
      if (to   && p.date && p.date > to)   return false;
      if (!q) return true;
      return p.title.toLowerCase().indexOf(q) !== -1
          || (p.authors || []).join(" ").toLowerCase().indexOf(q) !== -1
          || (p.matched_query || "").toLowerCase().indexOf(q) !== -1
          || (p.abstract || "").toLowerCase().indexOf(q) !== -1;
    });

    var cnt = $("ai-paper-count");
    if (cnt) cnt.textContent = filtered.length;
    renderPaperCards(filtered);
  }

  function renderPaperCards(papers) {
    var container = $("ai-papers-list");
    if (!container) return;
    if (!papers.length) {
      container.innerHTML = '<div class="ai-empty">No papers match the current filter.</div>';
      return;
    }
    var html = "";
    for (var i = 0; i < papers.length; i++) {
      var p    = papers[i];
      var ts   = translCache[p.id];
      var isZh = !!(ts && ts.showing);
      var title  = isZh ? esc(ts.titleZh)    : esc(p.title);
      var abstr  = isZh ? esc(ts.abstractZh) : esc(p.abstract);
      var pid    = p.id.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

      html += '<div class="ai-paper-card">';
      html += '<div class="ai-paper-meta">';
      html += '<span class="ai-date">' + (p.date || "–") + '</span>';
      if (p.matched_query) html += '<span class="ai-tag">' + esc(p.matched_query) + '</span>';
      var cats = (p.categories || []).slice(0, 2);
      for (var c = 0; c < cats.length; c++) html += '<span class="ai-tag ai-cat">' + esc(cats[c]) + '</span>';
      html += '</div>';
      html += '<div class="ai-paper-title"><a href="' + p.link + '" target="_blank" rel="noopener noreferrer">' + title + '</a></div>';
      var auStr = (p.authors || []).join(", ") + ((p.authors || []).length >= 5 ? " et al." : "");
      if (auStr) html += '<div class="ai-paper-authors">' + esc(auStr) + '</div>';
      html += '<div class="ai-abstract' + (isZh ? " expanded" : "") + '" id="ai-abs-' + i + '">' + abstr + '</div>';
      html += '<div class="ai-paper-actions">';
      html += '<button class="ai-link-btn" onclick="aiToggleEl(\'ai-abs-' + i + '\',this)">Show more</button>';
      html += '<a href="' + p.link + '" target="_blank" rel="noopener noreferrer" class="ai-link-btn">Abstract</a>';
      html += '<a href="' + p.pdf_link + '" target="_blank" rel="noopener noreferrer" class="ai-link-btn">PDF</a>';
      html += '<button class="ai-trans-btn' + (isZh ? " active" : "") + '" onclick="aiDoTranslate(' + i + ',\'' + pid + '\',' + isZh + ')">' + (isZh ? "EN" : "中文") + '</button>';
      html += '</div></div>';
    }
    container.innerHTML = html;
  }

  function toggleEl(id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("expanded");
    btn.textContent = el.classList.contains("expanded") ? "Show less" : "Show more";
  }

  async function doTranslate(idx, paperId, isZh) {
    if (isZh) {
      if (translCache[paperId]) translCache[paperId].showing = false;
      filterPapers(); return;
    }
    if (translCache[paperId] && translCache[paperId].titleZh) {
      translCache[paperId].showing = true;
      filterPapers(); return;
    }
    if (translating[paperId]) return;
    translating[paperId] = true;
    var paper = null;
    for (var k = 0; k < allPapers.length; k++) {
      if (allPapers[k].id === paperId) { paper = allPapers[k]; break; }
    }
    if (!paper) { delete translating[paperId]; return; }
    try {
      var titleZh    = await translateText(paper.title);
      var abstractZh = await translateText(paper.abstract.slice(0, 1500));
      translCache[paperId] = { titleZh: titleZh, abstractZh: abstractZh, showing: true };
      filterPapers();
    } catch (e) {
      console.error("Translation error:", e);
    } finally {
      delete translating[paperId];
    }
  }

  // ── Render: Repos ─────────────────────────────────────────────────────────
  function renderRepos(repos) {
    var cnt = $("ai-repo-count");
    if (cnt) cnt.textContent = repos.length;
    var br = $("ai-badge-repos");
    if (br) br.textContent = repos.length + " repos";
    var container = $("ai-repos-list");
    if (!container) return;
    if (!repos.length) {
      container.innerHTML = '<div class="ai-empty">No repos configured.</div>';
      return;
    }
    var html = "";
    for (var ri = 0; ri < repos.length; ri++) {
      var r = repos[ri];
      html += '<div class="ai-repo-card">';
      html += '<div class="ai-repo-header">';
      html += '<div class="ai-repo-header-left">';
      html += '<div class="ai-repo-name"><a href="' + r.link + '" target="_blank" rel="noopener noreferrer">' + esc(r.owner) + "/" + esc(r.repo) + '</a>';
      html += '<span class="ai-repo-label">' + esc(r.label) + '</span></div>';
      html += '<div class="ai-repo-desc">' + esc(r.description) + '</div></div>';
      html += '<div class="ai-repo-stats"><span class="ai-stat">&#9733;&nbsp;' + fmt(r.stars) + '</span><span class="ai-stat">&#9434;&nbsp;' + fmt(r.forks) + '</span></div>';
      html += '</div><div class="ai-repo-body">';
      if (r.error) html += '<div class="ai-error-banner">' + esc(r.error) + '</div>';
      if (r.latest_release) {
        var rel = r.latest_release;
        html += '<div class="ai-section"><div class="ai-section-label">Latest Release</div><div class="ai-release-card">';
        html += '<div class="ai-release-tag">' + esc(rel.tag) + '</div>';
        html += '<div class="ai-release-date">' + rel.date + ' &middot; <a href="' + rel.url + '" target="_blank" rel="noopener noreferrer">View on GitHub</a></div>';
        if (rel.body) {
          html += '<div class="ai-release-body" id="ai-rel-' + ri + '">' + esc(rel.body) + '</div>';
          html += '<button class="ai-link-btn" onclick="aiToggleEl(\'ai-rel-' + ri + '\',this)">Show more</button>';
        }
        html += '</div></div>';
      }
      if ((r.milestones || []).length) {
        html += '<div class="ai-section"><div class="ai-section-label">Roadmap</div>';
        for (var mi = 0; mi < r.milestones.length; mi++) {
          var m   = r.milestones[mi];
          var tot = (m.open_issues || 0) + (m.closed_issues || 0);
          var pct = tot > 0 ? Math.round(m.closed_issues / tot * 100) : 0;
          html += '<div class="ai-milestone"><div class="ai-ms-icon">&#9678;</div><div class="ai-ms-body">';
          html += '<div class="ai-ms-title"><a href="' + m.url + '" target="_blank" rel="noopener noreferrer">' + esc(m.title) + '</a></div>';
          if (m.description) html += '<div class="ai-ms-desc">' + esc(m.description) + '</div>';
          html += '<div class="ai-ms-meta">' + (m.due_on ? "Due " + m.due_on + " &middot; " : "") + m.open_issues + " open &middot; " + m.closed_issues + " closed</div>";
          if (tot > 0) html += '<div class="ai-progress"><div class="ai-progress-fill" style="width:' + pct + '%"></div></div>';
          html += '</div></div>';
        }
        html += '</div>';
      }
      if ((r.recent_issues || []).length) {
        html += '<div class="ai-section"><div class="ai-section-label">Recent Issues</div>';
        var iss = r.recent_issues.slice(0, 8);
        for (var ii = 0; ii < iss.length; ii++) {
          var issue = iss[ii];
          html += '<div class="ai-issue"><span class="ai-issue-num">#' + issue.number + '</span><div class="ai-issue-body">';
          html += '<div><a href="' + issue.url + '" target="_blank" rel="noopener noreferrer">' + esc(issue.title) + '</a></div>';
          if (issue.labels && issue.labels.length) {
            html += '<div class="ai-issue-labels">';
            var lbls = issue.labels.slice(0, 4);
            for (var li = 0; li < lbls.length; li++)
              html += '<span class="ai-issue-label" style="' + labelStyle(lbls[li]) + '">' + esc(lbls[li]) + '</span>';
            html += '</div>';
          }
          html += '<div class="ai-issue-meta">Updated ' + issue.updated_at + ' &middot; ' + issue.comments + ' comments</div>';
          html += '</div></div>';
        }
        html += '</div>';
      }
      html += '</div></div>';
    }
    container.innerHTML = html;
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  function openSettings() {
    renderKwList(); renderRepoSettingsList();
    var ti = $("ai-token-input");   if (ti) ti.value = cfg.githubToken || "";
    var mr = $("ai-max-results");   if (mr) mr.value = cfg.maxResults  || 8;
    var ov = $("ai-settings-overlay"); if (ov) ov.classList.add("open");
  }

  function closeSettings() {
    var ov = $("ai-settings-overlay"); if (ov) ov.classList.remove("open");
  }

  function renderKwList() {
    var el = $("ai-kw-list"); if (!el) return;
    var html = "";
    for (var i = 0; i < cfg.queries.length; i++)
      html += '<div class="ai-kw-item"><span class="ai-kw-text">' + esc(cfg.queries[i]) + '</span>'
            + '<button class="ai-del-btn" onclick="aiDeleteKeyword(' + i + ')">&#10005;</button></div>';
    el.innerHTML = html;
    var cnt = $("ai-kw-count"); if (cnt) cnt.textContent = "(" + cfg.queries.length + ")";
  }

  function deleteKeyword(i)  { cfg.queries.splice(i, 1); saveCfg(); renderKwList(); }

  function addKeyword() {
    var inp = $("ai-new-kw"); if (!inp) return;
    var val = inp.value.trim(); if (!val) return;
    cfg.queries.push(val); saveCfg(); inp.value = ""; renderKwList();
  }

  function renderRepoSettingsList() {
    var el = $("ai-repo-settings-list"); if (!el) return;
    var html = "";
    for (var i = 0; i < cfg.repos.length; i++) {
      var r = cfg.repos[i];
      html += '<div class="ai-repo-settings-item"><div><div class="ai-rs-name">' + esc(r.owner) + "/" + esc(r.repo) + '</div>'
            + '<div class="ai-rs-label">' + esc(r.label) + '</div></div>'
            + '<button class="ai-del-btn" onclick="aiDeleteRepo(' + i + ')">&#10005;</button></div>';
    }
    el.innerHTML = html;
    var cnt = $("ai-repo-settings-count"); if (cnt) cnt.textContent = "(" + cfg.repos.length + ")";
  }

  function deleteRepo(i) { cfg.repos.splice(i, 1); saveCfg(); renderRepoSettingsList(); }

  function addRepo() {
    var owner = ($("ai-new-repo-owner") ? $("ai-new-repo-owner").value : "").trim();
    var repo  = ($("ai-new-repo-name")  ? $("ai-new-repo-name").value  : "").trim();
    var label = ($("ai-new-repo-label") ? $("ai-new-repo-label").value : "").trim() || repo;
    var msg   = $("ai-add-repo-msg");
    if (!owner || !repo) {
      if (msg) { msg.style.color = "var(--ai-red)"; msg.textContent = "owner and repo are required"; } return;
    }
    for (var k = 0; k < cfg.repos.length; k++) {
      if (cfg.repos[k].owner === owner && cfg.repos[k].repo === repo) {
        if (msg) { msg.style.color = "var(--ai-red)"; msg.textContent = "Already in list"; } return;
      }
    }
    cfg.repos.push({ owner: owner, repo: repo, label: label }); saveCfg();
    if ($("ai-new-repo-owner")) $("ai-new-repo-owner").value = "";
    if ($("ai-new-repo-name"))  $("ai-new-repo-name").value  = "";
    if ($("ai-new-repo-label")) $("ai-new-repo-label").value = "";
    if (msg) { msg.style.color = "var(--ai-green)"; msg.textContent = "Added — click Refresh to load."; }
    renderRepoSettingsList();
    setTimeout(function () { if (msg) msg.textContent = ""; }, 3000);
  }

  function saveApiSettings() {
    cfg.githubToken = ($("ai-token-input") ? $("ai-token-input").value : "").trim();
    cfg.maxResults  = parseInt($("ai-max-results") ? $("ai-max-results").value : 8) || 8;
    saveCfg();
    var msg = $("ai-token-msg");
    if (msg) { msg.style.color = "var(--ai-green)"; msg.textContent = "Saved!"; }
    setTimeout(function () { if (msg) msg.textContent = ""; }, 2000);
  }

  // ── Main refresh — repos and papers update independently ──────────────────
  async function doRefresh() {
    if (isLoading) return;
    isLoading = true;

    var btn  = $("ai-refresh-btn");
    var icon = $("ai-refresh-icon");
    if (btn)  { btn.disabled = true; btn.classList.add("loading"); }
    if (icon) icon.classList.add("ai-spinning");
    setStatus("Fetching data…");

    // Reset both lists to loading state
    var plist = $("ai-papers-list");
    var rlist = $("ai-repos-list");
    if (plist) plist.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div><p>Fetching papers from Semantic Scholar…</p></div>';
    if (rlist) rlist.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div><p>Fetching GitHub repo data…</p></div>';

    var paperCount = 0;
    var repoCount  = 0;

    // Repos: update UI as soon as they finish (no sequential delay)
    var reposPromise = fetchAllRepos().then(function (repos) {
      repoCount = repos.length;
      renderRepos(repos);
      setStatus("Repos loaded · papers still loading…");
    }).catch(function (e) {
      if (rlist) rlist.innerHTML = '<div class="ai-error-banner">Failed to fetch repos: ' + esc(String(e)) + '</div>';
    });

    // Papers: sequential S2 queries with delays; update UI when done
    var papersPromise = fetchPapers().then(function (papers) {
      paperCount = papers.length;
      allPapers  = papers;
      translCache = {};
      filterPapers();
      var bp = $("ai-badge-papers");
      if (bp) bp.textContent = papers.length + " papers";
    }).catch(function (e) {
      if (plist) plist.innerHTML = '<div class="ai-error-banner">Failed to fetch papers: ' + esc(String(e)) + '</div>';
    });

    await Promise.all([reposPromise, papersPromise]);

    setStatus(paperCount + " papers · " + repoCount + " repos");
    var lu = $("ai-last-updated");
    if (lu) lu.textContent = "Updated just now";
    if (btn)  { btn.disabled = false; btn.classList.remove("loading"); }
    if (icon) icon.classList.remove("ai-spinning");
    isLoading = false;
  }

  // ── Public API (called from inline onclick handlers) ──────────────────────
  window.aiDoRefresh       = doRefresh;
  window.aiOpenSettings    = openSettings;
  window.aiCloseSettings   = closeSettings;
  window.aiOverlayClick    = function (e) { if (e.target && e.target.id === "ai-settings-overlay") closeSettings(); };
  window.aiToggleEl        = toggleEl;
  window.aiDoTranslate     = doTranslate;
  window.aiFilterPapers    = filterPapers;
  window.aiDeleteKeyword   = deleteKeyword;
  window.aiAddKeyword      = addKeyword;
  window.aiDeleteRepo      = deleteRepo;
  window.aiAddRepo         = addRepo;
  window.aiSaveApiSettings = saveApiSettings;

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("ai-tracker")) doRefresh();
  });

})();
