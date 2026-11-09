-- Orders and stock share one revision and one atomic write per round.
ALTER TABLE wishlist_rounds ADD COLUMN orders_json TEXT NOT NULL DEFAULT '[]';
