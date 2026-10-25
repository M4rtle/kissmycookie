DROP INDEX IF EXISTS wishlist_one_active_round;
ALTER TABLE wishlist_rounds ADD COLUMN start_date TEXT;
ALTER TABLE wishlist_rounds ADD COLUMN end_date TEXT;
ALTER TABLE wishlist_rounds ADD COLUMN status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','baking','stock','closed'));
ALTER TABLE wishlist_rounds ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wishlist_rounds ADD COLUMN stock_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE wishlist_rounds ADD COLUMN stock_revision INTEGER NOT NULL DEFAULT 0;
UPDATE wishlist_rounds SET status='closed' WHERE closed_at IS NOT NULL;
-- Preserve the previously announced dates when upgrading the original open round.
UPDATE wishlist_rounds SET start_date='2026-12-15',end_date='2026-12-21'
WHERE id='first-round' AND status='planned';
CREATE INDEX IF NOT EXISTS wishlist_round_schedule ON wishlist_rounds(status,start_date);
