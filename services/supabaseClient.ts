import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Check if keys are available. If not, we will need to handle it gracefully in the UI.
const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isConfigured = () => !!supabase;

// Helper to simulate data if no backend connected
export const mockCars = [
  {
    id: '1',
    user_id: 'u1',
    make: 'Porsche',
    model: '911 GT3 RS',
    year: 2024,
    color: 'Ruby Star Neo',
    specs: { engine: '4.0L Flat-6', horsepower: 518, mods: ['Carbon Ceramic Brakes', 'Weissach Package'] },
    image_url: 'https://picsum.photos/id/111/800/600',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'u1',
    make: 'Nissan',
    model: 'Skyline GT-R R34',
    year: 1999,
    color: 'Bayside Blue',
    specs: { engine: 'RB26DETT', horsepower: 276, mods: ['Nismo Exhaust', 'TE37 Wheels'] },
    image_url: 'https://picsum.photos/id/133/800/600',
    created_at: new Date().toISOString()
  }
];
