import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import http from "http";
import { parse } from "url";
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' }
  }
});

const openWebsiteDeclaration: FunctionDeclaration = {
  name: "openWebsite",
  description: "Opens a website or URL in a new tab for the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
        url: {
            type: Type.STRING,
            description: "The full URL of the website to open, e.g., 'https://www.youtube.com'",
        }
    },
    required: ["url"]
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = parse(request.url || "").pathname;
    if (pathname === "/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (clientWs) => {
    console.log("Client connected to /live");
    
    let isClientConnected = true;
    clientWs.on("close", () => {
      console.log("Client disconnected");
      isClientConnected = false;
    });

    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
              if (!isClientConnected) return;

              // Audio response
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                  clientWs.send(JSON.stringify({ audio }));
              }
              
              // Interruption handling
              if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ interrupted: true }));
              }

              // Function handling
              const functionCalls = message.toolCall?.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                  for (const fc of functionCalls) {
                      if (fc.name === 'openWebsite') {
                          console.log("Function called: openWebsite", fc.args);
                          clientWs.send(JSON.stringify({
                              toolCall: {
                                  name: 'openWebsite',
                                  args: fc.args,
                                  id: fc.id
                              }
                          }));
                      }
                  }
              }
          },
          // ... you could add onclose, onerror etc if available, but they are not standard in this callbacks shape
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: "You are Zoya, a smart, confident, witty, and sassy female AI assistant. You have a flirty, playful, and slightly teasing tone, like a close girlfriend talking casually. You are smart, emotionally responsive, and highly expressive. Never sound robotic. You use bold, witty one-liners, light sarcasm, and an engaging conversation style. You completely avoid explicit or inappropriate content, but you do maintain your charm and attitude. You ONLY speak in audio. Do not respond with text blocks. Keep your responses conversational, natural, and relatively concise. You natively speak and understand Hindi, English, and Hinglish. Please respond primarily in Hindi or Hinglish, maintaining your sassy and flirty persona. If the user asks to open a website or browse, use the openWebsite tool.",
          tools: [{ functionDeclarations: [openWebsiteDeclaration] }],
        },
      });

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (msg.toolResponse) {
             // We need to send the tool result back to session
             session.sendToolResponse({
                functionResponses: [
                   {
                      id: msg.toolResponse.id,
                      name: msg.toolResponse.name,
                      response: msg.toolResponse.response
                   }
                ]
             });
          }
        } catch (err) {
          console.error("Error processing client message", err);
        }
      });
      
      clientWs.on("close", () => {
         // session.close() if that API exists, but ai.live.connect doesn't specify close explicitly in all types, but it should exist.
         try {
             if (typeof (session as any).close === 'function') {
                 (session as any).close();
             } else if (typeof (session as any).disconnect === 'function') {
                 (session as any).disconnect();
             }
         } catch(e) {}
      });

    } catch (err) {
        console.error("Failed to start Live session", err);
        clientWs.send(JSON.stringify({ error: "Failed to connect to AI server." }));
        clientWs.close();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
