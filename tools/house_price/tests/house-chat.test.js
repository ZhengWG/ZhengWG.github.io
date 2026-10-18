const { test } = require('node:test');
const assert = require('node:assert/strict');
const { executeTool, historyResult, readStream, createSession, resolveModel } = require('../../../assets/js/house-chat.js');

const data = { city: '杭州', city_key: 'hz', updated_at: '2026-10-18', city_history: [], districts: {
  xihu: { name: '西湖区', history: [
    { date: '2025-09', second_hand_price: 40000, new_house_price: 60000 },
    { date: '2026-03', second_hand_price: 38000, new_house_price: 57000 },
    { date: '2026-09', second_hand_price: 36000, new_house_price: 54000 },
  ], communities: [
    { community: '西溪花园', price: 30000, source: 'gotohui', stale: true },
    { community: '西溪花园', price: 32000, source: 'fang', fetched_at: '2026-10-18', stale: false, listing_count: 8 },
  ] },
} };
function stream(events, tinyChunks = false) {
  const bytes = new TextEncoder().encode(events.map(e => `data: ${JSON.stringify(e)}\r\n\r\n`).join('') + 'data: [DONE]');
  return new Response(new ReadableStream({ start(controller) {
    if (tinyChunks) for (let i = 0; i < bytes.length; i += 2) controller.enqueue(bytes.slice(i, i + 2));
    else controller.enqueue(bytes);
    controller.close();
  } }));
}
const answer = text => stream([{ choices: [{ delta: { content: text }, finish_reason: 'stop' }] }]);

test('retired model settings migrate while explicit current models are preserved', () => {
  for (const model of [undefined, '', '  ', 'deepseek-chat', 'deepseek-reasoner']) {
    assert.equal(resolveModel(model), 'deepseek-flash');
  }
  assert.equal(resolveModel(' deepseek-v4-pro '), 'deepseek-v4-pro');
});

test('calendar gaps do not turn the previous observation into a monthly change', () => {
  const result = historyResult(data.districts.xihu.history, 'second_hand_price', 6);
  assert.equal(result.mom_pct, null);
  assert.equal(result.yoy_pct, -10);
  assert.equal(result.change_6m_pct, -5.26);
  assert.equal(result.rows.length, 1);
});
test('tools respect price type and reject unknown regions', () => {
  const result = executeTool('get_price_history', { district_keys: ['xihu'] }, data, { priceType: 'new_house_price' });
  assert.equal(result.series[0].latest, 54000);
  assert.throws(() => executeTool('get_price_history', { district_keys: ['no_such_region'] }, data));
  assert.throws(() => executeTool('get_price_history', { months: 10000 }, data));
  assert.throws(() => executeTool('run_code', {}, data));
  assert.equal(executeTool('search_communities', {}, data, { priceType: 'new_house_price' }).rows.length, 0);
});
test('community search keeps different sources, dates and missing fields distinct', () => {
  const result = executeTool('search_communities', { query: '西溪', min_price: 31000, max_price: 33000 }, data);
  assert.equal(result.total_matches, 1);
  assert.equal(result.rows[0].source, '房天下');
  assert.equal(result.rows[0].observed_month, null);
  assert.equal(result.rows[0].listing_count, 8);
});
test('monthly reports preserve provider definitions, dates, city scope and district gaps', () => {
  const reportData = { ...data, market_reports: [
    { source: 'creprice', date: '2026-09', price_kind: 'residential_report_average', city_metrics: { sale_price: 34529, rent_price: 55.16 },
      districts: { '西湖区': { rent_price: 54.93 }, '滨江区': { sale_price: 40100 } }, revisions: [{ privateAudit: true }] },
    { source: 'cih', date: '2026-09', price_kind: 'second_hand_listing_report', city_metrics: { transactions: 5077 }, districts: {} },
  ] };
  const result = executeTool('get_market_reports', { source: 'creprice', month: '2026-09', district_keys: ['xihu'] }, reportData, { priceType: 'new_house_price' });
  assert.equal(result.reports[0].price_kind, 'residential_report_average');
  assert.equal(result.reports[0].city_metrics.rent_price, 55.16);
  assert.deepEqual(result.reports[0].districts, { '西湖区': { rent_price: 54.93 } });
  assert.equal(result.reports[0].revisions, undefined);
  assert.equal(executeTool('get_market_reports', { month: '2025-01' }, reportData).reports.length, 0);
  assert.throws(() => executeTool('get_market_reports', { month: '2026-13' }, reportData));
  assert.throws(() => executeTool('get_market_reports', { limit: 1000 }, reportData));
});
test('SSE decoder handles UTF-8 split bytes, CRLF and fragmented tool arguments', async () => {
  const result = await readStream(stream([
    { choices: [{ delta: { content: '杭州', tool_calls: [{ index: 0, id: 'call_1', function: { name: 'get_price_history', arguments: '{"district_' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'keys":["xihu"]}' } }] }, finish_reason: 'tool_calls' }] },
  ], true));
  assert.equal(result.content, '杭州');
  assert.deepEqual(JSON.parse(result.tool_calls[0].function.arguments), { district_keys: ['xihu'] });
});
test('an interrupted stream is not accepted as a complete answer', async () => {
  await assert.rejects(readStream(new Response('data: {"choices":[{"delta":{"content":"partial"}}]}\n')), /提前中断/);
});
test('tool results and completed conversation are sent on the next turn', async () => {
  const requests = [];
  let type = 'second_hand_price';
  const session = createSession({ getData: () => data, getContext: () => ({ priceType: type, scope: 'xihu' }),
    getSettings: () => ({ apiKey: 'test-only', model: 'deepseek-chat' }), fetchImpl: async (_, options) => {
      requests.push(JSON.parse(options.body));
      if (requests.length === 1) return stream([{ choices: [{ delta: { tool_calls: [{ index: 0, id: 'query1', function: { name: 'get_price_history', arguments: '{"district_keys":["xihu"]}' } }] }, finish_reason: 'tool_calls' }] }]);
      return answer('基于查询数据作答');
    } });
  assert.equal(await session.send('西湖走势如何？'), true);
  assert.equal(requests[0].model, 'deepseek-flash');
  assert.deepEqual(requests[0].thinking, { type: 'disabled' });
  assert.equal(requests[1].messages.at(-1).role, 'tool');
  assert.equal(JSON.parse(requests[1].messages.at(-1).content).series[0].latest, 36000);
  type = 'new_house_price';
  assert.equal(await session.send('切换后呢？'), true);
  assert.ok(requests[2].messages.some(m => m.role === 'user' && m.content === '西湖走势如何？'));
  assert.match(requests[2].messages[0].content, /当前口径：新房/);
  assert.equal(session.turns.length, 2);
});
test('API failure, cancellation and new conversation do not leave unfinished turns', async () => {
  let mode = 'ok';
  const session = createSession({ getData: () => data, getContext: () => ({}), getSettings: () => ({ apiKey: 'test-only' }),
    fetchImpl: async (_, options) => {
      if (mode === 'error') return new Response('', { status: 401 });
      if (mode === 'abort') return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
      return answer('已完成');
    } });
  await session.send('第一问');
  mode = 'error'; assert.equal(await session.send('失败的问题'), false);
  assert.equal(session.turns.length, 1);
  mode = 'abort'; const pending = session.send('取消的问题'); session.stop();
  assert.equal(await pending, false); assert.equal(session.turns.length, 1);
  session.clear(); assert.equal(session.turns.length, 0);
});
