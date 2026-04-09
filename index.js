const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 정적 파일 제공 경로를 절대 경로로 설정하여 오류 방지
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 메인 페이지 (index.html) 명시적 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.get('/api/news', async (req, res) => {
  const { category } = req.query;
  const apikey = process.env.NEWS_API_KEY;
  const maps = { 
    korea: '&country=kr', 
    usa: '&country=us', 
    europe: '&country=fr,de,it', 
    technology: '&category=technology' 
  };
  
  try {
    const url = `https://newsdata.io/api/1/news?apikey=${apikey}&language=ko,en${maps[category] || ''}`;
    console.log(`[API Call] Fetching news: ${category}`);
    const result = await axios.get(url);
    res.json(result.data.results || []);
  } catch (e) { 
    console.error('News API Error:', e.response ? e.response.data : e.message);
    res.status(500).json({ error: 'News API Error' }); 
  }
});

app.post('/api/analyze', async (req, res) => {
  const { title, description, content } = req.body;
  const prompt = `제목: ${title}\n내용: ${content || description}\n위 뉴스를 분석해서 반드시 JSON 형식으로만 응답해: {"summary":["요약1","요약2","요약3"],"insight":"영향도","sentiment":"긍정/부정/중립","keywords":["키워드1"]}`;
  
  try {
    console.log(`[AI Analysis] Analyzing: ${title}`);
    const aiRes = await model.generateContent(prompt);
    const text = await aiRes.response.text();
    const jsonStr = text.match(/\{[\s\S]*\}/)[0];
    const data = JSON.parse(jsonStr);

    await pool.query(
      'INSERT INTO news_analyses (title, summary, insight, sentiment, keywords) VALUES ($1, $2, $3, $4, $5)',
      [title, JSON.stringify(data.summary), data.insight, data.sentiment, JSON.stringify(data.keywords)]
    );
    res.json(data);
  } catch (e) { 
    console.error('AI/DB Error:', e.message);
    res.status(500).json({ error: 'AI/DB Error' }); 
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const resDB = await pool.query('SELECT * FROM news_analyses ORDER BY created_at DESC LIMIT 10');
    res.json(resDB.rows);
  } catch (e) { 
    console.error('DB Error:', e.message);
    res.status(500).json({ error: 'DB Error' }); 
  }
});

app.listen(PORT, () => console.log(`[Server2] Running on http://localhost:${PORT}`));
