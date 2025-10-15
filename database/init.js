const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function initializeDatabase() {
  console.log('🔄 Initializing database...\n');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully!');
    console.log('✅ Tables created:');
    console.log('   - users');
    console.log('   - rooms');
    console.log('   - messages');
    console.log('   - message_reads');
    console.log('   - message_deliveries');
    console.log('   - room_members');
    console.log('   - active_sessions');
    console.log('\n✅ Views created:');
    console.log('   - active_users_view');
    console.log('   - room_stats_view');
    console.log('   - messages_with_user_view');
    
    // Insert default data
    await insertDefaultData();
    
    console.log('\n✅ Database initialization complete!\n');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function insertDefaultData() {
  console.log('\n🔄 Inserting default data...');
  
  try {
    // Create default rooms
    const defaultRooms = ['general', 'random', 'tech'];
    
    for (const roomName of defaultRooms) {
      await pool.query(
        'INSERT INTO rooms (room_name, description) VALUES ($1, $2) ON CONFLICT (room_name) DO NOTHING',
        [roomName, `${roomName.charAt(0).toUpperCase() + roomName.slice(1)} chat room`]
      );
    }
    
    console.log('✅ Default rooms created');
    
  } catch (error) {
    console.error('Warning: Could not insert default data:', error.message);
  }
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('👍 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
