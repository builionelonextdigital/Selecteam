// Configuration file for Selecteam
module.exports = {
  // Teams configuration
  TEAMS: [
    { id: 1, name: 'Team A', value: 'team_a' },
    { id: 2, name: 'Team B', value: 'team_b' },
    { id: 3, name: 'Team C', value: 'team_c' },
    { id: 4, name: 'Team D', value: 'team_d' }
  ],

  // Maximum people per team
  MAX_PEOPLE_PER_TEAM: 2,

  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost/selecteam',

  // Form validation
  VALIDATION: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
    VALID_TEAMS: ['team_a', 'team_b', 'team_c', 'team_d']
  },

  // Messages
  MESSAGES: {
    EMPTY_FIELDS: 'Vui lòng điền tên và chọn team',
    INVALID_TEAM: 'Team không hợp lệ',
    TEAM_FULL: 'Team {{TEAM_NAME}} đã đủ 2 người. Vui lòng chọn team khác.',
    SUCCESS: '✓ Thành công! {{NAME}} đã được thêm vào {{TEAM_NAME}}',
    ERROR: 'Có lỗi xảy ra. Vui lòng thử lại.',
    DATABASE_ERROR: 'Lỗi kết nối cơ sở dữ liệu'
  }
};
