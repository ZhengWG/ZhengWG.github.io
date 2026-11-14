(() => {
  const root = document.querySelector('[data-comments]');
  if (!root) return;
  const server = root.dataset.server.replace(/\/$/, '');
  const path = decodeURIComponent(location.pathname).normalize('NFC');
  const form = root.querySelector('form'), input = form.querySelector('textarea'), submit = form.querySelector('[type=submit]');
  const status = root.querySelector('[role=status]'), list = root.querySelector('[data-comment-list]'), more = root.querySelector('[data-comment-more]'), cancel = root.querySelector('[data-comment-cancel]'), heading = root.querySelector('[data-comment-heading]');
  let comments = [], nextOffset = null, parentId = null, token = null, draft = null;
  const make = (tag, text, cls) => { const n = document.createElement(tag); if(text !== undefined) n.textContent=text; if(cls)n.className=cls; return n; };
  async function api(route, options) {
    const r = await fetch(server + route, { credentials:'omit', ...options });
    let d; try { d=await r.json(); } catch { throw new Error('评论服务暂时无法连接，请稍后重试。'); }
    if(!r.ok) throw new Error(d.error || '操作失败，请稍后重试。'); return d;
  }
  function resetReply(){parentId=null;cancel.hidden=true;heading.textContent='写下你的想法';}
  function render(){
    list.replaceChildren();const nodes=new Map();
    for(const item of comments){
      const a=make('article',undefined,'comment-item');a.id='comment-'+item.id;
      const meta=make('div',undefined,'comment-meta');meta.append(make('strong',item.author));
      const time=make('time',new Date(item.createdAt).toLocaleString('zh-CN',{dateStyle:'medium',timeStyle:'short'}));time.dateTime=new Date(item.createdAt).toISOString();meta.append(time);
      a.append(meta,make('p',item.content,'comment-text'));
      if(!item.deleted){const b=make('button','回复','comment-reply');b.type='button';b.addEventListener('click',()=>{parentId=item.id;cancel.hidden=false;heading.textContent='回复'+item.author;input.focus();});a.append(b);}
      nodes.set(item.id,a);
    }
    for(const item of comments){const n=nodes.get(item.id),p=item.parentId&&nodes.get(item.parentId);if(p){n.classList.add('comment-child');p.append(n);}else list.append(n);}
    more.hidden=nextOffset===null;
  }
  async function load(append=false){more.disabled=true;try{
    const d=await api('/api/comments?path='+encodeURIComponent(path)+'&offset='+(append?nextOffset:0));comments=append?[...comments,...d.comments]:d.comments;nextOffset=d.nextOffset;render();status.textContent=d.total?'共 '+d.total+' 条评论':'还没有评论，来聊聊吧。';
  }catch(e){status.textContent=e.message||'评论加载失败，请稍后重试。';}finally{more.disabled=false;}}
  more.addEventListener('click',()=>load(true));cancel.addEventListener('click',resetReply);
  form.addEventListener('submit',async event=>{
    event.preventDefault();const content=input.value.trim();if(!content){input.focus();return;}
    const signature=JSON.stringify([content,parentId]);if(draft!==signature){draft=signature;token=null;}
    submit.disabled=true;status.textContent='正在发送…';
    try{
      if(!token||token.expiresAt<=Date.now())token=await api('/api/session?path='+encodeURIComponent(path));
      const result=await api('/api/comments',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Comment '+token.token},body:JSON.stringify({path,content,parentId,website:form.elements.website.value})});
      input.value='';token=null;draft=null;resetReply();await load();
      if(!comments.some(item=>item.id===result.comment.id)){comments.push(result.comment);render();}
      status.textContent='已发送，谢谢你的留言。';
    }catch(e){status.textContent=e.message||'发送失败，请重试。';}finally{submit.disabled=false;}
  });load();
})();
