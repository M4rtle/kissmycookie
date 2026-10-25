// Pages Functions: only /api/wishlist/* invokes the backend.
const products = new Set([
  'macaron:speculaas','macaron:red-velvet','macaron:creme-brulee','macaron:hazelnoot',
  'macaron:bounty','macaron:lion','macaron:oreo','macaron:pecan-pie','macaron:brownie',
  'macaron:brownie-original','macaron:chunky-monkey','macaron:tiramisu','macaron:aardbei',
  'macaron:citroen','macaron:pistache','macaron:dubai-pistache',
  'sweet:brownies','sweet:salted-brownie-cookie','sweet:pecan-pie','sweet:koekjes','sweet:cupcakes'
]);
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
const hash = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2,'0')).join('');
async function authorized(request, env) {
  const supplied = request.headers.get('Authorization') || '';
  if (!env.WISHLIST_ADMIN_KEY || env.WISHLIST_ADMIN_KEY.length < 43 || !/^Bearer [A-Za-z0-9_-]{43,128}$/.test(supplied)) return false;
  const [a,b] = await Promise.all([hash(supplied.slice(7)),hash(env.WISHLIST_ADMIN_KEY)]);
  let difference = 0;
  for (let i=0; i<a.length; i++) difference |= a[i]^b[i];
  return difference === 0;
}
async function bodyOf(request, limit = 2048) {
  // Do not trust Content-Length: bound even chunked bodies.
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  let size = 0, chunks = [];
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new Error('body'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2199-12-31') return false;
  const date = new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
};
const validSchedule = body => typeof body?.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 80 &&
  validDate(body.startDate) && validDate(body.endDate) && body.endDate >= body.startDate;
const validRevision = value => Number.isSafeInteger(value) && value >= 0;
const roundState = (round,today) => round.status === 'closed' || round.status === 'stock' ? round.status :
  round.end_date && round.end_date < today ? 'ended' : round.status === 'baking' || (round.start_date && round.start_date <= today) ? 'baking' : 'planned';
// Dates are inclusive calendar dates in Belgium, independent of the visitor's timezone.
const belgianToday = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const voteRoundQuery = `SELECT id,name,revision FROM wishlist_rounds
  WHERE status IN ('planned','baking') AND (end_date IS NULL OR end_date>=?)
  ORDER BY CASE WHEN status='baking' OR start_date<=? THEN 0 ELSE 1 END,COALESCE(start_date,'9999-12-31'),created_at,id LIMIT 1`;
export async function onRequest({request,env}) {
  const url = new URL(request.url), path = url.pathname.replace(/\/$/,'');
  if (!['GET','PUT','POST'].includes(request.method)) return json({error:'method'},405);
  const origin = request.headers.get('Origin');
  if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({error:'origin'},403);
  const admin = path === '/api/wishlist/admin' || path === '/api/wishlist/rounds' || path === '/api/wishlist/stock' || (path === '/api/wishlist/selection' && request.method !== 'GET');
  if (admin && !await authorized(request,env)) return json({error:'unauthorized'},401);
  if (!env.WISHLIST_DB) return json({error:'unavailable'},503);
  const db = env.WISHLIST_DB;
  const today = belgianToday();
  try {
    async function selectionFor(round) {
      const row = await db.prepare('SELECT products_json,revision FROM wishlist_selections WHERE round_id=?').bind(round || '').first();
      return {products:row ? JSON.parse(row.products_json) : [],revision:row?.revision || 0};
    }
    if (path === '/api/wishlist/selection' && request.method === 'GET') {
      const rows = (await db.prepare('SELECT * FROM wishlist_rounds ORDER BY start_date,created_at,id').all()).results;
      const voting = await db.prepare(voteRoundQuery).bind(today,today).first();
      const stockRounds = rows.filter(r=>r.status!=='closed').map(r=>({
        round:{id:r.id,name:r.name},products:JSON.parse(r.stock_json).filter(item=>item.available && item.quantity !== 0).map(item=>item.product)
      })).filter(r=>r.products.length);
      const chosen = rows.find(r=>r.id === voting?.id) || rows.find(r=>stockRounds.some(s=>s.round.id===r.id));
      const round = chosen ? {id:chosen.id,name:chosen.name,start_date:chosen.start_date,end_date:chosen.end_date,status:chosen.status,state:roundState(chosen,today)} : null;
      // Never expose internal stock quantities, revisions or visitor data publicly.
      return json({round,selection:await selectionFor(round?.id),stock:stockRounds});
    }
    if (path === '/api/wishlist/selection' && request.method === 'PUT') {
      let body; try { body = await bodyOf(request); } catch { return json({error:'body'},400); }
      if (typeof body?.round !== 'string' || !Number.isSafeInteger(body.revision) || body.revision < 0 ||
          !Array.isArray(body.products) || body.products.length > products.size ||
          body.products.some(id=>!products.has(id)) || new Set(body.products).size !== body.products.length) return json({error:'body'},400);
      // The round and revision checks are part of the write, including the first publication.
      const result = await db.prepare(`INSERT INTO wishlist_selections(round_id,products_json,revision)
        SELECT ?,?,1 WHERE EXISTS(SELECT 1 FROM wishlist_rounds WHERE id=? AND status IN ('planned','baking') AND (end_date IS NULL OR end_date>=?))
        AND (EXISTS(SELECT 1 FROM wishlist_selections WHERE round_id=? AND revision=?) OR
          (?=0 AND NOT EXISTS(SELECT 1 FROM wishlist_selections WHERE round_id=?)))
        ON CONFLICT(round_id) DO UPDATE SET products_json=excluded.products_json,revision=wishlist_selections.revision+1
        WHERE wishlist_selections.revision=?`).bind(body.round,JSON.stringify(body.products),body.round,today,body.round,body.revision,body.revision,body.round,body.revision).run();
      return result.meta.changes ? json({ok:true}) : json({error:'selection_changed'},409);
    }
    if (path === '/api/wishlist/admin' && request.method === 'GET') {
      const roundRows = await db.prepare("SELECT * FROM wishlist_rounds ORDER BY CASE WHEN status='closed' THEN 1 ELSE 0 END,start_date DESC,created_at DESC,rowid DESC").all();
      const preferred = await db.prepare(voteRoundQuery).bind(today,today).first();
      const selected = url.searchParams.get('round') || preferred?.id || roundRows.results[0]?.id;
      const chosen = roundRows.results.find(r=>r.id===selected);
      if (selected && !chosen) return json({error:'not_found'},404);
      const counts = await db.prepare('SELECT product_id, COUNT(*) AS count FROM wishlist_votes WHERE round_id=? GROUP BY product_id ORDER BY count DESC, product_id').bind(selected || '').all();
      const visitors = await db.prepare('SELECT COUNT(DISTINCT visitor_hash) AS count FROM wishlist_votes WHERE round_id=?').bind(selected || '').first();
      return json({rounds:roundRows.results.map(({stock_json,...r})=>({...r,state:roundState(r,today)})),selected,counts:counts.results,visitors:visitors.count,selection:await selectionFor(selected),stock:{items:chosen ? JSON.parse(chosen.stock_json) : [],revision:chosen?.stock_revision || 0}});
    }
    if (path === '/api/wishlist/rounds' && request.method === 'POST') {
      let body; try { body = await bodyOf(request); } catch { return json({error:'body'},400); }
      if (!validSchedule(body)) return json({error:'body'},400);
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO wishlist_rounds(id,name,start_date,end_date,status) VALUES (?,?,?,?,'planned')").bind(id,body.name.trim(),body.startDate,body.endDate).run();
      return json({id},201);
    }
    if (path === '/api/wishlist/rounds' && request.method === 'PUT') {
      let body; try { body = await bodyOf(request); } catch { return json({error:'body'},400); }
      if (!validSchedule(body) || typeof body.round !== 'string' || !validRevision(body.revision) || !['planned','baking','stock','closed'].includes(body.status)) return json({error:'body'},400);
      const result = await db.prepare(`UPDATE wishlist_rounds SET name=?,start_date=?,end_date=?,status=?,revision=revision+1,
        closed_at=CASE WHEN ?='closed' THEN COALESCE(closed_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ELSE NULL END
        WHERE id=? AND revision=?`).bind(body.name.trim(),body.startDate,body.endDate,body.status,body.status,body.round,body.revision).run();
      return result.meta.changes ? json({ok:true}) : json({error:'round_changed'},409);
    }
    if (path === '/api/wishlist/stock' && request.method === 'PUT') {
      let body; try { body = await bodyOf(request,4096); } catch { return json({error:'body'},400); }
      if (typeof body?.round !== 'string' || !validRevision(body.revision) || !validRevision(body.roundRevision) ||
          !Array.isArray(body.items) || body.items.length > products.size || new Set(body.items.map(item=>item?.product)).size !== body.items.length ||
          body.items.some(item=>!products.has(item?.product) || typeof item.available !== 'boolean' ||
            !(item.quantity === null || (Number.isSafeInteger(item.quantity) && item.quantity >= 0 && item.quantity <= 100000)) ||
            (item.quantity === 0 && item.available))) return json({error:'body'},400);
      const items = body.items.map(({product,available,quantity})=>({product,available,quantity}));
      const result = await db.prepare(`UPDATE wishlist_rounds SET stock_json=?,stock_revision=stock_revision+1
        WHERE id=? AND stock_revision=? AND revision=? AND status!='closed'`).bind(JSON.stringify(items),body.round,body.revision,body.roundRevision).run();
      return result.meta.changes ? json({ok:true}) : json({error:'stock_changed'},409);
    }
    if (path !== '/api/wishlist' || !['GET','PUT'].includes(request.method)) return json({error:'not_found'},404);
    const visitor = request.headers.get('X-Visitor-Id') || '';
    if (!/^[a-f0-9]{64}$/.test(visitor)) return json({error:'visitor'},400);
    const active = await db.prepare(voteRoundQuery).bind(today,today).first();
    if (!active) return request.method === 'GET' ? json({round:null,selected:[]}) : json({error:'round_changed'},409);
    const visitorHash = hex(await hash(active.id + ':' + visitor));
    if (request.method === 'GET') {
      const votes = await db.prepare('SELECT product_id FROM wishlist_votes WHERE round_id=? AND visitor_hash=?').bind(active.id,visitorHash).all();
      return json({round:active,selected:votes.results.map(v=>v.product_id)});
    }
    let body; try { body = await bodyOf(request); } catch { return json({error:'body'},400); }
    if (!products.has(body?.product) || typeof body?.selected !== 'boolean' || typeof body?.round !== 'string') return json({error:'body'},400);
    if (body.round !== active.id) return json({error:'round_changed'},409);
    // Round check belongs in the mutation too, so an in-flight vote cannot enter an archived round.
    const statement = body.selected
      ? db.prepare(`INSERT OR IGNORE INTO wishlist_votes(round_id,product_id,visitor_hash) SELECT ?,?,? WHERE ?=(${voteRoundQuery.replace('SELECT id,name,revision','SELECT id')})`).bind(active.id,body.product,visitorHash,active.id,today,today)
      : db.prepare(`DELETE FROM wishlist_votes WHERE round_id=? AND product_id=? AND visitor_hash=? AND ?=(${voteRoundQuery.replace('SELECT id,name,revision','SELECT id')})`).bind(active.id,body.product,visitorHash,active.id,today,today);
    const results = await db.batch([statement,db.prepare(voteRoundQuery).bind(today,today)]);
    if (results[1].results[0]?.id !== active.id) return json({error:'round_changed'},409);
    return json({ok:true});
  } catch {
    // No request data or credentials in logs/responses.
    return json({error:'unavailable'},503);
  }
}
