const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function initializeDatabase() {
  console.log('🔄 Step 1: Initializing database schema...\n');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema (creates tables if they don't exist)
    await pool.query(schema);
    
    console.log('✅ Database schema ready');
    
    // Insert default data
    await insertDefaultData();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function insertDefaultData() {
  console.log('🔄 Inserting default data...');
  
  try {
    // Create default rooms
    const defaultRooms = ['general', 'random', 'tech'];
    
    for (const roomName of defaultRooms) {
      await pool.query(
        'INSERT INTO rooms (room_name, description) VALUES ($1, $2) ON CONFLICT (room_name) DO NOTHING',
        [roomName, `${roomName.charAt(0).toUpperCase() + roomName.slice(1)} chat room`]
      );
    }
    
    console.log('✅ Default rooms ready\n');
    
  } catch (error) {
    console.error('Warning: Could not insert default data:', error.message);
  }
}

async function runMigrations() {
  console.log('🔄 Step 2: Running database migrations...\n');
  
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get list of executed migrations
    const executedResult = await pool.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedMigrations = executedResult.rows.map(row => row.name);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found\n');
      return;
    }
    
    // Run pending migrations
    let newMigrationsCount = 0;
    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        continue; // Skip already executed
      }
      
      console.log(`🔄 Running migration: ${file}...`);
      
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        // Execute migration in a transaction
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');
        
        console.log(`✅ ${file} completed`);
        newMigrationsCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ ${file} failed:`, error.message);
        throw error;
      }
    }
    
    if (newMigrationsCount > 0) {
      console.log(`\n✅ ${newMigrationsCount} new migrations executed`);
    } else {
      console.log(`✅ All migrations up to date`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function deploy() {
  console.log('============================================================');
  console.log('🚀 Starting Database Deployment');
  console.log('============================================================\n');
  
  try {
    // Step 1: Initialize schema
    await initializeDatabase();
    
    // Step 2: Run migrations
    await runMigrations();
    
    console.log('\n============================================================');
    console.log('✅ Database Deployment Complete!');
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('\n============================================================');
    console.error('❌ Database Deployment Failed!');
    console.error('============================================================\n');
    throw error;
  } finally {
    await pool.end();
  }
}

// Run deployment
if (require.main === module) {
  deploy()
    .then(() => {
      console.log('👍 Ready to start server!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to deploy database:', error);
      process.exit(1);
    });
}

module.exports = { deploy };

