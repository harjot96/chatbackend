const fs = require('fs');
const { Pool } = require('pg');
const config = require('./index');

// Create PostgreSQL connection pool
const poolConfig = {
  connectionString: config.database.url,
  max: config.database.poolSize,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for cloud database
};

if (config.database.ssl) {
  poolConfig.ssl = {
    require: true,
    rejectUnauthorized: false
  };

  if (config.database.caCertPath) {
    try {
      poolConfig.ssl.ca = fs.readFileSync(config.database.caCertPath).toString();
      // If we have a CA file we can safely enable verification
      poolConfig.ssl.rejectUnauthorized = true;
    } catch (error) {
      console.warn(`⚠️  Unable to load DB SSL CA certificate from ${config.database.caCertPath}:`, error.message);
      console.warn('    Falling back to non-verifying TLS connection.');
    }
  }
}

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (config.server.env === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client from pool (for transactions)
const getClient = async () => {
  return await pool.connect();
};

// Close pool
const closePool = async () => {
  await pool.end();
  console.log('✅ Database connection pool closed');
};

module.exports = {
  pool,
  query,
  transaction,
  getClient,
  closePool
};
