import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey, type = "text" } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is required" }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = "Invalid API key or request failed"

      if (response.status === 400) {
        errorMessage = data.error?.message || "Invalid API key format or request parameters"
      } else if (response.status === 403) {
        errorMessage = "API key is invalid or doesn't have permission to access Gemini API"
      } else if (response.status === 429) {
        errorMessage = "API quota exceeded. Please check your Gemini API usage limits"
      } else if (response.status >= 500) {
        errorMessage = "Gemini API service is temporarily unavailable"
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: data.error?.message || data,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated"

    return NextResponse.json({
      text: generatedText,
      type,
      success: true,
    })
  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json(
      {
        error: "Network error or invalid request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
