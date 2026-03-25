ALTER TABLE words ALTER COLUMN deleted_at SET NOT NULL;
ALTER TABLE words ALTER COLUMN deleted_at SET DEFAULT now();
UPDATE words SET deleted_at = now() WHERE deleted_at IS NULL;
