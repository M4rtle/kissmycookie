CREATE TABLE IF NOT EXISTS wishlist_selections (
  round_id TEXT PRIMARY KEY REFERENCES wishlist_rounds(id),
  products_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);
