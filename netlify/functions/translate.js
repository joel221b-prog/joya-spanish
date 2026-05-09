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
    const userPrompt = body.prompt + "\n\nIMPORTANT: Output only the raw JSON object. No markdown tags. Preserve all special symbols and emojis.";

    // 가장 안정적인 v1beta 엔드포인트와 모델 경로 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        // v1beta에서는 아래 설정을 다시 활성화하여 JSON 형식을 강제할 수 있습니다.
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();

    // API 내부 에러(모델 미지원 등)가 있는 경우 처리
    if (data.error) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error.message || 'API Error' })
      };
    }

    // 응답 데이터 추출
    if (!data.candidates || !data.candidates[0].content) {
      throw new Error('API 응답 형식이 올바르지 않습니다.');
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
