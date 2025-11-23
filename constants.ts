export const APP_NAME = "AutoGen";

// Supabase Configuration - Project: AutoGen (ID: eqacvrjbalyiodhohexy)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eqacvrjbalyiodhohexy.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYWN2cmpiYWx5aW9kaG9oZXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4Mzk2MzcsImV4cCI6MjA3OTQxNTYzN30.gUPUGC7QdF3QuF9hmxf5rUzxzsjbnuI4ur-d6SRHQ6s';

// Gemini Models
export const MODEL_GEMINI_3_PRO = 'gemini-3-pro-preview';
export const MODEL_GEMINI_3_PRO_IMAGE = 'gemini-3-pro-image-preview';
export const MODEL_GEMINI_2_5_FLASH = 'gemini-2.5-flash';
export const MODEL_GEMINI_2_5_FLASH_IMAGE = 'gemini-2.5-flash-image';
export const MODEL_VEO = 'veo-3.1-fast-generate-preview';

export const GOOGLE_SEARCH_TOOL = { googleSearch: {} };

// Placeholder images
export const PLACEHOLDER_CAR_1 = "https://loremflickr.com/800/600/car?lock=1";
export const PLACEHOLDER_CAR_2 = "https://loremflickr.com/800/600/car?lock=2";
export const PLACEHOLDER_AVATAR = "https://loremflickr.com/100/100/portrait?lock=3";

export const getCarImageUrl = (query: string): string => {
    const encodedQuery = encodeURIComponent(`${query} car photorealistic 4k`);
    return `https://image.pollinations.ai/prompt/${encodedQuery}`;
};
