DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'status' AND e.enumlabel = 'RECUSADO'
    ) THEN
        ALTER TYPE status ADD VALUE 'RECUSADO';
    END IF;
END $$;
