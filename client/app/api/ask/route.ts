import { NextRequest } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | string;
  content: string;
};

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const conversationId: string = body?.conversationId || "default-web-chat";

    const latestUserMessage = [...messages]
      .reverse()
      .find((m) => m?.role === "user" && typeof m?.content === "string")
      ?.content
      ?.trim();

    if (!latestUserMessage) {
      return Response.json({ reply: "Please enter a message." }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: latestUserMessage,
        conversationId,
      }),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return Response.json(
        {
          reply: data?.error || "AI service request failed.",
        },
        { status: backendRes.status }
      );
    }

    return Response.json({
      reply: data?.summary || "No response generated.",
      chartType: data?.chartType || null,
      chartData: data?.chartData || [],
      tableData: data?.tableData || [],
      followUps: data?.followUps || [],
      context: data?.context || null,
    });
  } catch (_err) {
    return Response.json(
      { reply: "Something went wrong reaching the AI service." },
      { status: 500 }
    );
  }
}
