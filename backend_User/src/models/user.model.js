const pool = require('../config/db');

const User = {
  async getAll() {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create(name, email, password) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, password]
    );
    return result.rows[0];
  },

  async checkLogin(email, password) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    return null; // không tìm thấy email
  }

  if (user.password !== password) {
    return null; // sai mật khẩu
  }

  return user; // đăng nhập thành công
},

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
};

module.exports = User;