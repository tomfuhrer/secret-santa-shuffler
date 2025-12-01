-- Migration: 0001_initial_schema
-- Description: Create initial database schema for Secret Santa Shuffler

-- Organizers: authenticated users who create events
CREATE TABLE organizers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Magic links for passwordless authentication
CREATE TABLE magic_links (
    id TEXT PRIMARY KEY,
    organizer_id TEXT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organizer_id) REFERENCES organizers(id)
);

-- Events: gift exchange events
CREATE TABLE events (
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

-- Participants: people in an event (including organizer)
CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    token TEXT UNIQUE NOT NULL,
    is_organizer INTEGER NOT NULL DEFAULT 0,
    questionnaire_completed_at INTEGER,
    assigned_recipient_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_recipient_id) REFERENCES participants(id),
    UNIQUE(event_id, email)
);

-- Questionnaires: participant responses
CREATE TABLE questionnaires (
    id TEXT PRIMARY KEY,
    participant_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    never_buy_myself TEXT,
    please_no TEXT,
    spare_time TEXT,
    other_loves TEXT,
    favorite_color TEXT,
    favorite_sports_team TEXT,
    favorite_pattern TEXT,
    favorite_supplies TEXT,
    favorite_snacks TEXT,
    favorite_beverages TEXT,
    favorite_candy TEXT,
    favorite_fragrances TEXT,
    favorite_restaurant TEXT,
    favorite_store TEXT,
    favorite_christmas_movie TEXT,
    favorite_christmas_song TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Sessions: organizer authentication
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_participants_event ON participants(event_id);
CREATE INDEX idx_participants_token ON participants(token);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_organizer ON sessions(organizer_id);