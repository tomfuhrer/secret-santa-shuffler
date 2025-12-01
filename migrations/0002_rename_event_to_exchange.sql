-- Migration: 0002_rename_event_to_exchange
-- Description: Rename 'events' to 'exchanges' and 'event_id' to 'exchange_id'
-- Rationale: An exchange represents who gives to whom, without implying calendar/date management

-- SQLite doesn't support RENAME COLUMN or RENAME TABLE with foreign keys cleanly,
-- so we need to recreate tables

-- Step 1: Create new exchanges table
CREATE TABLE exchanges (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    budget_min INTEGER,
    budget_max INTEGER,
    exchange_date TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    shuffled_at INTEGER,
    secrets_sent_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organizer_id) REFERENCES organizers(id)
);

-- Step 2: Copy data from events to exchanges
INSERT INTO exchanges SELECT * FROM events;

-- Step 3: Create new participants table with exchange_id
CREATE TABLE participants_new (
    id TEXT PRIMARY KEY,
    exchange_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    token TEXT UNIQUE NOT NULL,
    is_organizer INTEGER NOT NULL DEFAULT 0,
    questionnaire_completed_at INTEGER,
    assigned_recipient_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (exchange_id) REFERENCES exchanges(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_recipient_id) REFERENCES participants_new(id),
    UNIQUE(exchange_id, email)
);

-- Step 4: Copy data from participants to participants_new
INSERT INTO participants_new (id, exchange_id, email, name, token, is_organizer, questionnaire_completed_at, assigned_recipient_id, created_at, updated_at)
SELECT id, event_id, email, name, token, is_organizer, questionnaire_completed_at, assigned_recipient_id, created_at, updated_at FROM participants;

-- Step 5: Drop old tables
DROP TABLE participants;
DROP TABLE events;

-- Step 6: Rename new participants table
ALTER TABLE participants_new RENAME TO participants;

-- Step 7: Recreate indexes with new names
DROP INDEX IF EXISTS idx_events_organizer;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_participants_event;

CREATE INDEX idx_exchanges_organizer ON exchanges(organizer_id);
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_participants_exchange ON participants(exchange_id);

-- Recreate other participant indexes (they were dropped with the table)
CREATE INDEX idx_participants_token ON participants(token);
CREATE INDEX idx_participants_email ON participants(email);
