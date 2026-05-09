exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.GEMINI_API_KEY; // 위에서 설정한 환경변수 이름
  
  try {
    const body = JSON.parse(event.body);
    // Gemini API 엔드포인트 (모델명: gemini-1.5-flash 추천)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: body.messages[0].content }] }]
      })
    });

    const data = await response.json();
    
    // 제미나이 응답 형식을 기존 HTML이 이해할 수 있게 가공
    const content = data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
