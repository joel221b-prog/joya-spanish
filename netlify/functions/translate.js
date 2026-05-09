exports.handler = async (event) => {
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
    // 모델이 확실히 JSON만 출력하도록 프롬프트 뒤에 강제 문구를 붙입니다.
    const userPrompt = body.prompt + "\n\nIMPORTANT: Return ONLY a valid JSON object. Do not include markdown code blocks like ```json.";

    const url = `[https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=$){API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }]
        // 에러가 났던 generationConfig 부분을 제거하여 호환성을 확보합니다.
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message })
      };
    }

    // 응답 텍스트 추출
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
