const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const TEAMS = [
  { id: 1, name: 'Team A', value: 'team_a' },
  { id: 2, name: 'Team B', value: 'team_b' },
  { id: 3, name: 'Team C', value: 'team_c' },
  { id: 4, name: 'Team D', value: 'team_d' },
  { id: 5, name: 'Team E', value: 'team_e' }
];

const MAX_PEOPLE_PER_TEAM = 2;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return handleGetSelections(req, res);
  }

  res.status(405).json({ error: 'Method not allowed' });
};

async function handleGetSelections(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM team_selections 
      ORDER BY created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching selections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
