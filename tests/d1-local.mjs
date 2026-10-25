import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function localDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_wishlist.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_bake_selection.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0003_round_management.sql',import.meta.url),'utf8'));
  const statement = (query,values=[]) => ({
    bind(...next) { return statement(query,next); },
    async first() { return sqlite.prepare(query).get(...values) || null; },
    async all() { return {results:sqlite.prepare(query).all(...values)}; },
    async run() { const result = sqlite.prepare(query).run(...values); return {results:[],meta:{changes:Number(result.changes)}}; },
    query,values
  });
  return {
    prepare:query=>statement(query),
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const item of statements) results.push(/^SELECT/i.test(item.query) ? await item.all() : await item.run());
        sqlite.exec('COMMIT'); return results;
      } catch(error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close:()=>sqlite.close()
  };
}
export async function handler() {
  const source = readFileSync(new URL('../functions/api/wishlist/[[path]].js',import.meta.url),'utf8');
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).onRequest;
}
