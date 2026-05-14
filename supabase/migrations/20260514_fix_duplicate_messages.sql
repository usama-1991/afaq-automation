-- 1. Remove duplicate messages keeping the oldest one
DELETE FROM messages
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER( PARTITION BY external_message_id ORDER BY created_at ASC ) AS row_num
        FROM messages
        WHERE external_message_id IS NOT NULL
    ) t
    WHERE t.row_num > 1
);

-- 2. Add Unique constraint to prevent future race conditions
ALTER TABLE messages ADD CONSTRAINT unique_external_message_id UNIQUE (external_message_id);
