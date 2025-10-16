-- Chat Backend Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar TEXT,
    bio TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(room_name);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);

-- Message read receipts table
CREATE TABLE IF NOT EXISTS message_reads (
    read_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- Message delivery receipts table
CREATE TABLE IF NOT EXISTS message_deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_deliveries_message ON message_deliveries(message_id);

-- Room members table (for tracking who's in which room)
CREATE TABLE IF NOT EXISTS room_members (
    member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_active ON room_members(is_active);

-- Active sessions table (for Socket.IO tracking)
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    socket_id VARCHAR(255) UNIQUE NOT NULL,
    room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_room ON active_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_socket ON active_sessions(socket_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create room if it doesn't exist
CREATE OR REPLACE FUNCTION get_or_create_room(p_room_name VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
BEGIN
    SELECT room_id INTO v_room_id FROM rooms WHERE room_name = p_room_name;
    
    IF v_room_id IS NULL THEN
        INSERT INTO rooms (room_name)
        VALUES (p_room_name)
        RETURNING room_id INTO v_room_id;
    END IF;
    
    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql;

-- Views for convenience

-- Active users view
CREATE OR REPLACE VIEW active_users_view AS
SELECT 
    u.user_id,
    u.username,
    u.display_name,
    u.avatar,
    u.status,
    u.last_seen,
    COUNT(DISTINCT s.session_id) as active_sessions
FROM users u
LEFT JOIN active_sessions s ON u.user_id = s.user_id
GROUP BY u.user_id;

-- Room statistics view
CREATE OR REPLACE VIEW room_stats_view AS
SELECT 
    r.room_id,
    r.room_name,
    COUNT(DISTINCT m.message_id) as total_messages,
    COUNT(DISTINCT rm.user_id) as total_members,
    COUNT(DISTINCT s.user_id) as active_users,
    MAX(m.created_at) as last_message_at
FROM rooms r
LEFT JOIN messages m ON r.room_id = m.room_id AND m.is_deleted = false
LEFT JOIN room_members rm ON r.room_id = rm.room_id AND rm.is_active = true
LEFT JOIN active_sessions s ON r.room_id = s.room_id
GROUP BY r.room_id, r.room_name;

-- Message with user info view
CREATE OR REPLACE VIEW messages_with_user_view AS
SELECT 
    m.message_id,
    m.message_text,
    m.created_at,
    m.edited_at,
    m.is_deleted,
    m.room_id,
    u.user_id,
    u.username,
    u.display_name,
    u.avatar,
    (SELECT COUNT(*) FROM message_reads WHERE message_id = m.message_id) as read_count,
    (SELECT COUNT(*) FROM message_deliveries WHERE message_id = m.message_id) as delivery_count
FROM messages m
JOIN users u ON m.user_id = u.user_id;

COMMENT ON TABLE users IS 'Stores registered user information';
COMMENT ON TABLE rooms IS 'Stores chat room information';
COMMENT ON TABLE messages IS 'Stores all chat messages';
COMMENT ON TABLE message_reads IS 'Tracks which messages have been read by which users';
COMMENT ON TABLE message_deliveries IS 'Tracks message delivery status';
COMMENT ON TABLE room_members IS 'Tracks room membership';
COMMENT ON TABLE active_sessions IS 'Tracks active Socket.IO connections';

-- ==========================================
-- ENHANCED FEATURES SCHEMA
-- ==========================================

-- Message Reactions (emoji reactions to messages)
CREATE TABLE IF NOT EXISTS message_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- Direct/Private Messages (1-on-1 messaging)
CREATE TABLE IF NOT EXISTS direct_messages (
    dm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id, receiver_id, created_at DESC);

-- User Blocking
CREATE TABLE IF NOT EXISTS user_blocks (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- File Attachments
CREATE TABLE IF NOT EXISTS message_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments(message_id);

-- DM File Attachments
CREATE TABLE IF NOT EXISTS dm_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dm_id UUID REFERENCES direct_messages(dm_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_attachments_dm ON dm_attachments(dm_id);

-- User Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Message Mentions (tagging users in messages)
CREATE TABLE IF NOT EXISTS message_mentions (
    mention_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    mentioned_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_message ON message_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON message_mentions(mentioned_user_id);

-- User Contacts/Friends
CREATE TABLE IF NOT EXISTS user_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    is_favorite BOOLEAN DEFAULT false,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_user_id),
    CHECK (user_id != contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON user_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_favorites ON user_contacts(user_id, is_favorite);

-- Message Edit History
CREATE TABLE IF NOT EXISTS message_edit_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    old_text TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edit_history_message ON message_edit_history(message_id, edited_at DESC);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sound_notifications BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    show_read_receipts BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ENHANCED VIEWS
-- ==========================================

-- Direct message conversations view
CREATE OR REPLACE VIEW dm_conversations_view AS
SELECT DISTINCT
    CASE 
        WHEN dm.sender_id < dm.receiver_id 
        THEN CONCAT(dm.sender_id, '-', dm.receiver_id)
        ELSE CONCAT(dm.receiver_id, '-', dm.sender_id)
    END as conversation_id,
    dm.sender_id,
    dm.receiver_id,
    u1.username as sender_username,
    u1.display_name as sender_display_name,
    u1.avatar as sender_avatar,
    u2.username as receiver_username,
    u2.display_name as receiver_display_name,
    u2.avatar as receiver_avatar,
    (SELECT message_text FROM direct_messages 
     WHERE (sender_id = dm.sender_id AND receiver_id = dm.receiver_id)
        OR (sender_id = dm.receiver_id AND receiver_id = dm.sender_id)
     ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT created_at FROM direct_messages 
     WHERE (sender_id = dm.sender_id AND receiver_id = dm.receiver_id)
        OR (sender_id = dm.receiver_id AND receiver_id = dm.sender_id)
     ORDER BY created_at DESC LIMIT 1) as last_message_at,
    (SELECT COUNT(*) FROM direct_messages 
     WHERE receiver_id = dm.receiver_id 
     AND sender_id = dm.sender_id 
     AND is_read = false) as unread_count
FROM direct_messages dm
JOIN users u1 ON dm.sender_id = u1.user_id
JOIN users u2 ON dm.receiver_id = u2.user_id;

-- User notifications count view
CREATE OR REPLACE VIEW user_notifications_view AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;

-- Message with reactions view
CREATE OR REPLACE VIEW messages_with_reactions_view AS
SELECT 
    m.message_id,
    m.message_text,
    m.created_at,
    m.edited_at,
    u.user_id,
    u.username,
    u.display_name,
    u.avatar,
    r.room_name,
    COALESCE(
        json_agg(
            json_build_object(
                'emoji', mr.emoji,
                'user_id', mr.user_id,
                'username', ru.username
            )
        ) FILTER (WHERE mr.reaction_id IS NOT NULL),
        '[]'::json
    ) as reactions
FROM messages m
JOIN users u ON m.user_id = u.user_id
JOIN rooms r ON m.room_id = r.room_id
LEFT JOIN message_reactions mr ON m.message_id = mr.message_id
LEFT JOIN users ru ON mr.user_id = ru.user_id
WHERE m.is_deleted = false
GROUP BY m.message_id, u.user_id, r.room_name;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING notification_id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID, p_other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE (blocker_id = p_user_id AND blocked_id = p_other_user_id)
           OR (blocker_id = p_other_user_id AND blocked_id = p_user_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID, p_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM messages m
    WHERE m.room_id = p_room_id
    AND m.user_id != p_user_id
    AND NOT EXISTS (
        SELECT 1 FROM message_reads mr 
        WHERE mr.message_id = m.message_id 
        AND mr.user_id = p_user_id
    );
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE direct_messages IS 'Private 1-on-1 messages between users';
COMMENT ON TABLE user_blocks IS 'User blocking relationships';
COMMENT ON TABLE message_attachments IS 'File attachments for room messages';
COMMENT ON TABLE dm_attachments IS 'File attachments for direct messages';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE message_mentions IS 'User mentions in messages (@username)';
COMMENT ON TABLE user_contacts IS 'User contacts/friends list';
COMMENT ON TABLE message_edit_history IS 'History of message edits';
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
