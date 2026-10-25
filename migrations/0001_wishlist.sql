CREATE TABLE IF NOT EXISTS wishlist_rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  closed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_one_active_round ON wishlist_rounds((1)) WHERE closed_at IS NULL;
CREATE TABLE IF NOT EXISTS wishlist_votes (
  round_id TEXT NOT NULL REFERENCES wishlist_rounds(id),
  product_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  PRIMARY KEY(round_id, product_id, visitor_hash)
);
CREATE INDEX IF NOT EXISTS wishlist_visitor ON wishlist_votes(round_id, visitor_hash);
INSERT OR IGNORE INTO wishlist_rounds(id, name) VALUES ('first-round', 'Volgende bakronde');
