
export interface Car {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category?: string; // Sport, Classic, Luxury, SUV, etc.
  image_url: string; // Primary image URL
  images?: string[]; // Array of all image URLs stored as JSONB
  specs: {
    engine: string;
    horsepower: number;
    mods: string[];
  };
  ai_analysis?: any; // Raw JSON from Gemini
  visual_description?: string; // For image generation prompts
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  car_id?: string;
  photoshoot_id?: string;
  caption: string;
  media_url: string;
  media_type: 'image' | 'video';
  likes_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}
