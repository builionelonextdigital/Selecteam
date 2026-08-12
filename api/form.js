const { Pool } = require('pg');
const querystring = require('querystring');
require('dotenv').config();

const TEAMS = [
  { id: 1, name: 'Team A', value: 'team_a', emoji: '🔴' },
  { id: 2, name: 'Team B', value: 'team_b', emoji: '🟣' },
  { id: 3, name: 'Team C', value: 'team_c', emoji: '🟡' },
  { id: 4, name: 'Team D', value: 'team_d', emoji: '🔵' },
  { id: 5, name: 'Team E', value: 'team_e', emoji: '🟢' }
];

const MAX_PEOPLE_PER_TEAM = 2;
let poolInstance = null;

function getPool() {
  if (poolInstance) return poolInstance;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not configured');
  poolInstance = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  return poolInstance;
}

async function ensureTable() {
  const pool = getPool();
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS team_selections (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, team VARCHAR(50) NOT NULL, mac_address VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_team ON team_selections(team);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mac ON team_selections(mac_address);`);
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

async function checkMacExists(mac) {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM team_selections WHERE mac_address = $1 LIMIT 1', [mac]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Check MAC error:', error);
    return null;
  }
}

function getFormHTML(teams, message, macAddress) {
  const teamCards = teams.map(t => {
    const isFull = t.isFull;
    const cls = isFull ? 'team-card full' : 'team-card';
    return `<div class="${cls}" data-team="${t.value}" onclick="${isFull ? '' : `selectTeam('${t.value}')`}"><div class="team-emoji">${t.emoji}</div><div class="team-name">${t.name}</div><div class="team-count">${t.count}/${MAX_PEOPLE_PER_TEAM}</div>${isFull ? '<div class="team-status">Đã đủ</div>' : ''}</div>`;
  }).join('');
  
  const msgHtml = message ? `<div class="message ${message.includes('✓') ? 'success' : 'error'}">${message}</div>` : '';
  
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chọn Team</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
      max-width: 600px;
      width: 100%;
    }
    h1 { color: #333; margin-bottom: 10px; text-align: center; font-size: 28px; }
    .subtitle { color: #666; text-align: center; margin-bottom: 30px; font-size: 14px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
    input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; }
    input:focus { outline: none; border-color: #667eea; }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 15px;
      margin: 25px 0;
    }
    .team-card {
      padding: 20px;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: white;
    }
    .team-card:hover:not(.full) { border-color: #667eea; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transform: translateY(-2px); }
    .team-card.full { opacity: 0.6; cursor: not-allowed; background: #f5f5f5; }
    .team-card.selected { border-color: #667eea; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); font-weight: bold; }
    .team-emoji { font-size: 32px; margin-bottom: 8px; }
    .team-name { font-weight: bold; color: #333; margin-bottom: 5px; }
    .team-count { font-size: 12px; color: #666; }
    .team-status { font-size: 11px; color: #c62828; margin-top: 5px; font-weight: bold; }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
      margin-top: 15px;
    }
    button:hover { transform: translateY(-2px); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }
    .message.success { background: #e8f5e9; color: #2e7d32; border: 1px solid #4caf50; }
    .message.error { background: #ffebee; color: #c62828; border: 1px solid #f44336; }
    .hidden-input { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏆 Chọn Team</h1>
    <p class="subtitle">Mỗi người chỉ được chọn 1 lần</p>
    
    <form id="teamForm" method="POST">
      <div class="form-group">
        <label for="name">👤 Tên của bạn</label>
        <input type="text" id="name" name="name" placeholder="Nhập tên..." required>
      </div>
      
      <div class="form-group">
        <label>🎯 Chọn Team</label>
        <div class="team-grid">
          ${teamCards}
        </div>
        <input type="hidden" id="team" name="team" class="hidden-input">
        <input type="hidden" id="mac" name="mac" class="hidden-input">
      </div>
      
      <button type="submit" id="submitBtn" disabled>📤 Gửi</button>
    </form>
    
    ${msgHtml}
  </div>
  
  <script>
    // Get MAC address or device fingerprint
    async function getMacAddress() {
      try {
        // Try to get MAC address via WebRTC (on localhost/HTTPS)
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(getFingerprint()), 2000);
          pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate) {
              clearTimeout(timeout);
              resolve(getFingerprint());
              return;
            }
            const candidate = ice.candidate.candidate;
            if (candidate.includes('srflx')) {
              const mac = candidate.split(' ')[4];
              clearTimeout(timeout);
              pc.close();
              resolve(mac || getFingerprint());
            }
          };
        });
      } catch (e) {
        return getFingerprint();
      }
    }
    
    // Fallback: Create fingerprint from browser data + localStorage
    function getFingerprint() {
      const stored = localStorage.getItem('deviceId');
      if (stored) return stored;
      
      const id = navigator.userAgent + navigator.language + new Date().toDateString();
      const hash = btoa(id).slice(0, 32);
      localStorage.setItem('deviceId', hash);
      return hash;
    }
    
    // Set MAC on page load
    window.addEventListener('load', async () => {
      const mac = await getMacAddress();
      document.getElementById('mac').value = mac;
    });
    
    function selectTeam(teamValue) {
      document.querySelectorAll('.team-card').forEach(card => card.classList.remove('selected'));
      document.querySelector('[data-team="' + teamValue + '"]').classList.add('selected');
      document.getElementById('team').value = teamValue;
      document.getElementById('submitBtn').disabled = false;
    }
  </script>
</body>
</html>`;
}

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    await ensureTable();

    if (req.method === 'GET') {
      // Get MAC from query param if available
      const mac = req.url.includes('mac=') ? new URL('http://localhost' + req.url).searchParams.get('mac') : '';
      const counts = await getTeamCounts();
      const teams = TEAMS.map(t => ({ ...t, count: counts[t.value] || 0, isFull: (counts[t.value] || 0) >= MAX_PEOPLE_PER_TEAM }));
      return res.status(200).send(getFormHTML(teams, '', mac));
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
            const mac = (formData.mac || '').trim();
            
            const counts = await getTeamCounts();
            const teams = TEAMS.map(t => ({ ...t, count: counts[t.value] || 0, isFull: (counts[t.value] || 0) >= MAX_PEOPLE_PER_TEAM }));

            if (!name || !team) return resolve(res.status(200).send(getFormHTML(teams, 'Vui lòng điền tên và chọn team', mac)));
            if (!TEAMS.some(t => t.value === team)) return resolve(res.status(200).send(getFormHTML(teams, 'Team không hợp lệ', mac)));
            
            // Check if this MAC already voted
            const existingVote = await checkMacExists(mac);
            if (existingVote) {
              return resolve(res.status(200).send(getFormHTML(teams, `❌ Bạn đã chọn ${existingVote.team} rồi! Mỗi người chỉ được chọn 1 lần.`, mac)));
            }

            const countResult = await pool.query('SELECT COUNT(*) as count FROM team_selections WHERE team = $1', [team]);
            const count = parseInt(countResult.rows[0].count);

            if (count >= MAX_PEOPLE_PER_TEAM) {
              const teamName = TEAMS.find(t => t.value === team).name;
              return resolve(res.status(200).send(getFormHTML(teams, teamName + ' đã đủ 2 người', mac)));
            }

            await pool.query('INSERT INTO team_selections (name, team, mac_address) VALUES ($1, $2, $3)', [name, team, mac]);
            const teamName = TEAMS.find(t => t.value === team).name;
            const newCounts = await getTeamCounts();
            const newTeams = TEAMS.map(t => ({ ...t, count: newCounts[t.value] || 0, isFull: (newCounts[t.value] || 0) >= MAX_PEOPLE_PER_TEAM }));
            resolve(res.status(200).send(getFormHTML(newTeams, '✓ Thành công! ' + name + ' - ' + teamName, mac)));
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
