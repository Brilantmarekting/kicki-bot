import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";

const app = express();
const server = createServer(app);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));
// TTS endpoint - OpenAI
app.post("/api/tts", async (req, res) => {
  try {
    const text = req.body?.text;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing 'text' in body" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    console.log("🔊 TTS request:", text.substring(0, 50));

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "nova",
        input: text,
        speed: 1.0
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ OpenAI TTS failed:", error);
      return res.status(response.status).json({ error });
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("✅ TTS generated:", audioBuffer.byteLength, "bytes");

    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error("❌ /api/tts error:", err);
    return res.status(500).json({ error: String(err) });
  }
});
// Chat endpoint - OpenAI GPT-4
app.post("/api/chat", async (req, res) => {
  console.log("📥 /api/chat called with:", req.body?.text?.substring(0, 50));
  
  try {
    const text = req.body?.text;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing 'text' in body" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    console.log("💬 Calling OpenAI...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Kicki, a friendly and knowledgeable beauty advisor. You help people with skincare, makeup, and beauty advice. Keep responses brief (under 25 words) and conversational. Be warm, professional, and helpful."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 40,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ OpenAI failed:", error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    console.log("✅ Reply:", reply);
    return res.json({ reply });

  } catch (err) {
    console.error("❌ /api/chat error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// TTS endpoint - OpenAI
app.post("/api/chat", async (req, res) => {
  console.log("📥 /api/chat called with:", req.body?.text?.substring(0, 50));

  try {
    const text = req.body?.text;
    const lang = req.body?.lang || "es";
    
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing 'text' in body" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    console.log("💬 Calling OpenAI in", lang);

    const systemPrompt = lang === "es" 
      ? "Eres Kicki, una asesora de belleza amigable y conocedora. Ayudas a las personas con cuidado de la piel, maquillaje y consejos de belleza. Mantén las respuestas breves (menos de 25 palabras) y conversacionales. Sé cálida, profesional y servicial. SIEMPRE responde en español."
      : "You are Kicki, a friendly and knowledgeable beauty advisor. You help people with skincare, makeup, and beauty advice. Keep responses brief (under 25 words) and conversational. Be warm, professional, and helpful. ALWAYS respond in English.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        max_tokens: 60,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ OpenAI failed:", error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    console.log("✅ Reply:", reply);
    return res.json({ reply });

  } catch (err) {
    console.error("❌ /api/chat error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// WebSocket for voice
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  const sessionId = crypto.randomUUID();
  console.log(`✅ Client connected [${sessionId}]`);

  let dgWs = null;

  try {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) throw new Error("Missing DEEPGRAM_API_KEY");

    const url = "wss://api.deepgram.com/v1/listen?model=nova-2&detect_language=true&punctuate=true&interim_results=true&encoding=linear16&sample_rate=16000&endpointing=300&utterance_end_ms=1000";

    dgWs = new WebSocket(url, { headers: { Authorization: `Token ${key}` } });

    dgWs.on("open", () => {
      console.log(`📡 Deepgram connected [${sessionId}]`);
    });

    dgWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const transcript = msg?.channel?.alternatives?.[0]?.transcript || "";
        const isFinal = !!msg?.is_final;

        if (transcript) {
          console.log(`🎤 [${sessionId}] ${isFinal ? "FINAL" : "partial"}: ${transcript}`);
          
          ws.send(JSON.stringify({
            type: isFinal ? "stt_final" : "stt_partial",
            text: transcript
          }));
        }
      } catch (e) {
        console.error("Error parsing Deepgram message:", e);
      }
    });

    dgWs.on("error", (err) => {
      console.error(`❌ Deepgram error [${sessionId}]:`, err);
    });

    dgWs.on("close", () => {
      console.log(`📡 Deepgram closed [${sessionId}]`);
    });

  } catch (err) {
    console.error("Failed to connect to Deepgram:", err);
    ws.send(JSON.stringify({ type: "error", message: "STT init failed" }));
  }

  ws.on("message", (data) => {
    if (Buffer.isBuffer(data) && dgWs?.readyState === WebSocket.OPEN) {
      dgWs.send(data);
    }
  });

  ws.on("close", () => {
    console.log(`❌ Client disconnected [${sessionId}]`);
    if (dgWs) dgWs.close();
  });

  ws.on("error", (err) => {
    console.error(`❌ WebSocket error [${sessionId}]:`, err);
  });

  ws.send(JSON.stringify({ type: "ready", sessionId }));
});

const port = Number(process.env.PORT || "3001");
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${port}/`);
  console.log(`📡 WebSocket on ws://localhost:${port}/ws`);
});