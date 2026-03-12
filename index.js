const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Neon DB 연결 설정
// Render에 등록한 DATABASE_URL을 그대로 사용합니다.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Neon 연결 시 필수 설정
  },
});

app.get('/', async (req, res) => {
  try {
    // 2. test 테이블에서 name 컬럼 하나 가져오기
    // LIMIT 1을 사용해 가장 상단의 레코드 하나만 불러옵니다.
    const result = await pool.query('SELECT name FROM test LIMIT 1');

    if (result.rows.length > 0) {
      const userName = result.rows[0].name;
      res.send(`<h1>HELLO ${userName}</h1>`);
    } else {
      res.send('<h1>데이터가 없습니다.</h1>');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
