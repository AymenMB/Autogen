
import { GoogleGenAI, Type } from "@google/genai";
import {
  MODEL_GEMINI_3_PRO,
  MODEL_GEMINI_3_PRO_IMAGE,
  MODEL_GEMINI_2_5_FLASH,
  MODEL_GEMINI_2_5_FLASH_IMAGE,
  MODEL_VEO
} from "../constants";

const getAiClient = (useUserSelectedKey: boolean = false) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MISSING_KEY') {
    console.warn("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
};

/* --- GENERATE IMAGE --- */
export const generateCarImage = async (
  prompt: string,
  size: '1K' | '2K' | '4K',
  aspectRatio: '16:9' | '1:1' | '3:4' = '16:9'
) => {
  const ai = getAiClient(true);
  const response = await ai.models.generateContent({
    model: MODEL_GEMINI_3_PRO_IMAGE,
    contents: prompt,
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

/* --- EDIT IMAGE --- */
export const editCarImage = async (base64Image: string, prompt: string, mimeType: string = 'image/jpeg') => {
  const ai = getAiClient(false);
  const response = await ai.models.generateContent({
    model: MODEL_GEMINI_2_5_FLASH_IMAGE,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image returned");
};

/* --- ANALYZE IMAGE (General) --- */
export const analyzeCarImage = async (base64Image: string, prompt: string, mimeType: string = 'image/jpeg') => {
  const ai = getAiClient(false);
  const response = await ai.models.generateContent({
    model: MODEL_GEMINI_3_PRO,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        { text: prompt || "Analyze this car. Identify make, model, potential modifications, and estimate the year." }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          make: { type: Type.STRING },
          model: { type: Type.STRING },
          year: { type: Type.STRING },
          modifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          analysis: { type: Type.STRING },
          specs: {
            type: Type.OBJECT,
            properties: {
              engine: { type: Type.STRING },
              horsepower: { type: Type.STRING }
            }
          }
        }
      }
    }
  });
  return response.text;
};

/* --- GARAGE AUTO-FILL ANALYSIS --- */
export const analyzeCarUpload = async (base64Images: string[]) => {
  const ai = getAiClient(false);

  // Prepare parts
  const parts: any[] = base64Images.map(img => ({
    inlineData: {
      data: img,
      mimeType: 'image/jpeg'
    }
  }));

  parts.push({ text: "Analyze these car images. Identify the make, model, estimated year (integer), specific color name (e.g., 'Miami Blue'), engine type, horsepower (integer), and any visible modifications (e.g., 'Aftermarket Wheels', 'Wing')." });

  const response = await ai.models.generateContent({
    model: MODEL_GEMINI_3_PRO, // Using Pro for complex reasoning on car specs
    contents: {
      parts: parts
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          make: { type: Type.STRING },
          model: { type: Type.STRING },
          year: { type: Type.INTEGER },
          color: { type: Type.STRING },
          specs: {
            type: Type.OBJECT,
            properties: {
              engine: { type: Type.STRING },
              horsepower: { type: Type.INTEGER },
              mods: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        required: ["make", "model", "color"]
      }
    }
  });

  return response.text;
}

/* --- GENERATE VIDEO --- */
export const generateCarVideo = async (
  prompt: string,
  base64Image?: string,
  mimeType?: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
) => {
  const ai = getAiClient(true);

  let operation;

  if (base64Image && mimeType) {
    operation = await ai.models.generateVideos({
      model: MODEL_VEO,
      prompt: prompt || "Cinematic shot",
      image: {
        imageBytes: base64Image,
        mimeType: mimeType
      },
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });
  } else {
    operation = await ai.models.generateVideos({
      model: MODEL_VEO,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });
  }

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const videoRes = await fetch(`${videoUri}&key=${apiKey}`);
  const videoBlob = await videoRes.blob();
  return URL.createObjectURL(videoBlob);
};

/* --- GROUNDED SEARCH --- */
export const searchCarInfo = async (query: string) => {
  const ai = getAiClient(false);
  const response = await ai.models.generateContent({
    model: MODEL_GEMINI_2_5_FLASH,
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

/* --- PROMPT ENGINEERING FOR STUDIO --- */
/**
 * Constructs a detailed, photorealistic prompt following Gemini prompt engineering best practices.
 * This function creates narrative structures optimized for image generation.
 * 
 * @param style - Style preset ID or custom style description
 * @param styleDescription - Detailed environment description
 * @param carDetails - Car specifications (make, model, year, color)
 */
export const constructPrompt = (
  style: string,
  styleDescription: string,
  carDetails: { make: string; model: string; year?: number; color?: string }
): string => {
  const { make, model, year, color } = carDetails;

  // Base vehicle description
  const vehicleDesc = `${color || 'sleek'} ${year || ''} ${make} ${model}`.trim();

  // Handle Narrative Styles (Diecast & Rally)
  if (style === 'diecast' || style === 'rally') {
    let prompt = styleDescription;
    prompt = prompt.replace(/\${car.make}/g, make);
    prompt = prompt.replace(/\${car.model}/g, model);
    prompt = prompt.replace(/\${car.year}/g, (year || '').toString());
    prompt = prompt.replace(/\${car.color}/g, color || 'painted');
    return prompt;
  }

  // Style-specific lighting and atmosphere for standard styles
  const styleEnhancements: Record<string, string> = {
    cyberpunk: 'The lighting is cinematic with neon reflections dancing across the car\'s glossy paint. Holographic advertisements cast purple and cyan hues. Rain creates mirror-like puddles reflecting the urban chaos above.',
    snow: 'Crisp, cold lighting with soft shadows on the pristine snow. The car\'s tires kick up powdery snow creating dramatic trails. Misty atmosphere with sunlight breaking through clouds creating lens flares.',
    fire: 'Intense orange and red lighting from volcanic activity illuminates the scene. Dramatic flames and embers reflect off the car\'s metallic surfaces. Smoke creates atmospheric depth with glowing lava providing rim lighting.',
    salt: 'Bright, even natural lighting with crystal-clear visibility. Perfect mirror reflections on the salt flat surface. Minimal shadows creating a surreal, minimalist composition with endless horizon.',
    garage: 'Professional studio lighting with dramatic LED accent strips. Polished concrete reflects the vehicle. Modern industrial aesthetic with focused spotlights highlighting the car\'s contours and details.',
  };

  const lightingDesc = styleEnhancements[style] || 'The lighting is dramatic and cinematic, highlighting every detail of the vehicle with professional photography techniques.';

  // Construct the full narrative prompt for standard styles
  const prompt = `A photorealistic, ultra high-resolution shot of a ${vehicleDesc}. The car is positioned as the hero subject in ${styleDescription}. ${lightingDesc} The image has the quality of professional automotive photography with perfect composition, sharp focus, and rich detail. Camera: shot with a professional wide-angle lens, shallow depth of field, automotive magazine quality.`;

  return prompt;
};

/* --- GENERATE CAR IMAGE WITH STYLE (Studio Feature) --- */
/**
 * Generates a stylized car image using the car's photo and engineered prompt.
 * Uses gemini-2.5-flash-image (Nano Banana Flash) for fast, quality results.
 * 
 * @param carImageUrl - URL or base64 of the user's car photo
 * @param style - Style preset ID
 * @param styleDescription - Detailed environment description
 * @param carDetails - Car specifications for prompt engineering
 */
export const generateCarImageWithStyle = async (
  carImageUrl: string,
  style: string,
  styleDescription: string,
  carDetails: { make: string; model: string; year?: number; color?: string }
): Promise<string> => {
  const ai = getAiClient(false);

  // Construct the engineered prompt
  const prompt = constructPrompt(style, styleDescription, carDetails);

  // Fetch and convert the car image
  let imageData: string;
  let mimeType: string;

  if (carImageUrl.startsWith('data:')) {
    // Already base64
    imageData = carImageUrl.split(',')[1];
    mimeType = carImageUrl.match(/:(.*?);/)?.[1] || 'image/jpeg';
  } else {
    // Fetch from URL
    const response = await fetch(carImageUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    imageData = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    mimeType = blob.type || 'image/jpeg';
  }

  // Call Gemini 2.5 Flash Image API
  const response = await ai.models.generateContent({
    model: MODEL_GEMINI_2_5_FLASH_IMAGE,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  // Extract generated image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated from Gemini Flash Image API");
};
