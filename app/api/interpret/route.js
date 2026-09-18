import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const { promptText, imageBase64 } = await request.json();

    if (!promptText) {
      return Response.json({ error: "promptText가 없습니다." }, { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY; // ⚠️ NEXT_PUBLIC_ 접두사 없음! 서버 전용
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    let contentsArray = [promptText];
    if (imageBase64) {
      contentsArray.push({
        inlineData: { mimeType: "image/jpeg", data: imageBase64 },
      });
    }

    // 최신 사용 가능한 모델 순서대로 시도
    const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];
    let response;
    let lastError;

    for (const model of modelsToTry) {
      const maxRetries = 1;

      for (let i = 0; i <= maxRetries; i++) {
        try {
          response = await ai.models.generateContent({ model, contents: contentsArray });
          break;
        } catch (err) {
          lastError = err;
          const status = err?.status || err?.error?.code;
          const isOverloaded =
            status === 503 ||
            status === "UNAVAILABLE" ||
            (err.message && err.message.includes("503")) ||
            (err.message && err.message.includes("overloaded")) ||
            (err.message && err.message.includes("high demand"));

          // 과부하가 아니면(404, 401 등) 이 모델은 포기하고 바로 다음 모델로 넘어감
          if (!isOverloaded) break;

          if (i < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }
      if (response) break; // 성공했으면 fallback 루프 탈출
    }

    if (!response) {
      throw lastError || new Error("모든 모델 호출에 실패했습니다.");
    }

    return Response.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API 에러 상세:", error?.message, error?.status, error?.error);
    return Response.json(
      {
        error: "AI 서버가 지금 너무 바쁩니다. 잠시 후 다시 시도해주세요.",
        debugMessage: error?.message || String(error),
      },
      { status: 503 }
    );
  }
}