module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Check environment
    const databaseUrl = process.env.DATABASE_URL;
    const nodeEnv = process.env.NODE_ENV;

    // Try to connect
    let dbStatus = 'Not configured';
    let dbError = null;

    if (databaseUrl) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        await pool.end();
        
        dbStatus = '✓ Connected';
      } catch (error) {
        dbStatus = '✗ Connection failed';
        dbError = error.message;
      }
    }

    const debug = {
      status: 'OK',
      environment: {
        NODE_ENV: nodeEnv,
        DATABASE_URL_SET: !!databaseUrl,
        DATABASE_URL_LENGTH: databaseUrl ? databaseUrl.length : 0
      },
      database: {
        status: dbStatus,
        error: dbError
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(debug);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
