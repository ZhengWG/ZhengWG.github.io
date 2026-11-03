/* Interactive tools shared by the lab preview and future Jekyll pages. */
(function (root) {
  'use strict';
  const copy = {
    zh: {
      loading:'正在加载数据…', error:'数据加载失败，请重试。', retry:'重新加载', all:'全部', search:'搜索',
      date:'日报日期', section:'主题', repo:'仓库', sources:'信息来源', reports:'份日报', tracked:'个跟踪仓库',
      snapshot:'日报快照', original:'日报摘要保留中文原文；来源链接可直接查看。',
      stale:'当前快照已超过两天，等待下一次同步。', items:'条内容', empty:'没有找到匹配内容。',
      query:'搜索标题、关键词或链接…', sourceTitle:'核心盘与拓源', repoTitle:'跟踪仓库', blogTitle:'博客与 RSS',
      pipeline:'公开源采集 → 跨天去重 → 分类整理 → 新方向发现 → 日报归档',
      sourceNote:'另含 arXiv、Hugging Face Papers、Hacker News、Reddit 与 LMSYS。网页展示已同步的日报，原始来源可从条目链接核对。',
      published:'数据发布', asOf:'价格统计期', region:'区域', city:'杭州全市', price:'价格口径', second:'二手房', fresh:'本次采集',
      newHouse:'新房', unit:'元/㎡', latest:'最新均价', mom:'月度变化', yoy:'年度变化', history:'月度历史',
      historyNote:'城市和区域均价使用同一历史口径；缺失月份留空。小区价格为挂牌参考样本，不能当作成交价。',
      district:'区域对比', communities:'小区样本', community:'小区', priceLabel:'参考价', source:'来源', period:'统计月份',
      carried:'沿用旧值', sourceUnknown:'统计期未提供', complete:'本次报价', previous:'上一页', next:'下一页',
      minimum:'最低价', maximum:'最高价', table:'查看历史数据表', quality:'数据来源与采集状态',
      qualityNote:'采集降级时保留旧值。数据发布日期与价格统计期不同；各来源独立保存。',
      status:{active:'可用',degraded:'采集降级',sampled:'抽样',snapshot:'快照',estimated:'估算',unavailable:'不可用',unknown:'未知'},
      chat:'房价对话', key:'DeepSeek API Key', keyNote:'Key 仅保存在当前浏览器，发起提问时发送至 DeepSeek。数据浏览无需 Key。',
      save:'保存配置', saved:'已保存', ask:'查询数据、比较区域，或连续追问…', send:'发送', stop:'停止', clear:'新对话',
      you:'你', assistant:'助手', ready:'可连续追问。Enter 发送，Shift+Enter 换行。', busy:'正在查询…',
      omitted:'较早的对话已移出上下文；请重述仍需保留的条件。', noKey:'请先填写 API Key。',
      chatError:'请求失败，请检查 API Key 或网络后重试。', noPrice:'该口径没有有效价格数据。',
      range:'条样本', districtOriginal:'区域、小区名称与来源名称保留原文。',
    },
    en: {
      loading:'Loading data…', error:'Could not load the data. Please try again.', retry:'Reload data', all:'All', search:'Search',
      date:'Report date', section:'Topic', repo:'Repository', sources:'Sources', reports:'reports', tracked:'tracked repositories',
      snapshot:'Report snapshot', original:'Report summaries remain in their original Chinese. Follow the source links for details.',
      stale:'This snapshot is over two days old and awaits the next sync.', items:'items', empty:'No matching content.',
      query:'Search titles, keywords, or links…', sourceTitle:'Core sources & discovery', repoTitle:'Tracked repositories', blogTitle:'Blogs & RSS',
      pipeline:'Public sources → Deduplication → Classification → Discovery → Report archive',
      sourceNote:'Also covers arXiv, Hugging Face Papers, Hacker News, Reddit, and LMSYS. This page displays synced reports; each item links to its original source.',
      published:'Data published', asOf:'Price period', region:'Region', city:'Hangzhou · all districts', price:'Price series', second:'Resale homes', fresh:'Collected this run',
      newHouse:'New homes', unit:'CNY/m²', latest:'Latest average', mom:'Monthly change', yoy:'Yearly change', history:'Monthly history',
      historyNote:'City and district averages use the same historical series; missing months remain empty. Community prices are listing reference samples, rather than transaction prices.',
      district:'District comparison', communities:'Community samples', community:'Community', priceLabel:'Reference price', source:'Source', period:'Price month',
      carried:'Carried forward', sourceUnknown:'Period not supplied', complete:'Collected this run', previous:'Previous', next:'Next',
      minimum:'Minimum price', maximum:'Maximum price', table:'View historical data table', quality:'Sources & collection status',
      qualityNote:'Previous values are retained when collection degrades. Publication date and price period differ; sources remain separate.',
      status:{active:'Available',degraded:'Degraded',sampled:'Sampled',snapshot:'Snapshot',estimated:'Estimated',unavailable:'Unavailable',unknown:'Unknown'},
      chat:'Ask about the data', key:'DeepSeek API Key', keyNote:'Your key stays in this browser and is sent to DeepSeek when you ask a question. Browsing data needs no key.',
      save:'Save settings', saved:'Saved', ask:'Query the data, compare districts, or ask a follow-up…', send:'Send', stop:'Stop', clear:'New conversation',
      you:'You', assistant:'Assistant', ready:'Follow-up questions supported. Enter to send; Shift+Enter for a new line.', busy:'Querying the data…',
      omitted:'Earlier conversation turns were removed from context. Please restate any relevant constraints.', noKey:'Enter an API key first.',
      chatError:'The request failed. Check the API key or network and try again.', noPrice:'No valid prices for this series.',
      range:'samples', districtOriginal:'District, community, and source names remain in their original language.',
    }
  };
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function control(text, input) {
    const label = el('label', null, 'lab-field');
    label.append(el('span', text), input);
    return label;
  }
  function select(values, value) {
    const input = el('select');
    values.forEach(([key, label]) => { const option = el('option', label); option.value = key; input.append(option); });
    input.value = value;
    return input;
  }
  function button(text, action) {
    const node = el('button', text, 'lab-button'); node.type = 'button'; node.addEventListener('click', action); return node;
  }
  function external(text, url) {
    const a = el('a', text);
    if (/^https?:\/\//i.test(url)) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function inline(text) {
    const node = el('span');
    const parts = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
    let previous = 0;
    for (const match of text.matchAll(parts)) {
      node.append(document.createTextNode(text.slice(previous, match.index)));
      node.append(match[1] ? external(match[1], match[2]) : el(match[3] ? 'strong' : 'code', match[3] || match[4]));
      previous = match.index + match[0].length;
    }
    node.append(document.createTextNode(text.slice(previous)));
    return node;
  }
  async function json(url) {
    const response = await fetch(url, {cache:'no-cache'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  function table(headers, rows) {
    const wrap = el('div', null, 'lab-table'); wrap.tabIndex = 0;
    const node = el('table'), head = el('tr'), body = el('tbody');
    headers.forEach(label => {const th = el('th', label); th.scope = 'col'; head.append(th);});
    const thead = el('thead'); thead.append(head); node.append(thead, body);
    rows.forEach(row => {const tr = el('tr'); row.forEach(value => tr.append(el('td', value))); body.append(tr);});
    wrap.append(node); return wrap;
  }
  function patchURL(values) {
    const url = new URL(location.href);
    Object.entries(values).forEach(([key,value]) => value ? url.searchParams.set(key,value) : url.searchParams.delete(key));
    history.replaceState(null, '', url);
  }
  async function tracker(root, lang, labels, params) {
    const index = await json('assets/data/ai_infra/index.json');
    const stats = el('div', null, 'lab-stats');
    for (const [value,label] of [[index.latest, labels.snapshot],[index.reports.length, labels.reports],[index.repos.length, labels.tracked]]) {
      const cell = el('div'); cell.append(el('strong', value), el('span',label)); stats.append(cell);
    }
    root.replaceChildren(stats);
    root.append(el('p', labels.original, 'lab-note'));
    if (Date.now() - Date.parse(index.latest + 'T00:00:00Z') > 3 * 86400000) root.append(el('p', labels.stale, 'lab-note'));
    const toolbar = el('div', null, 'lab-controls');
    const date = select(index.reports.map(r => [r.date,r.date]), index.reports.some(r => r.date === params.get('date')) ? params.get('date') : index.latest);
    const section = select([['',labels.all]], ''), repo = select([['',labels.all],...index.repos.map(r=>[r.repo,r.repo])], params.get('repo') || '');
    const search = el('input'); search.type='search'; search.placeholder=labels.query; search.value=params.get('q') || '';
    toolbar.append(control(labels.date,date),control(labels.section,section),control(labels.repo,repo),control(labels.search,search));
    const count = el('p', '', 'lab-note'); count.setAttribute('role','status');
    const feed = el('div', null, 'lab-feed');
    root.append(toolbar,count,feed);
    const sources = el('details', null, 'lab-sources'); sources.append(el('summary',labels.sourceTitle),el('p',labels.pipeline),el('p',labels.sourceNote));
    sources.append(el('h3',labels.repoTitle));
    const repositories = el('div',null,'lab-source-links');
    index.repos.forEach(r=>repositories.append(external(r.repo,'https://github.com/'+r.repo)));
    sources.append(repositories,el('h3',labels.blogTitle));
    const blogs = el('div',null,'lab-source-links'); index.feeds.forEach(f=>blogs.append(external(f.name,f.url))); sources.append(blogs); root.append(sources);
    let report, version=0;
    function render() {
      feed.replaceChildren(); let matches=0;
      const query=search.value.trim().toLowerCase();
      for (const item of report.sections) {
        if (section.value && section.value!==item.id) continue;
        const blocks=item.blocks.filter(text=>(!query || text.toLowerCase().includes(query)) && (!repo.value || text.toLowerCase().includes(repo.value.toLowerCase())));
        if (!blocks.length) continue;
        matches+=blocks.length;
        const group=el('section',null,'lab-report-section'); group.append(el('h2',item.title[lang]));
        blocks.forEach(text=>{const p=el('p'); p.lang='zh-Hans'; p.append(inline(text)); group.append(p);}); feed.append(group);
      }
      count.textContent=`${date.value} · ${matches} ${labels.items}`;
      if (!matches) feed.append(el('p',labels.empty,'lab-empty'));
      patchURL({date:date.value,section:section.value,repo:repo.value,q:search.value});
    }
    async function load() {
      const current=++version; feed.textContent=labels.loading;
      try {
        const record=index.reports.find(r=>r.date===date.value);
        const data=await json('assets/data/ai_infra/'+record.file);
        if (current!==version) return;
        report=data; const previous=section.value || params.get('section') || '';
        const choices=select([['',labels.all],...data.sections.map(s=>[s.id,s.title[lang]])],previous);
        section.replaceChildren(...choices.childNodes); section.value=choices.value || '';
        if (![...section.options].some(o=>o.value===previous)) section.value=''; else section.value=previous;
        render();
      } catch (_) {if(current===version) {feed.replaceChildren(el('p',labels.error),button(labels.retry,load));}}
    }
    date.addEventListener('change',load);
    for(const input of [section,repo,search]) input.addEventListener('input',()=>{if(report) render();});
    await load();
  }
  function chart(rows, field, label) {
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 900 270'); svg.setAttribute('role','img'); svg.setAttribute('aria-label',label); svg.classList.add('lab-chart');
    const title=document.createElementNS(ns,'title'); title.textContent=label; svg.append(title);
    const valid=rows.filter(r=>r[field]!=null && Number.isFinite(r[field])); if(!valid.length) return svg;
    const min=Math.min(...valid.map(r=>r[field]))*.95,max=Math.max(...valid.map(r=>r[field]))*1.05;
    const month=date=>Number(date.slice(0,4))*12+Number(date.slice(5,7)); const first=month(rows[0].date),last=month(rows[rows.length-1].date);
    const x=r=>70+(month(r.date)-first)/Math.max(1,last-first)*800,y=v=>220-(v-min)/Math.max(1,max-min)*190;
    function add(tag,attrs,text) {const node=document.createElementNS(ns,tag); for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v); if(text)node.textContent=text; svg.append(node);}
    for(let i=0;i<4;i++) {const v=min+(max-min)*i/3;add('line',{x1:70,x2:870,y1:y(v),y2:y(v),stroke:'var(--rule)'});add('text',{x:60,y:y(v)+4,'text-anchor':'end',fill:'var(--muted)','font-size':12},Math.round(v).toLocaleString());}
    let path='',previous=null;
    for(const r of valid) {path+=(previous!=null && month(r.date)===previous+1 ? ' L':' M')+x(r)+','+y(r[field]); previous=month(r.date);}
    add('path',{d:path,fill:'none',stroke:'var(--accent)','stroke-width':2.5});
    for(const r of [rows[0],rows[rows.length-1]])add('text',{x:x(r),y:250,'text-anchor':'middle',fill:'var(--muted)','font-size':12},r.date);
    return svg;
  }
  async function housing(root, lang, t, params) {
    const data=await json('assets/data/house_price/hz.json');
    const format=value=>value==null ? '—' : Number(value).toLocaleString(lang==='en'?'en-GB':'zh-CN',{maximumFractionDigits:0});
    const percent=value=>value==null ? '—' : `${value>0?'+':''}${value.toFixed(2)}%`;
    root.replaceChildren(el('p',`${t.published}: ${data.updated_at} · ${t.districtOriginal}`,'lab-note'));
    const controls=el('div',null,'lab-controls');
    const district=select([['',t.city],...Object.entries(data.districts).map(([key,d])=>[key,d.name])],params.get('district')||'');
    if(!district.value) district.value='';
    const field=select([['second_hand_price',t.second],['new_house_price',t.newHouse]],params.get('price')==='new_house_price'?'new_house_price':'second_hand_price');
    controls.append(control(t.region,district),control(t.price,field)); root.append(controls);
    const metrics=el('div',null,'lab-stats'), timeline=el('section'), comparison=el('section'), samples=el('section');
    root.append(metrics,timeline,comparison,samples);
    const sources=el('details',null,'lab-sources');sources.append(el('summary',t.quality),el('p',t.qualityNote));
    sources.append(table([t.source,t.section,t.sources],data.meta.sources.map(s=>[s.name,lang==='en'?s.role.replace(/[^\x00-\x7F]/g,'').trim()||'Public housing data':s.role,t.status[s.status]||t.status.unknown])));
    root.append(sources);
    const search=el('input');search.type='search';search.placeholder=t.community;search.value=params.get('q')||'';
    const minimum=el('input');minimum.type='number';minimum.min='0';minimum.placeholder=t.minimum;
    const maximum=el('input');maximum.type='number';maximum.min='0';maximum.placeholder=t.maximum;
    let page=0,chat;
    function renderSamples() {
      samples.replaceChildren(el('h2',t.communities));
      const filters=el('div',null,'lab-controls'); filters.append(control(t.search,search),control(t.minimum,minimum),control(t.maximum,maximum));samples.append(filters);
      const entries=Object.entries(data.districts).filter(([key])=>!district.value||key===district.value).flatMap(([,d])=>d.communities.map(c=>({...c,district:d.name})));
      const rows=entries.filter(c=>(!search.value||c.community.toLowerCase().includes(search.value.toLowerCase())) && (!minimum.value || (c.price!=null&&c.price>=Number(minimum.value))) && (!maximum.value || (c.price!=null&&c.price<=Number(maximum.value)))).sort((a,b)=>(b.price??-1)-(a.price??-1));
      const pages=Math.max(1,Math.ceil(rows.length/25));page=Math.min(page,pages-1);
      samples.append(el('p',`${rows.length} ${t.range} · ${t.priceLabel} (${t.unit})`,'lab-note'));
      if(!rows.length) samples.append(el('p',t.empty));
      else samples.append(table([t.community,t.region,t.priceLabel,t.source,t.period,t.sources],rows.slice(page*25,(page+1)*25).map(c=>[c.community,c.district,format(c.price),({gotohui:'聚汇',fang:'房天下',local_json:'Local JSON'})[c.source]||c.source||'—',c.price_date||c.date||t.sourceUnknown,c.stale?t.carried:t.complete])));
      const paging=el('div',null,'lab-pagination'),prev=button(t.previous,()=>{page--;renderSamples();}),next=button(t.next,()=>{page++;renderSamples();});
      prev.disabled=page===0;next.disabled=page+1>=pages;paging.append(prev,el('span',`${page+1} / ${pages}`),next);samples.append(paging);
      patchURL({district:district.value,price:field.value,q:search.value});
    }
    function render() {
      const rows=(district.value?data.districts[district.value].history:data.city_history).slice().sort((a,b)=>a.date.localeCompare(b.date));
      const result=HouseChat.historyResult(rows,field.value,240);metrics.replaceChildren();
      for(const [value,label]of [[format(result.latest),`${t.latest} · ${t.unit}`],[result.as_of||'—',t.asOf],[percent(result.mom_pct),t.mom],[percent(result.yoy_pct),t.yoy]]) {const cell=el('div');cell.append(el('strong',value),el('span',label));metrics.append(cell);}
      timeline.replaceChildren(el('h2',t.history),el('p',t.historyNote,'lab-note'));
      if(result.latest==null)timeline.append(el('p',t.noPrice));else timeline.append(chart(rows,field.value,`${district.value?data.districts[district.value].name:t.city} · ${t.history} · ${t.unit}`));
      const details=el('details');details.append(el('summary',t.table),table([t.period,t.priceLabel+' ('+t.unit+')'],rows.map(r=>[r.date,format(r[field.value])])));timeline.append(details);
      const districts=Object.values(data.districts).map(d=>({name:d.name,...HouseChat.historyResult(d.history,field.value,1)})).sort((a,b)=>(b.latest??-1)-(a.latest??-1));
      comparison.replaceChildren(el('h2',t.district),table([t.region,t.latest+' ('+t.unit+')',t.asOf,t.mom,t.yoy],districts.map(d=>[d.name,format(d.latest),d.as_of||'—',percent(d.mom_pct),percent(d.yoy_pct)])));
      renderSamples();if(chat?.busy)chat.stop();
    }
    for(const input of [district,field])input.addEventListener('change',()=>{page=0;render();});
    for(const input of [search,minimum,maximum])input.addEventListener('input',()=>{page=0;const position=input.selectionStart;renderSamples();input.focus();if(input.type==='search')input.setSelectionRange(position,position);});
    render();
    const chatRoot=el('section',null,'lab-chat');chatRoot.append(el('h2',t.chat));
    const settings=el('details');settings.append(el('summary',t.key));
    const key=el('input');key.type='password';key.autocomplete='off';key.placeholder='sk-…';try{key.value=localStorage.getItem('ag_api_key')||'';}catch(_){}
    const saved=el('span');settings.append(control(t.key,key),el('p',t.keyNote,'lab-note'),button(t.save,()=>{try{localStorage.setItem('ag_api_key',key.value.trim());saved.textContent=t.saved;}catch(_){saved.textContent=t.chatError;}}),saved);
    const messages=el('div',null,'lab-chat-messages');messages.setAttribute('role','log');messages.setAttribute('aria-label',t.chat);
    const form=el('form'),input=el('textarea');input.placeholder=t.ask;input.setAttribute('aria-label',t.ask);input.maxLength=4000;input.rows=3;
    const status=el('p',t.ready,'lab-note');status.setAttribute('role','status');
    const submit=el('button',t.send,'lab-button');submit.type='submit';const stop=button(t.stop,()=>chat.stop()),clear=button(t.clear,()=>chat.clear());stop.hidden=true;
    const actions=el('div',null,'lab-pagination');actions.append(submit,stop,clear);form.append(input,actions);chatRoot.append(settings,messages,form,status);root.append(chatRoot);
    chat=HouseChat.createSession({getData:()=>data,getContext:()=>({priceType:field.value,scope:district.value||'all',language:lang}),getSettings:()=>({apiKey:key.value.trim(),model:'deepseek-flash'}),onUpdate:state=>{
      messages.replaceChildren();state.entries.forEach(entry=>{const row=el('div',null,'lab-message');row.append(el('small',entry.role==='user'?t.you:t.assistant));const text=el('p');text.append(inline(entry.state==='error' && lang==='en'?t.chatError:entry.text||t.busy));row.append(text);messages.append(row);});
      submit.disabled=state.busy;clear.disabled=state.busy;stop.hidden=!state.busy;status.textContent=state.busy?t.busy:state.omitted?t.omitted:t.ready;
    }});
    form.addEventListener('submit',async event=>{event.preventDefault();if(!key.value.trim()){settings.open=true;key.focus();status.textContent=t.noKey;return;}try{const question=input.value;if(await chat.send(question))input.value='';}catch(error){status.textContent=lang==='en'?t.chatError:error.message;}});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();if(!chat.busy)form.requestSubmit();}});
    addEventListener('pagehide',()=>chat.stop(),{once:true});
  }
  async function mount(root,{tool,language='zh',params=new URLSearchParams(location.search)}) {
    const t=copy[language];root.classList.add('lab-tool');root.textContent=t.loading;
    try {await (tool==='house-price'?housing(root,language,t,params):tracker(root,language,t,params));}
    catch(error) {console.error(error);root.replaceChildren(el('p',t.error),button(t.retry,()=>mount(root,{tool,language,params})));}
  }
  root.LabTools={mount};
})(globalThis);
