exports.handler = async (event) => {
  // 1. CORS 및 옵션 요청 처리
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
    // 이모지 보존 및 JSON 출력 강제를 위해 프롬프트 보강
    const userPrompt = body.prompt + "\n\nIMPORTANT: Return ONLY a raw JSON object. Do not use markdown blocks. Preserve all emojis and special symbols exactly.";

    // [수정 포인트] 모델 경로에 'models/'를 명시하고 v1beta 엔드포인트를 사용합니다.
   const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;


    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }]
        // 불필요한 generationConfig를 제거하여 호환성 에러를 방지합니다.
      })
    });

    const data = await response.json();

    // API 응답 에러 핸들링
    if (data.error) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error.message })
      };
    }

    // 결과 텍스트 추출
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API");
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
