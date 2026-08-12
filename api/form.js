const { Pool } = require('pg');
const querystring = require('querystring');
require('dotenv').config();

const TEAMS = [
  { id: 1, name: 'Team A', value: 'team_a' },
  { id: 2, name: 'Team B', value: 'team_b' },
  { id: 3, name: 'Team C', value: 'team_c' },
  { id: 4, name: 'Team D', value: 'team_d' },
  { id: 5, name: 'Team E', value: 'team_e' }
];

const MAX_PEOPLE_PER_TEAM = 2;
let poolInstance = null;

function getPool() {
  if (poolInstance) return poolInstance;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not configured');
  poolInstance = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  return poolInstance;
}

async function ensureTable() {
  const pool = getPool();
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS team_selections (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, team VARCHAR(50) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_team ON team_selections(team);`);
  } catch (error) {
    console.error('Table error:', error);
  }
}

async function getTeamCounts() {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT team, COUNT(*) as count FROM team_selections GROUP BY team');
    const counts = {};
    result.rows.forEach(row => { counts[row.team] = parseInt(row.count); });
    return counts;
  } catch (error) {
    return {};
  }
}

function getFormHTML(teams, message) {
  const teamOptions = teams.map(t => `<option value="${t.value}" ${t.isFull ? 'disabled' : ''}>${t.name} (${t.count}/${MAX_PEOPLE_PER_TEAM}) ${t.isFull ? '❌' : '✓'}</option>`).join('');
  const teamBadges = teams.map(t => `<div class="team-badge ${t.isFull ? 'full' : 'available'}">${t.name}: ${t.count}/${MAX_PEOPLE_PER_TEAM}</div>`).join('');
  const msgHtml = message ? `<div class="message ${message.includes('✓') ? 'success' : 'error'}">${message}</div>` : '';
  
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Chọn Team</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}.container{background:white;border-radius:15px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:40px;max-width:500px;width:100%}h1{color:#333;margin-bottom:10px;text-align:center}.subtitle{color:#666;text-align:center;margin-bottom:30px;font-size:14px}.form-group{margin-bottom:20px}label{display:block;margin-bottom:8px;color:#333;font-weight:500}input,select{width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:16px;transition:border-color 0.3s}input:focus,select:focus{outline:none;border-color:#667eea}button{width:100%;padding:12px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;transition:transform 0.2s}button:hover{transform:translateY(-2px)}.message{margin-top:20px;padding:15px;border-radius:8px;text-align:center;font-weight:500}.message.success{background:#e8f5e9;color:#2e7d32;border:1px solid #4caf50}.message.error{background:#ffebee;color:#c62828;border:1px solid #f44336}.team-status{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:20px;padding-top:20px;border-top:1px solid #e0e0e0}.team-badge{padding:8px;border-radius:8px;text-align:center;font-size:12px;font-weight:bold}.team-badge.full{background:#ffebee;color:#c62828}.team-badge.available{background:#e8f5e9;color:#2e7d32}</style></head><body><div class="container"><h1>🏆 Chọn Team</h1><p class="subtitle">Mỗi team tối đa 2 người</p><form method="POST"><div class="form-group"><label for="name">👤 Tên của bạn</label><input type="text" id="name" name="name" placeholder="Nhập tên..." required></div><div class="form-group"><label for="team">🎯 Chọn Team</label><select id="team" name="team" required><option value="">-- Chọn team --</option>${teamOptions}</select></div><button type="submit">📤 Gửi</button></form>${msgHtml}<div class="team-status">${teamBadges}</div></div></body></html>`;
}

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    await ensureTable();

    if (req.method === 'GET') {
      const counts = await getTeamCounts();
      const teams = TEAMS.map(t => ({ ...t, count: counts[t.value] || 0, isFull: (counts[t.value] || 0) >= MAX_PEOPLE_PER_TEAM }));
      return res.status(200).send(getFormHTML(teams, ''));
    }

    if (req.method === 'POST') {
      return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const pool = getPool();
            const formData = querystring.parse(body);
            const name = (formData.name || '').trim();
            const team = (formData.team || '').trim();
            const counts = await getTeamCounts();
            const teams = TEAMS.map(t => ({ ...t, count: counts[t.value] || 0, isFull: (counts[t.value] || 0) >= MAX_PEOPLE_PER_TEAM }));

            if (!name || !team) return resolve(res.status(200).send(getFormHTML(teams, 'Vui lòng điền tên và chọn team')));
            if (!TEAMS.some(t => t.value === team)) return resolve(res.status(200).send(getFormHTML(teams, 'Team không hợp lệ')));

            const countResult = await pool.query('SELECT COUNT(*) as count FROM team_selections WHERE team = $1', [team]);
            const count = parseInt(countResult.rows[0].count);

            if (count >= MAX_PEOPLE_PER_TEAM) {
              const teamName = TEAMS.find(t => t.value === team).name;
              return resolve(res.status(200).send(getFormHTML(teams, teamName + ' đã đủ 2 người')));
            }

            await pool.query('INSERT INTO team_selections (name, team) VALUES ($1, $2)', [name, team]);
            const teamName = TEAMS.find(t => t.value === team).name;
            const newCounts = await getTeamCounts();
            const newTeams = TEAMS.map(t => ({ ...t, count: newCounts[t.value] || 0, isFull: (newCounts[t.value] || 0) >= MAX_PEOPLE_PER_TEAM }));
            resolve(res.status(200).send(getFormHTML(newTeams, '✓ Thành công! ' + name + ' - ' + teamName)));
          } catch (error) {
            console.error('Error:', error);
            resolve(res.status(500).send('Error: ' + error.message));
          }
        });
      });
    }

    res.status(405).send('Method not allowed');
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
};
