const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const TEAMS = [
  { id: 1, name: 'Team A', value: 'team_a', color: '#667eea' },
  { id: 2, name: 'Team B', value: 'team_b', color: '#764ba2' },
  { id: 3, name: 'Team C', value: 'team_c', color: '#f093fb' },
  { id: 4, name: 'Team D', value: 'team_d', color: '#4facfe' }
];

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'GET') {
    return handleGetResults(req, res);
  }

  res.status(405).send('Method not allowed');
};

async function handleGetResults(req, res) {
  try {
    // Get all selections
    const result = await pool.query(`
      SELECT * FROM team_selections 
      ORDER BY created_at DESC
    `);

    // Get statistics
    const statsResult = await pool.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team
      ORDER BY team
    `);

    const stats = {};
    statsResult.rows.forEach(row => {
      stats[row.team] = parseInt(row.count);
    });

    // Group selections by team
    const teamMembers = {};
    TEAMS.forEach(team => {
      teamMembers[team.value] = result.rows.filter(sel => sel.team === team.value);
    });

    const selections = result.rows;
    const html = generateResultsHTML(selections, stats, teamMembers);
    
    res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Lỗi</title>
        <style>
          body { font-family: Arial; padding: 20px; background: #f5f5f5; }
          .error { background: #ffebee; color: #c62828; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Lỗi: ${error.message}</h2>
        </div>
      </body>
      </html>
    `);
  }
}

function generateResultsHTML(selections, stats, teamMembers) {
  const totalPeople = selections.length;
  
  // Team members HTML
  const teamCardsHTML = TEAMS.map(team => {
    const count = stats[team.value] || 0;
    const members = teamMembers[team.value] || [];
    const isFull = count >= 2;
    
    const membersHTML = members.map((member, idx) => `
      <div class="member-item">
        <span class="member-number">${idx + 1}</span>
        <span class="member-name">${member.name}</span>
        <span class="member-time">${new Date(member.created_at).toLocaleTimeString('vi-VN')}</span>
      </div>
    `).join('');

    return `
      <div class="team-detail-card" style="border-top: 4px solid ${team.color}">
        <div class="team-detail-header">
          <div class="team-detail-title">
            <h3>${team.name}</h3>
            <span class="team-detail-badge ${isFull ? 'full' : 'available'}">
              ${count}/2 ${isFull ? '✓ Đầy' : 'Còn chỗ'}
            </span>
          </div>
          <div class="team-detail-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(count/2)*100}%; background: ${team.color}"></div>
            </div>
          </div>
        </div>
        
        <div class="team-members">
          ${members.length > 0 ? `
            ${membersHTML}
          ` : `
            <div class="no-members">
              <span style="color: #999;">Chưa có ai chọn team này</span>
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');
  
  const statsHTML = TEAMS.map(team => {
    const count = stats[team.value] || 0;
    const percentage = totalPeople > 0 ? Math.round((count / totalPeople) * 100) : 0;
    
    return `
      <div class="stat-card" style="border-left: 4px solid ${team.color}">
        <div class="stat-header">
          <h3>${team.name}</h3>
          <span class="stat-badge">${count}/2</span>
        </div>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${(count/2)*100}%; background: ${team.color}"></div>
        </div>
        <p class="stat-text">${percentage}% của tổng</p>
      </div>
    `;
  }).join('');

  const selectionsHTML = selections.map((sel, index) => {
    const team = TEAMS.find(t => t.value === sel.team);
    const date = new Date(sel.created_at);
    const dateStr = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    
    return `
      <tr>
        <td class="index">${index + 1}</td>
        <td class="name">${sel.name}</td>
        <td class="team"><span class="team-badge" style="background: ${team.color}">${team.name}</span></td>
        <td class="time">${dateStr}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kết Quả Chọn Team</title>
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
            padding: 30px 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .header h1 {
            color: #333;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-outline {
            background: transparent;
            color: #667eea;
            border: 2px solid #667eea;
        }

        .btn-outline:hover {
            background: #667eea;
            color: white;
        }

        /* Tabs */
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            background: white;
            padding: 10px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
            padding: 10px 20px;
            border: none;
            background: #f0f0f0;
            color: #666;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .tab-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        /* Tab content */
        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Overview Section */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .stat-header h3 {
            color: #333;
            font-size: 18px;
        }

        .stat-badge {
            background: #f5f5f5;
            color: #333;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }

        .stat-bar {
            background: #f0f0f0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .stat-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .stat-text {
            color: #666;
            font-size: 13px;
            margin: 0;
        }

        /* Teams Detail Section */
        .teams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .team-detail-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .team-detail-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .team-detail-header {
            margin-bottom: 20px;
        }

        .team-detail-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .team-detail-title h3 {
            color: #333;
            font-size: 20px;
            margin: 0;
        }

        .team-detail-badge {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .team-detail-badge.available {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .team-detail-badge.full {
            background: #ffebee;
            color: #c62828;
        }

        .team-detail-progress {
            margin-bottom: 0;
        }

        .progress-bar {
            background: #f0f0f0;
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        .team-members {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .member-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f9f9f9;
            border-radius: 8px;
            border-left: 3px solid #667eea;
            transition: all 0.3s ease;
        }

        .member-item:hover {
            background: #f0f7ff;
            transform: translateX(5px);
        }

        .member-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: #667eea;
            color: white;
            border-radius: 50%;
            font-weight: 600;
            font-size: 13px;
            flex-shrink: 0;
        }

        .member-name {
            flex: 1;
            color: #333;
            font-weight: 500;
        }

        .member-time {
            color: #999;
            font-size: 12px;
            white-space: nowrap;
        }

        .no-members {
            text-align: center;
            padding: 30px 20px;
            color: #999;
        }

        /* Table Section */
        .table-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }

        .table-header h2 {
            color: #333;
            font-size: 22px;
        }

        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .search-input {
            flex: 1;
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f9f9f9;
            border-bottom: 2px solid #e0e0e0;
        }

        th {
            padding: 12px 15px;
            text-align: left;
            color: #666;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
            color: #333;
        }

        tbody tr:hover {
            background: #f9f9f9;
        }

        .index {
            color: #999;
            font-weight: 600;
            width: 50px;
        }

        .name {
            font-weight: 500;
            color: #333;
        }

        .team-badge {
            display: inline-block;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .time {
            color: #999;
            font-size: 13px;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #999;
        }

        .total-info {
            background: #f0f7ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
            color: #333;
        }

        .total-info strong {
            color: #667eea;
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            font-size: 13px;
        }

        .footer a {
            color: white;
            text-decoration: none;
            font-weight: 600;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                align-items: flex-start;
            }

            .tabs {
                flex-wrap: wrap;
            }

            .teams-grid {
                grid-template-columns: 1fr;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .table-section {
                padding: 20px;
            }

            table {
                font-size: 13px;
            }

            th, td {
                padding: 10px 8px;
            }

            .index {
                width: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Kết Quả Chọn Team</h1>
            <div class="header-actions">
                <button class="btn btn-outline" onclick="exportCSV()">📥 Tải CSV</button>
                <a href="/" class="btn btn-primary">← Quay Lại Form</a>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('overview')">📈 Tổng Quan</button>
            <button class="tab-btn" onclick="switchTab('teams')">👥 Chi Tiết Team</button>
            <button class="tab-btn" onclick="switchTab('list')">📋 Danh Sách</button>
        </div>

        <!-- Tab 1: Overview -->
        <div id="overview" class="tab-content active">
            <div class="stats-grid">
                ${statsHTML}
            </div>
        </div>

        <!-- Tab 2: Teams Detail -->
        <div id="teams" class="tab-content">
            <div class="teams-grid">
                ${teamCardsHTML}
            </div>
        </div>

        <!-- Tab 3: List -->
        <div id="list" class="tab-content">
            <div class="table-section">
                <div class="table-header">
                    <h2>Danh Sách Người Chọn</h2>
                    <span style="color: #999; font-size: 14px;">Tổng: <strong style="color: #667eea;">${totalPeople} người</strong></span>
                </div>

                ${totalPeople > 0 ? `
                    <div class="total-info">
                        ✓ Đã có <strong>${totalPeople}</strong> người đăng ký.
                    </div>

                    <div class="search-box">
                        <input 
                            type="text" 
                            class="search-input" 
                            id="searchInput" 
                            placeholder="🔍 Tìm kiếm theo tên hoặc team..."
                            onkeyup="filterTable()"
                        >
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th>Tên</th>
                                <th style="width: 150px;">Team</th>
                                <th style="width: 200px;">Thời Gian</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            ${selectionsHTML}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-state">
                        <h3>📭 Chưa có ai đăng ký</h3>
                        <p>Vui lòng <a href="/" style="color: #667eea; text-decoration: underline;">quay lại form</a> để đăng ký.</p>
                    </div>
                `}
            </div>
        </div>

        <div class="footer">
            <p>🎯 Selecteam • <a href="/">Đăng ký</a> • <a href="/api/results">Kết quả</a></p>
        </div>
    </div>

    <script>
        function switchTab(tabName) {
            // Hide all tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Remove active from all buttons
            const btns = document.querySelectorAll('.tab-btn');
            btns.forEach(btn => btn.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Mark button as active
            event.target.classList.add('active');
        }

        function filterTable() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const table = document.getElementById('tableBody');
            const rows = table.getElementsByTagName('tr');

            for (let row of rows) {
                const name = row.cells[1].textContent.toLowerCase();
                const team = row.cells[2].textContent.toLowerCase();
                
                if (name.includes(filter) || team.includes(filter)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        }

        function exportCSV() {
            const rows = [];
            const table = document.querySelector('table');
            
            if (!table) {
                alert('Không có dữ liệu để tải');
                return;
            }

            // Header
            const headers = [];
            for (let i = 0; i < table.rows[0].cells.length; i++) {
                headers.push(table.rows[0].cells[i].textContent);
            }
            rows.push(headers.join(','));

            // Data
            for (let i = 1; i < table.rows.length; i++) {
                if (table.rows[i].style.display !== 'none') {
                    const cells = [];
                    for (let j = 0; j < table.rows[i].cells.length; j++) {
                        cells.push('"' + table.rows[i].cells[j].textContent.replace(/"/g, '""') + '"');
                    }
                    rows.push(cells.join(','));
                }
            }

            // Download
            const csv = rows.join('\\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'selecteam-results.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Auto-refresh mỗi 5 giây
        setInterval(() => {
            location.reload();
        }, 5000);
    </script>
</body>
</html>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kết Quả Chọn Team</title>
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
            padding: 30px 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .header h1 {
            color: #333;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #e0e0e0;
            color: #333;
        }

        .btn-secondary:hover {
            background: #d0d0d0;
        }

        .btn-outline {
            background: transparent;
            color: #667eea;
            border: 2px solid #667eea;
        }

        .btn-outline:hover {
            background: #667eea;
            color: white;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .stat-header h3 {
            color: #333;
            font-size: 18px;
        }

        .stat-badge {
            background: #f5f5f5;
            color: #333;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }

        .stat-bar {
            background: #f0f0f0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .stat-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .stat-text {
            color: #666;
            font-size: 13px;
            margin: 0;
        }

        .table-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }

        .table-header h2 {
            color: #333;
            font-size: 22px;
        }

        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .search-input {
            flex: 1;
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f9f9f9;
            border-bottom: 2px solid #e0e0e0;
        }

        th {
            padding: 12px 15px;
            text-align: left;
            color: #666;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
            color: #333;
        }

        tbody tr:hover {
            background: #f9f9f9;
        }

        .index {
            color: #999;
            font-weight: 600;
            width: 50px;
        }

        .name {
            font-weight: 500;
            color: #333;
        }

        .team-badge {
            display: inline-block;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .time {
            color: #999;
            font-size: 13px;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #999;
        }

        .empty-state h3 {
            color: #666;
            margin-bottom: 10px;
        }

        .total-info {
            background: #f0f7ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
            color: #333;
        }

        .total-info strong {
            color: #667eea;
        }

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                align-items: flex-start;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .table-section {
                padding: 20px;
            }

            table {
                font-size: 13px;
            }

            th, td {
                padding: 10px 8px;
            }

            .index {
                width: 30px;
            }
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            font-size: 13px;
        }

        .footer a {
            color: white;
            text-decoration: none;
            font-weight: 600;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Kết Quả Chọn Team</h1>
            <div class="header-actions">
                <button class="btn btn-outline" onclick="exportCSV()">📥 Tải CSV</button>
                <a href="/" class="btn btn-primary">← Quay Lại Form</a>
            </div>
        </div>

        <div class="stats-grid">
            ${statsHTML}
        </div>

        <div class="table-section">
            <div class="table-header">
                <h2>Danh Sách Người Chọn</h2>
                <span style="color: #999; font-size: 14px;">Tổng: <strong style="color: #667eea;">${totalPeople} người</strong></span>
            </div>

            ${totalPeople > 0 ? `
                <div class="total-info">
                    ✓ Đã có <strong>${totalPeople}</strong> người đăng ký. Lựa chọn được phân phối như sau:
                    ${TEAMS.map(t => `<strong style="color: ${t.color}; margin-left: 15px;">${t.name}: ${stats[t.value] || 0}/2</strong>`).join('')}
                </div>

                <div class="search-box">
                    <input 
                        type="text" 
                        class="search-input" 
                        id="searchInput" 
                        placeholder="🔍 Tìm kiếm theo tên hoặc team..."
                        onkeyup="filterTable()"
                    >
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Tên</th>
                            <th style="width: 150px;">Team</th>
                            <th style="width: 200px;">Thời Gian</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        ${selectionsHTML}
                    </tbody>
                </table>
            ` : `
                <div class="empty-state">
                    <h3>📭 Chưa có ai đăng ký</h3>
                    <p>Vui lòng <a href="/" style="color: #667eea; text-decoration: underline;">quay lại form</a> để đăng ký.</p>
                </div>
            `}
        </div>

        <div class="footer">
            <p>🎯 Selecteam • <a href="/">Đăng ký</a> • <a href="/api/results">Kết quả</a></p>
        </div>
    </div>

    <script>
        function filterTable() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const table = document.getElementById('tableBody');
            const rows = table.getElementsByTagName('tr');

            for (let row of rows) {
                const name = row.cells[1].textContent.toLowerCase();
                const team = row.cells[2].textContent.toLowerCase();
                
                if (name.includes(filter) || team.includes(filter)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        }

        function exportCSV() {
            const rows = [];
            const table = document.querySelector('table');
            
            if (!table) {
                alert('Không có dữ liệu để tải');
                return;
            }

            // Header
            const headers = [];
            for (let i = 0; i < table.rows[0].cells.length; i++) {
                headers.push(table.rows[0].cells[i].textContent);
            }
            rows.push(headers.join(','));

            // Data
            for (let i = 1; i < table.rows.length; i++) {
                if (table.rows[i].style.display !== 'none') {
                    const cells = [];
                    for (let j = 0; j < table.rows[i].cells.length; j++) {
                        cells.push('"' + table.rows[i].cells[j].textContent.replace(/"/g, '""') + '"');
                    }
                    rows.push(cells.join(','));
                }
            }

            // Download
            const csv = rows.join('\\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'selecteam-results.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Auto-refresh mỗi 5 giây
        setInterval(() => {
            location.reload();
        }, 5000);
    </script>
</body>
</html>`;
}
