const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready');
    
    // Get list of executed migrations
    const executedResult = await pool.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedMigrations = executedResult.rows.map(row => row.name);
    console.log(`📋 ${executedMigrations.length} migrations already executed`);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('📁 Created migrations directory');
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found');
      return;
    }
    
    console.log(`📝 Found ${migrationFiles.length} migration files\n`);
    
    // Run pending migrations
    let newMigrationsCount = 0;
    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Running ${file}...`);
      
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
        
        console.log(`✅ ${file} completed successfully`);
        newMigrationsCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ ${file} failed:`, error.message);
        throw error;
      }
    }
    
    console.log(`\n✅ Migration complete! ${newMigrationsCount} new migrations executed\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { runMigrations };

// Run migrations if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('👍 All migrations complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to run migrations:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

