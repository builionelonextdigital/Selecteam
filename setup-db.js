// Manual Database Setup Script
// Chạy: node setup-db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Đang setup database...\n');

    // Create table
    console.log('📋 Tạo bảng team_selections...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_selections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Bảng team_selections được tạo\n');

    // Create index
    console.log('🔍 Tạo index trên cột team...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team ON team_selections(team);
    `);
    console.log('✅ Index được tạo\n');

    // Show table info
    console.log('📊 Thông tin bảng:');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'team_selections'
      ORDER BY ordinal_position;
    `);
    console.table(result.rows);

    // Show current data
    console.log('\n📈 Dữ liệu hiện tại:');
    const data = await client.query('SELECT * FROM team_selections ORDER BY created_at DESC;');
    if (data.rows.length === 0) {
      console.log('Không có dữ liệu');
    } else {
      console.table(data.rows);
    }

    // Show count per team
    console.log('\n👥 Số người mỗi team:');
    const counts = await client.query(`
      SELECT team, COUNT(*) as count 
      FROM team_selections 
      GROUP BY team 
      ORDER BY team;
    `);
    if (counts.rows.length === 0) {
      console.log('Không có dữ liệu');
    } else {
      console.table(counts.rows);
    }

    console.log('\n✅ Setup hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
