// const API_BASE = 'http://localhost:5000/api';
const API_BASE = 'https://aift-yhbj.onrender.com/api';

async function fetchNews(category = 'korea') {
    backToList();
    const container = document.getElementById('news-container');
    container.innerHTML = '<p>뉴스를 불러오는 중...</p>';
    try {
        const res = await fetch(`${API_BASE}/news?category=${category}`);
        const news = await res.json();
        container.innerHTML = '';
        news.forEach(item => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `<h3>${item.title}</h3><p>${item.description || '내용 없음'}</p><small>${item.pubDate}</small>`;
            card.onclick = () => analyzeNews(item);
            container.appendChild(card);
        });
    } catch (e) {
        // 에러 메시지와 내용을 상세히 표시
        container.innerHTML = `
            <div style="color: #d9534f; padding: 10px; border: 1px solid #d9534f;">
                <p><strong>뉴스를 가져오는데 실패했습니다.</strong></p>
                <p style="font-size: 0.9em; font-family: monospace;">에러 내용: ${e.message}</p>
            </div>
        `;
        console.error("상세 에러 로그:", e); // 개발자 도구(F12)에서도 확인 가능하도록
    }
}

async function analyzeNews(item) {
    document.getElementById('news-list').classList.add('hidden');
    document.getElementById('archive-view').classList.add('hidden');
    document.getElementById('analysis-view').classList.remove('hidden');
    
    const container = document.getElementById('analysis-container');
    container.innerHTML = `<p>AI가 "${item.title}" 분석 중...</p>`;

    try {
        const res = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: item.title,
                description: item.description,
                content: item.content
            })
        });
        const data = await res.json();
        container.innerHTML = `
            <div class="analysis-box">
                <h2>${item.title}</h2>
                <ul>${data.summary.map(s => `<li>${s}</li>`).join('')}</ul>
                <p><strong>Insight:</strong> ${data.insight}</p>
                <p class="sentiment">감성: ${data.sentiment}</p>
                <p class="keywords">키워드: ${data.keywords.join(', ')}</p>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<p>AI 분석 실패</p>';
    }
}

async function showArchive() {
    document.getElementById('news-list').classList.add('hidden');
    document.getElementById('analysis-view').classList.add('hidden');
    document.getElementById('archive-view').classList.remove('hidden');

    const container = document.getElementById('archive-container');
    container.innerHTML = '<p>기록을 불러오는 중...</p>';
    try {
        const res = await fetch(`${API_BASE}/history`);
        const history = await res.json();
        container.innerHTML = history.map(h => `
            <div class="news-card">
                <h3>${h.title}</h3>
                <p class="sentiment">감성: ${h.sentiment}</p>
                <small>${new Date(h.created_at).toLocaleString()}</small>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p>기록을 가져오는데 실패했습니다.</p>';
    }
}

function backToList() {
    document.getElementById('news-list').classList.remove('hidden');
    document.getElementById('analysis-view').classList.add('hidden');
    document.getElementById('archive-view').classList.add('hidden');
}

// 초기 로딩
fetchNews();
