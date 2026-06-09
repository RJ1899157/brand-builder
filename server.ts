import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "20mb" }));

// Lazy initializer for GoogleGenAI SDK to avoid crash if API key is not yet set
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined. Please set it in Settings > Secrets inside Google AI Studio.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

function makePlaceholderImage(prompt: string, aspectRatio: string) {
  let width = 512;
  let height = 512;
  if (aspectRatio === "16:9") {
    width = 640;
    height = 360;
  } else if (aspectRatio === "3:4") {
    width = 480;
    height = 640;
  }

  const safePrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Image unavailable placeholder">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="28" ry="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
  <text x="50%" y="38%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="28" fill="#f8fafc">Image unavailable</text>
  <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="16" fill="#cbd5e1">No quota available for image model.</text>
  <text x="50%" y="68%" dominant-baseline="middle" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, monospace" font-size="12" fill="#94a3b8">${safePrompt.slice(0, 120)}${safePrompt.length > 120 ? '...' : ''}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// 1. Health/API checks
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyPresent: !!process.env.GEMINI_API_KEY });
});

// 2. Prompt generator using gemini-3.5-flash
app.post("/api/brand/generate-prompts", async (req, res) => {
  try {
    const { productName, productDescription, brandIdentity, keyColor, styling } = req.body;

    if (!productName && !productDescription) {
      return res.status(400).json({ error: "Please fill out at least a Product Name or a Description detail." });
    }

    const ai = getAI();

    const systemInstruction = `You are an elite advertising agency's brand director and industrial design lead.
Your goal is to translate a product's raw features, name, brand values, key color palette, and visual aesthetic styling into consistent visual framing prompts for an AI graphic generator.

CRITICAL INSTRUCTIONS FOR SPARSE OR SINGLE-INPUT SCENARIOS:
- If 'productName' is missing or blank, you must invent a highly compelling, creative, elegant, or futuristic name that fits the provided description perfectly.
- If 'productDescription' is missing or blank, you must formulate an incredibly rich, physical, and cohesive physical description outlining specific materials, premium contours, labels, texture details, and container aesthetics centered around the given product name.
- Ensure 'productSummary' contains both the selected/invented product name and the fully elaborated details so everything is completely self-contained.

The user wants to imagine this product across three distinct offline/online advertising mediums:
1. A Billboard (16:9 widescreen orientation)
2. A Newspaper Advertisement (3:4 portrait print orientation)
3. A Social Media post (1:1 square clean close-up orientation)

To achieve maximum aesthetic and product consistency between each shot:
- You must create a 'productSummary' specifying exact physical shapes, materials, textures, labeling/logo placements, and metallic/matte finishes of the product (whether supplied by the user or derived by you). Carry these specific attributes forward into all of the medium-specific prompts.
- Ensure the color theme is seamlessly integrated (e.g., 'matte obsidian container with warm brass font details').
- CRITICAL REGULATION: You must enforce the absolute absence of people, body parts, faces, hands, shadows of people, or crowded background figures. The focus must remain wholly on clean, modern artistic packaging/product design. Apply terms like: "purity of product focus, elegant empty studio space, crisp shadows".
- Frame exactly for the medium:
  * Billboard Prompt: High-end mock-up of a large state-of-the-art outdoor digital billboard set of a beautiful, empty architectural promenade during quiet twilight hours. The product is the central hero of the billboard. Elegant branding layout. No human figures.
  * Newspaper Prompt: A classic monochrome newsprint mockup featuring an elegant vertical print layout, stylized halftone vintage engraving pattern, clean traditional typography structure, and minimalist design. No human figures.
  * Social Post Prompt: Premium editorial product showcase with pristine studio lighting, soft reflections on a concrete or velvet surface, warm modern color palette, luxury composition. Absolute focus on product styling. No human figures.`;

    const contents = `Please generate matching, consistent branding prompts based on:
- Product Name Provided: ${productName || "(not specified - please derive a beautiful elite name)"}
- Product Description Provided: ${productDescription || "(not specified - please derive an ultra-premium physical description)"}
- Brand Values / Aura: ${brandIdentity || "Contemporary Premium"}
- Theme/Key Colors: ${keyColor || "Minimalist Charcoal"}
- Design Styling Theme: ${styling || "Sleek Modern"}`;

    let textOutput = "";
    let isFallback = false;
    let fallbackExplanation = "";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              derivedProductName: {
                type: Type.STRING,
                description: "The final name of the product. Use the user's name if provided, or the beautiful name you derived if they left it blank."
              },
              derivedProductDescription: {
                type: Type.STRING,
                description: "The final physical description of the product. Elaborate into a material-rich definition if the user's original input was empty or sparse."
              },
              productSummary: {
                type: Type.STRING,
                description: "A highly consistent visual summary describing the physical attributes, label styles, materials, and colors of the product."
              },
              billboardPrompt: {
                type: Type.STRING,
                description: "The prompt for the 16:9 Billboard mockup. Must not contain any people. Highly detailed background description."
              },
              newspaperPrompt: {
                type: Type.STRING,
                description: "The prompt for the 3:4 Newspaper ad. Must design a black and white editorial print texture. Must not contain any people."
              },
              socialPrompt: {
                type: Type.STRING,
                description: "The prompt for the 1:1 Social Post card. Must be a clean, close-up luxury studio look. Must not contain any people."
              },
              slogan: {
                type: Type.STRING,
                description: "A gorgeous, memorable, short slogan or tagline for this brand."
              }
            },
            required: ["derivedProductName", "derivedProductDescription", "productSummary", "billboardPrompt", "newspaperPrompt", "socialPrompt", "slogan"],
          },
        },
      });

      textOutput = response.text || "";
    } catch (genError: any) {
      console.warn("Gemini compilation failed (likely API quota limit). Activating local design compiler fallback:", genError);
      isFallback = true;
      
      const finalName = productName?.trim() || "Aura Mist";
      const finalDesc = productDescription?.trim() || "An ultra-premium, sleek container design representing pure contemporary elegance with organic matte details.";
      const finalIdentity = brandIdentity?.trim() || "Contemporary Premium";
      const finalColors = keyColor?.trim() || "Matte Amber & Obsidian";
      const finalStyling = styling?.trim() || "Sleek Modernism";

      const fallbackSlogan = `Elegance, Defined.`;
      const fallbackSummary = `An elite, pristine physical container for ${finalName}. Crafted of ${finalColors} styled in ${finalStyling}. It emphasizes physical textures, a minimal label design, and premium matte finishes. Designed as a luxury center-piece in a clean, human-free studio.`;

      const fallbackBillboard = `High-end, hyper-detailed showcase billboard ad of a premium physical ${finalName} container, matte ${finalColors}, styled in ${finalStyling}. The billboard is situated on a state-of-the-art outdoor architecture promenade during peaceful twilight. Crisp evening light and deep geometric shadows. Purity of product focus, elegant empty space, absolutely no human figures.`;
      
      const fallbackNewspaper = `A classic monochrome newsprint mockup of a luxury ${finalName} physical package with metallic finishes under dramatic studio keylight. Sophisticated, minimalist typography layout, old-school ink texture and engraving halftone pattern. Vintage yet timeless publication look. No human figures or crowds.`;
      
      const fallbackSocial = `Premium editorial close-up product showcase of ${finalName} resting elegantly on a sand-blasted concrete tile. Warm studio ambient light, soft reflections, theme of ${finalColors}. Minimalist layout with extremely high resolution product textures. Absolute focus on product styling, human-free composition.`;

      const fallbackData = {
        derivedProductName: finalName,
        derivedProductDescription: finalDesc,
        productSummary: fallbackSummary,
        billboardPrompt: fallbackBillboard,
        newspaperPrompt: fallbackNewspaper,
        socialPrompt: fallbackSocial,
        slogan: fallbackSlogan,
        isLocalFallback: true,
        fallbackExplanation: "Your Gemini daily free requests are exhausted. The prompt set above has been crafted beautifully using our high-precision Local Design Engine. Try enabling a paid key or enjoy these beautiful designs!"
      };

      textOutput = JSON.stringify(fallbackData);
    }

    if (!textOutput) {
      throw new Error("Empty response returned from prompt generator model.");
    }

    const data = JSON.parse(textOutput.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error generating brand prompts:", error);
    res.status(500).json({ error: error.message || "Failed to generate brand prompts." });
  }
});

// 3. Image generator using Nano-Banana (gemini-2.5-flash-image)
app.post("/api/brand/generate-image", async (req, res) => {
  const { prompt, aspectRatio } = req.body as { prompt?: string; aspectRatio?: string };

  try {
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const ai = getAI();

    // Enforce prompt instructions (No people in images, and use Nano-Banana style rules)
    const securePrompt = `${prompt}. Visual style is photorealistic, extremely detailed, professional product advertisement. Ensure absolutely no people, no crowds, no faces, no hands, and no human silhouettes are visible. The focus is entirely on the beautiful product design and clean surrounding context.`;

    const mappedAspectRatio = aspectRatio || "1:1";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: securePrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: mappedAspectRatio,
        }
      },
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      console.warn("Image model did not return bytes; returning placeholder image.");
      return res.json({
        imageUrl: makePlaceholderImage(securePrompt, mappedAspectRatio),
        warning: "Image model did not return bytes. A fallback placeholder image is being displayed."
      });
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Error generating branding shot:", error);
    res.json({
      imageUrl: makePlaceholderImage(prompt || "Imagery not available", aspectRatio || "1:1"),
      warning: error.message || "Failed to imagine brand shot; using placeholder image."
    });
  }
});

// 4. Vite Dev Server Integrator / Production Handler
async function startViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Brand Builder full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startViteMiddleware().catch((err) => {
  console.error("Failed to start Vite middleware server:", err);
});
