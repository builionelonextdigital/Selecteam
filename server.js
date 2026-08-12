const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_m7OTkheDYM5s@ep-dawn-sound-axt639na-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');

// Teams data
const TEAMS = [
  { id: 1, name: 'Team A', value: 'team_a' },
  { id: 2, name: 'Team B', value: 'team_b' },
  { id: 3, name: 'Team C', value: 'team_c' },
  { id: 4, name: 'Team D', value: 'team_d' }
];

const MAX_PEOPLE_PER_TEAM = 2;

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_selections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_team ON team_selections(team);
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    // Get count of people in each team
    const teamCounts = await pool.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team
    `);

    const teamCountMap = {};
    teamCounts.rows.forEach(row => {
      teamCountMap[row.team] = parseInt(row.count);
    });

    // Add availability status to teams
    const teamsWithStatus = TEAMS.map(team => ({
      ...team,
      count: teamCountMap[team.value] || 0,
      available: (teamCountMap[team.value] || 0) < MAX_PEOPLE_PER_TEAM,
      isFull: (teamCountMap[team.value] || 0) >= MAX_PEOPLE_PER_TEAM
    }));

    res.render('form', { teams: teamsWithStatus, message: '' });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error loading form');
  }
});

app.post('/submit', async (req, res) => {
  const { name, team } = req.body;

  // Validation
  if (!name || !team) {
    return res.status(400).render('form', { 
      teams: TEAMS, 
      message: 'Vui lòng điền tên và chọn team' 
    });
  }

  if (!TEAMS.some(t => t.value === team)) {
    return res.status(400).render('form', { 
      teams: TEAMS, 
      message: 'Team không hợp lệ' 
    });
  }

  try {
    // Check current count for this team
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM team_selections WHERE team = $1',
      [team]
    );

    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= MAX_PEOPLE_PER_TEAM) {
      // Fetch updated team status
      const teamCounts = await pool.query(`
        SELECT team, COUNT(*) as count 
        FROM team_selections 
        GROUP BY team
      `);

      const teamCountMap = {};
      teamCounts.rows.forEach(row => {
        teamCountMap[row.team] = parseInt(row.count);
      });

      const teamsWithStatus = TEAMS.map(team => ({
        ...team,
        count: teamCountMap[team.value] || 0,
        available: (teamCountMap[team.value] || 0) < MAX_PEOPLE_PER_TEAM,
        isFull: (teamCountMap[team.value] || 0) >= MAX_PEOPLE_PER_TEAM
      }));

      return res.status(400).render('form', { 
        teams: teamsWithStatus, 
        message: `${TEAMS.find(t => t.value === team).name} đã đủ 2 người. Vui lòng chọn team khác.` 
      });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO team_selections (name, team) VALUES ($1, $2)',
      [name, team]
    );

    // Fetch updated team status
    const teamCounts = await pool.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team
    `);

    const teamCountMap = {};
    teamCounts.rows.forEach(row => {
      teamCountMap[row.team] = parseInt(row.count);
    });

    const teamsWithStatus = TEAMS.map(t => ({
      ...t,
      count: teamCountMap[t.value] || 0,
      available: (teamCountMap[t.value] || 0) < MAX_PEOPLE_PER_TEAM,
      isFull: (teamCountMap[t.value] || 0) >= MAX_PEOPLE_PER_TEAM
    }));

    res.render('form', { 
      teams: teamsWithStatus, 
      message: `✓ Thành công! ${name} đã được thêm vào ${TEAMS.find(t => t.value === team).name}` 
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).render('form', { 
      teams: TEAMS, 
      message: 'Có lỗi xảy ra. Vui lòng thử lại.' 
    });
  }
});

// Get all selections (API endpoint)
app.get('/api/selections', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM team_selections 
      ORDER BY created_at DESC
    `);
    
    res.json({
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
});

// Start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
