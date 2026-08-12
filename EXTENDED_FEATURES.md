// Example: Extended Features
// Để tích hợp những tính năng này, thêm vào server.js

// ========================================
// 1. Email Notification (using nodemailer)
// ========================================

/*
npm install nodemailer

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendNotification(name, team) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'admin@example.com',
      subject: `Người dùng mới chọn team: ${team}`,
      html: `
        <h2>Thông báo chọn team</h2>
        <p><strong>Tên:</strong> ${name}</p>
        <p><strong>Team:</strong> ${team}</p>
        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      `
    });
  } catch (error) {
    console.error('Email error:', error);
  }
}

// Gọi trong POST /submit
sendNotification(name, team);
*/

// ========================================
// 2. Webhook Integration
// ========================================

/*
async function sendWebhook(name, team) {
  const payload = {
    name,
    team,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch('https://your-webhook-endpoint.com/selecteam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Webhook error:', error);
  }
}

// Gọi trong POST /submit
sendWebhook(name, team);
*/

// ========================================
// 3. Slack Notification
// ========================================

/*
npm install @slack/web-api

const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function sendSlackNotification(name, team, counts) {
  try {
    await slack.chat.postMessage({
      channel: '#selecteam',
      text: `Người dùng mới chọn team`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👤 *${name}* vừa chọn *${team}*\n📊 Hiện tại ${team} có ${counts.count}/${counts.max} người`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Slack error:', error);
  }
}
*/

// ========================================
// 4. Database Statistics
// ========================================

/*
app.get('/api/stats', async (req, res) => {
  try {
    // Total selections
    const total = await pool.query('SELECT COUNT(*) as total FROM team_selections');
    
    // Per team count
    const perTeam = await pool.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team
      ORDER BY team
    `);

    // Today's selections
    const today = await pool.query(`
      SELECT COUNT(*) as count 
      FROM team_selections 
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // Most recent
    const recent = await pool.query(`
      SELECT * FROM team_selections 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        total: parseInt(total.rows[0].total),
        today: parseInt(today.rows[0].count),
        perTeam: perTeam.rows,
        recent: recent.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
*/

// ========================================
// 5. CSV Export
// ========================================

/*
npm install csv-stringify

const stringify = require('csv-stringify/lib/sync');

app.get('/api/export/csv', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, team, created_at FROM team_selections ORDER BY created_at DESC'
    );

    const csv = stringify(result.rows, {
      header: true,
      columns: ['name', 'team', 'created_at']
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="selecteam-export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
*/

// ========================================
// 6. Admin Dashboard
// ========================================

/*
app.get('/admin/dashboard', async (req, res) => {
  try {
    // Check auth (add your own authentication)
    if (req.query.key !== process.env.ADMIN_KEY) {
      return res.status(403).send('Unauthorized');
    }

    // Get all data
    const selections = await pool.query(
      'SELECT * FROM team_selections ORDER BY created_at DESC'
    );
    const stats = await pool.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team
    `);

    res.render('admin-dashboard', {
      selections: selections.rows,
      stats: stats.rows
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});
*/

// ========================================
// 7. Rate Limiting
// ========================================

/*
npm install express-rate-limit

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5 // Max 5 submissions per hour per IP
});

app.use(limiter);
app.post('/submit', submitLimiter, async (req, res) => {
  // ... existing code
});
*/

// ========================================
// 8. Input Validation with Joi
// ========================================

/*
npm install joi

const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string()
    .alphanum()
    .min(2)
    .max(100)
    .required(),
  team: Joi.string()
    .valid('team_a', 'team_b', 'team_c', 'team_d')
    .required()
});

app.post('/submit', async (req, res) => {
  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).render('form', {
      teams: TEAMS,
      message: 'Dữ liệu không hợp lệ: ' + error.details[0].message
    });
  }
  
  // ... existing code
});
*/

// ========================================
// 9. Duplicate Detection
// ========================================

/*
app.post('/submit', async (req, res) => {
  const { name, team } = req.body;

  try {
    // Check if already submitted
    const existing = await pool.query(
      'SELECT * FROM team_selections WHERE name = $1 AND team = $2',
      [name, team]
    );

    if (existing.rows.length > 0) {
      return res.status(400).render('form', {
        teams: TEAMS,
        message: 'Bạn đã chọn team này rồi!'
      });
    }

    // ... rest of code
  } catch (error) {
    // ...
  }
});
*/

// ========================================
// 10. Scheduled Tasks (Cleanup old data)
// ========================================

/*
npm install node-cron

const cron = require('node-cron');

// Delete submissions older than 30 days every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const result = await pool.query(`
      DELETE FROM team_selections 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);
    console.log(`🗑️  Deleted ${result.rowCount} old records`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});
*/

// ========================================
// 11. Database Connection Pool Monitoring
// ========================================

/*
// Check pool status
setInterval(() => {
  console.log(`DB Pool - waiting: ${pool.waitingCount}, idle: ${pool.idleCount}, total: ${pool.totalCount}`);
}, 60000);
*/

// ========================================
// 12. Error Tracking (Sentry)
// ========================================

/*
npm install @sentry/node

const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
*/

// ========================================
// 13. API Documentation (Swagger)
// ========================================

/*
npm install swagger-ui-express swagger-jsdoc

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Selecteam API',
      version: '1.0.0',
    },
  },
  apis: ['./server.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
*/

module.exports = {
  // Export untuk dùng trong server.js nếu cần
};
