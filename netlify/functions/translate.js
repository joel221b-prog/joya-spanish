exports.handler = async (event) => {
  // 1. CORS 및 사전 검사(OPTIONS) 요청 처리
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

  // 2. POST 요청이 아닌 경우 차단
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 3. Netlify 환경변수에서 API 키 가져오기
  const API_KEY = process.env.GEMINI_API_KEY; 
  
  try {
    const body = JSON.parse(event.body);
    // 이모지 보존 및 JSON 출력 강제를 위해 프롬프트 보강
    const userPrompt = body.prompt + "\n\nIMPORTANT: Return ONLY a raw JSON object. Do not use markdown blocks. Preserve all emojis and special symbols exactly.";

    // [핵심] 가장 범용적인 v1beta 엔드포인트와 모델 경로 사용
   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    // 4. Gemini API 호출
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

    // 5. API 응답 에러 핸들링
    if (data.error) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `API 오류: ${data.error.message} (코드: ${data.error.code})` })
      };
    }

    // 6. 결과 데이터 추출 및 전달
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
    // 7. 시스템 에러 처리
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
