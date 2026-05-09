exports.handler = async (event) => {
  // CORS 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.GEMINI_API_KEY; 
  
  try {
    const body = JSON.parse(event.body);
    const userPrompt = body.prompt + "\n\nIMPORTANT: Return ONLY a raw JSON object. Do not use markdown blocks. Preserve all emojis and special symbols exactly.";

    // [수정포인트] 모델명을 'gemini-1.5-flash-latest'로 더 구체화하고 v1 엔드포인트를 사용합니다.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }]
      })
    });

    const data = await response.json();

    // API 에러 상세 출력 (디버깅용)
    if (data.error) {
      console.error("Gemini API Error Detail:", data.error);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `API 오류: ${data.error.message} (코드: ${data.error.code})` })
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("결과를 생성하지 못했습니다. 입력 문장을 확인해 주세요.");
    }

    const content = data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ content: content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
