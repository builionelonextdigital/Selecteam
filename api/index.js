const { Pool } = require('pg');
const querystring = require('querystring');
require('dotenv').config();

// Create pool
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
  { id: 4, name: 'Team D', value: 'team_d' }
];

const MAX_PEOPLE_PER_TEAM = 2;

// Initialize database
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_selections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_team ON team_selections(team);
    `);
    
    client.release();
  } catch (error) {
    console.error('Database init error:', error);
  }
}

initializeDatabase();

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'GET') {
    // Render form
    return renderForm(req, res, '');
  }

  if (req.method === 'POST') {
    // Parse form data
    let body = '';
    
    await new Promise((resolve) => {
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', resolve);
    });

    const formData = querystring.parse(body);
    req.body = formData;
    
    // Handle form submission
    return handleSubmit(req, res);
  }

  res.status(405).send('Method not allowed');
};

async function handleSubmit(req, res) {
  const name = req.body.name || '';
  const team = req.body.team || '';

  // Validation
  if (!name || !team) {
    return renderForm(req, res, 'Vui lòng điền tên và chọn team');
  }

  if (!TEAMS.some(t => t.value === team)) {
    return renderForm(req, res, 'Team không hợp lệ');
  }

  try {
    // Check current count for this team
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM team_selections WHERE team = $1',
      [team]
    );

    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= MAX_PEOPLE_PER_TEAM) {
      const teamName = TEAMS.find(t => t.value === team).name;
      return renderForm(req, res, `${teamName} đã đủ 2 người. Vui lòng chọn team khác.`);
    }

    // Insert into database
    await pool.query(
      'INSERT INTO team_selections (name, team) VALUES ($1, $2)',
      [name, team]
    );

    const teamName = TEAMS.find(t => t.value === team).name;
    return renderForm(req, res, `✓ Thành công! ${name} đã được thêm vào ${teamName}`);

  } catch (error) {
    console.error('Error submitting form:', error);
    return renderForm(req, res, 'Có lỗi xảy ra. Vui lòng thử lại.');
  }
}

async function getTeamCounts() {
  try {
    const result = await pool.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team
    `);

    const teamCountMap = {};
    result.rows.forEach(row => {
      teamCountMap[row.team] = parseInt(row.count);
    });
    return teamCountMap;
  } catch (error) {
    console.error('Error getting team counts:', error);
    return {};
  }
}

const TEAMS = [
  { id: 1, name: 'Team A', value: 'team_a' },
  { id: 2, name: 'Team B', value: 'team_b' },
  { id: 3, name: 'Team C', value: 'team_c' },
  { id: 4, name: 'Team D', value: 'team_d' }
];

const MAX_PEOPLE_PER_TEAM = 2;

async function renderForm(req, res, message = '') {
  try {
    const teamCountMap = await getTeamCounts();

    const teamsWithStatus = TEAMS.map(team => ({
      ...team,
      count: teamCountMap[team.value] || 0,
      available: (teamCountMap[team.value] || 0) < MAX_PEOPLE_PER_TEAM,
      isFull: (teamCountMap[team.value] || 0) >= MAX_PEOPLE_PER_TEAM
    }));

    const html = generateHTML(teamsWithStatus, message);
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
}

function generateHTML(teams, message) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chọn Team</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
            text-align: center;
            display: none;
        }

        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }

        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }

        .team-status {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }

        .team-card {
            background: white;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e0e0e0;
        }

        .team-card.full {
            background-color: #ffebee;
            border-color: #ef5350;
        }

        .team-card.full .team-name {
            color: #c62828;
        }

        .team-card.available {
            border-color: #66bb6a;
            background-color: #f1f8f4;
        }

        .team-card.available .team-name {
            color: #2e7d32;
        }

        .team-name {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 5px;
        }

        .team-count {
            font-size: 12px;
            color: #666;
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }

        input[type="text"],
        select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 15px;
            font-family: inherit;
        }

        input[type="text"]:focus,
        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button-group {
            display: flex;
            gap: 10px;
        }

        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-submit {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .btn-reset {
            background-color: #e0e0e0;
            color: #333;
        }

        .btn-reset:hover {
            background-color: #d0d0d0;
        }

        .selections-link {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }

        .selections-link a {
            color: #667eea;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
        }

        .selections-link a:hover {
            text-decoration: underline;
        }

        @media (max-width: 600px) {
            .container {
                padding: 25px;
            }

            .team-status {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Chọn Team</h1>
            <p>Mỗi team chỉ có tối đa 2 người. Vui lòng chọn team của bạn.</p>
        </div>

        ${message ? `<div class="message ${message.includes('✓') ? 'success' : 'error'}">${message}</div>` : ''}

        <div class="team-status">
            ${teams.map(team => `
                <div class="team-card ${team.isFull ? 'full' : 'available'}">
                    <div class="team-name">${team.name} ${team.isFull ? '❌' : '✓'}</div>
                    <div class="team-count">${team.count}/${MAX_PEOPLE_PER_TEAM}</div>
                </div>
            `).join('')}
        </div>

        <form method="POST" action="/api">
            <div class="form-group">
                <label for="name">👤 Tên của bạn</label>
                <input type="text" id="name" name="name" placeholder="Nhập tên" required maxlength="100">
            </div>

            <div class="form-group">
                <label for="team">🏆 Chọn Team</label>
                <select id="team" name="team" required>
                    <option value="">-- Chọn Team --</option>
                    ${teams.map(team => `
                        <option value="${team.value}" ${team.isFull ? 'disabled' : ''}>
                            ${team.name} (${team.count}/${MAX_PEOPLE_PER_TEAM})
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="button-group">
                <button type="submit" class="btn-submit">Gửi</button>
                <button type="reset" class="btn-reset">Xóa</button>
            </div>
        </form>

        <div class="selections-link">
            <a href="/api/results" target="_blank">📊 Xem kết quả</a>
        </div>
    </div>
</body>
</html>`;
}
