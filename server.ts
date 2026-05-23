import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API client to avoid startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI services will run in offline simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

// API Endpoint: Generate PDF Structured Elements using Gemini AI
app.post("/api/gemini/gen-pdf", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const client = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MOCK_KEY") {
    // Offline simulated responses
    return res.json({
      title: "Simulated AI PDF - " + prompt.slice(0, 20),
      theme: "Modern Slate",
      sections: [
        {
          heading: "Introduction",
          body: `This is a simulated high-quality section generated in response to your query "${prompt}". To enable authentic real-time Gemini AI generations, simply attach a valid Gemini API Key inside Settings > Secrets.`
        },
        {
          heading: "Core Concepts",
          body: "SOFTDRIVE integrates seamless automated offline fallback modules to maintain optimal user flow, visual consistency, and reactive components at all times."
        },
        {
          heading: "Executive Summary",
          body: "A gorgeous layout pairing featuring Inter and JetBrains Mono fonts, complete with custom download packages to organize PDFs directly into your softdrive cloud sandbox."
        }
      ]
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Draft an elegant, professional, highly detailed PDF document structure about: "${prompt}". Make sure there is high utility, and distinct headings and body texts.`,
      config: {
        systemInstruction: "You are an expert document layout expert. Generate a structured JSON response. Do not include standard markdown formatting outside of the schema bounds.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Elegant title of the document." },
            theme: { type: Type.STRING, description: "Visual mood or theme pairing recommendation, e.g. 'Professional Corporate', 'Creative Neon', 'Technical Clean', 'Editorial Warm'" },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING, description: "Heading or section title" },
                  body: { type: Type.STRING, description: "Paragraph text with rigorous, useful contents for this section." }
                },
                required: ["heading", "body"]
              }
            }
          },
          required: ["title", "theme", "sections"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini PDF generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate PDF content via Gemini" });
  }
});

// API Endpoint: Generate Video Storyboard using Gemini AI
app.post("/api/gemini/gen-video", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const client = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MOCK_KEY") {
    // Offline simulated responses or storyboard suggestions
    return res.json({
      title: "AI Space Chase (Simulation)",
      scenes: [
        {
          id: "sc-1",
          title: "The Neon Signal",
          subtitle: "An astronaut detects an anomalous radar pulse in deep space.",
          duration: 4,
          environment: "cyberpunk",
          particles: "stars",
          character: "astronaut",
          movement: "float"
        },
        {
          id: "sc-2",
          title: "Matrix Convergence",
          subtitle: "Transmitting binary decryption coordinates into the holographic portal.",
          duration: 5,
          environment: "matrix",
          particles: "dust",
          character: "robot",
          movement: "pulse"
        },
        {
          id: "sc-3",
          title: "Serene Dawn Landing",
          subtitle: "Touching down on the beautiful cybernetic shoreline at dawn.",
          duration: 5,
          environment: "sunset",
          particles: "bubbles",
          character: "bird",
          movement: "glide"
        }
      ]
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Design a creative, highly entertaining multi-scene storyboard sequence for an animated video about: "${prompt}". Create 3 separate scenes that fit perfectly together as a cinematic timeline narrative.`,
      config: {
        systemInstruction: "You are a professional Creative Storyboard Director. Fill each scene with distinct animated components and custom text overlays that convey a cohesive mini story.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "An exciting title for the animation video." },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique scene id e.g. sc-1" },
                  title: { type: Type.STRING, description: "A gorgeous scene title" },
                  subtitle: { type: Type.STRING, description: "Subtitles overlay text for narration (2-3 detailed sentences)" },
                  duration: { type: Type.INTEGER, description: "Timing in seconds (value between 3 and 7)" },
                  environment: { 
                    type: Type.STRING, 
                    enum: ["cyberpunk", "serene", "sunset", "matrix", "aurora"],
                    description: "Ambient visual scene background environment"
                  },
                  particles: {
                    type: Type.STRING,
                    enum: ["none", "snow", "stars", "bubbles", "dust"],
                    description: "The particle effect aesthetic overlay"
                  },
                  character: {
                    type: Type.STRING,
                    enum: ["none", "robot", "astronaut", "ninja", "bird"],
                    description: "Active animated sprite character preset used in scene"
                  },
                  movement: {
                    type: Type.STRING,
                    enum: ["steady", "float", "glide", "pulse", "spin"],
                    description: "Physical physics motion animation for character"
                  }
                },
                required: ["id", "title", "subtitle", "duration", "environment", "particles", "character", "movement"]
              }
            }
          },
          required: ["title", "scenes"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Video creation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate video sequence via Gemini" });
  }
});

// API Endpoint: Generate Creative Dynamic Photo/Image using Gemini Imagen Model
app.post("/api/gemini/gen-photo", async (req, res) => {
  const { prompt, aspectRatio = "1:1", style = "photorealistic" } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const client = getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MOCK_KEY") {
    // Generate a beautiful simulated photo using picsum seed or dynamic placeholder
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 50);
    const mockSeed = Math.abs(cleanPrompt.split("").reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0));
    return res.json({
      title: "AI Photo: " + prompt.slice(0, 30),
      prompt: prompt,
      style: style,
      aspectRatio: aspectRatio,
      imageUrl: `https://picsum.photos/seed/${mockSeed}/800/800`,
      isMock: true
    });
  }

  try {
    const response = await client.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: `A high fidelity, stunningly beautiful, ${style} scene of: "${prompt}". Highly detailed composition, clean colors.`,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: aspectRatio, // "1:1", "3:4", "4:3", "9:16", "16:9"
      }
    });

    const generatedImage = response.generatedImages?.[0];
    const imageBytes = generatedImage?.image?.imageBytes;

    if (!imageBytes) {
      throw new Error("No image data returned from Imagen model");
    }

    const dataUrl = `data:image/jpeg;base64,${imageBytes}`;
    res.json({
      title: "AI Photo: " + prompt.slice(0, 30),
      prompt: prompt,
      style: style,
      aspectRatio: aspectRatio,
      imageUrl: dataUrl,
      isMock: false
    });
  } catch (error: any) {
    console.error("Gemini Photo generation error:", error);
    // Graceful fallback to Picsum Photos
    const mockSeed = prompt.length + Date.now() % 1000;
    res.json({
      title: "AI Photo (Adaptive Fallback)",
      prompt: prompt,
      style: style,
      aspectRatio: aspectRatio,
      imageUrl: `https://picsum.photos/seed/${mockSeed}/800/800`,
      isMock: true,
      error: error.message
    });
  }
});

// Serve frontend build output or run Vite dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SOFTDRIVE server running on http://localhost:${PORT}`);
  });
}

startServer();
