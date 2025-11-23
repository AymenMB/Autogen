import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, Save, Check, AlertCircle, Car as CarIcon } from 'lucide-react';
import { generateCarImageWithStyle } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { Car } from '../types';

// Style presets with detailed descriptions for prompt engineering
const STYLE_PRESETS = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk City',
    description: 'neon-lit cyberpunk cityscape with holographic billboards, rain-slicked streets reflecting purple and cyan lights, night scene with dramatic fog',
    icon: '🌆'
  },
  {
    id: 'snow',
    name: 'Snowy Mountain',
    description: 'snow-covered mountain pass with pristine white powder, evergreen trees laden with snow, crisp blue sky, cold misty atmosphere',
    icon: '🏔️'
  },
  {
    id: 'fire',
    name: 'Volcanic Eruption',
    description: 'dramatic volcanic landscape with glowing lava flows, intense orange and red flames reflecting on the vehicle, smoke and embers in the air, apocalyptic atmosphere',
    icon: '🌋'
  },
  {
    id: 'salt',
    name: 'Salt Flats',
    description: 'endless white salt flats stretching to the horizon, perfect mirror reflections, clear blue sky, minimalist desert landscape',
    icon: '🏜️'
  },
  {
    id: 'garage',
    name: 'Futuristic Garage',
    description: 'high-tech automotive garage with LED strip lighting, polished concrete floors, modern industrial aesthetic, dramatic spotlighting',
    icon: '🏢'
  },
  {
    id: 'diecast',
    name: 'Diecast Model',
    description: 'Create a photorealistic macro shot of a high-end 1/18 scale diecast model replica of a ${car.color} ${car.year} ${car.make} ${car.model}. The model is placed on a wooden hobbyist desk using a circular transparent acrylic base. Next to the car, place a premium glossy collector\'s packaging box printed with the original artwork of the ${car.model}. In the background, slightly out of focus, a computer monitor displays a 3D wireframe CAD design of the vehicle. Soft, warm indoor lighting.',
    icon: '🧸'
  },
  {
    id: 'rally',
    name: 'Rally Stage',
    description: 'A high-octane action shot of a ${car.color} ${car.year} ${car.make} ${car.model} drifting sideways around a tight gravel corner on a professional WRC rally circuit. Mud and dust are kicking up violently from the tires. The background is a motion-blurred pine forest indicating high speed. Dramatic golden hour lighting with lens flare. Cinematic composition.',
    icon: '🏁'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: '',
    icon: '✨'
  }
];

const Studio: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadingCars, setLoadingCars] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    fetchUserCars();
  }, []);

  const fetchUserCars = async () => {
    setLoadingCars(true);
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data && !error) {
          setCars(data as Car[]);
          if (data.length > 0) {
            setSelectedCar(data[0]);
          }
        }
      }
    }
    setLoadingCars(false);
  };

  const handleGenerate = async () => {
    if (!selectedCar) {
      setError("Please select a car from your garage first.");
      return;
    }

    if (selectedStyle.id === 'custom' && !customPrompt.trim()) {
      setError("Please enter a custom prompt or select a preset style.");
      return;
    }

    // Get the best available image
    const carImage = selectedCar.image_url ||
      (Array.isArray(selectedCar.images) && selectedCar.images.length > 0 ? selectedCar.images[0] : null);

    if (!carImage) {
      setError("This car doesn't have any images. Please add photos to your car first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const style = selectedStyle.id === 'custom' ? customPrompt : selectedStyle.id;
      const styleDescription = selectedStyle.id === 'custom' ? customPrompt : selectedStyle.description;

      const generatedImage = await generateCarImageWithStyle(
        carImage,
        style,
        styleDescription,
        {
          make: selectedCar.make,
          model: selectedCar.model,
          year: selectedCar.year,
          color: selectedCar.color
        }
      );

      setResult(generatedImage);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429')) {
        setError("Rate limit reached. Please wait a moment before trying again.");
      } else {
        setError(err.message || "Failed to generate image. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setCooldown(10); // Start 10s cooldown after any attempt
    }
  };

  const handleSave = async () => {
    if (!result || !selectedCar) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Convert base64 to blob
      const base64Response = await fetch(result);
      const blob = await base64Response.blob();

      // Upload to Supabase storage
      const fileName = `${user.id}/${Date.now()}-studio-${selectedCar.make}-${selectedCar.model}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('studio')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('studio').getPublicUrl(fileName);

      // Save to photoshoots table
      const { error: insertError } = await supabase.from('photoshoots').insert({
        user_id: user.id,
        car_id: selectedCar.id,
        prompt: selectedStyle.id === 'custom' ? customPrompt : selectedStyle.name,
        environment: selectedStyle.name,
        image_url: publicUrl,
        settings: {
          style: selectedStyle.id,
          carDetails: {
            make: selectedCar.make,
            model: selectedCar.model,
            year: selectedCar.year,
            color: selectedCar.color
          }
        }
      });

      if (insertError) throw insertError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save image.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-white">AI Studio</h2>
        <p className="text-text-secondary-dark">Generate photorealistic scenes with your cars using Gemini 2.5 Flash Image</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Controls Panel */}
        <div className="lg:col-span-1 space-y-6">

          {/* Car Selector */}
          <div className="bg-surface-dark p-6 rounded-2xl border border-white/10 space-y-4">
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              <CarIcon className="inline mr-2" size={16} />
              Select Your Car
            </label>

            {loadingCars ? (
              <div className="text-center py-8 text-carbon-500">Loading cars...</div>
            ) : cars.length === 0 ? (
              <div className="text-center py-8 text-carbon-500">
                <p className="mb-2">No cars in your garage yet.</p>
                <a href="#/garage" className="text-neon-cyan hover:underline text-sm">Add a car to get started →</a>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cars.map(car => (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCar(car)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedCar?.id === car.id
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-carbon-900 border border-carbon-800 hover:border-carbon-700'
                      }`}
                  >
                    <img
                      src={car.image_url}
                      alt={`${car.make} ${car.model}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{car.make} {car.model}</p>
                      <p className="text-xs text-carbon-500">{car.year} • {car.color}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Style Selector */}
          <div className="bg-surface-dark p-6 rounded-2xl border border-white/10 space-y-4">
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              <Sparkles className="inline mr-2" size={16} />
              Choose Style
            </label>

            <div className="grid grid-cols-2 gap-3">
              {STYLE_PRESETS.map(style => (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-4 rounded-xl cursor-pointer transition-all text-center ${selectedStyle.id === style.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-carbon-900 border border-carbon-800 hover:border-carbon-700'
                    }`}
                >
                  <div className="text-3xl mb-2">{style.icon}</div>
                  <p className="text-sm font-medium text-white">{style.name}</p>
                </div>
              ))}
            </div>

            {/* Custom Prompt Input */}
            {selectedStyle.id === 'custom' && (
              <div className="mt-4">
                <label className="block text-xs text-carbon-500 mb-2">Custom Environment</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe your scene: 'racing through a desert canyon at sunset with dust clouds trailing behind'..."
                  className="w-full bg-carbon-950 border border-carbon-700 rounded-xl p-3 text-white text-sm placeholder-carbon-600 focus:outline-none focus:border-neon-cyan h-24 resize-none"
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !selectedCar || cooldown > 0}
            className="w-full bg-gradient-to-r from-neon-cyan to-blue-500 text-carbon-950 font-bold py-4 rounded-xl shadow-lg hover:shadow-neon-cyan/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-carbon-950 border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <span className="material-symbols-outlined animate-spin">hourglass_empty</span>
                <span>Wait {cooldown}s</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Generate Scene</span>
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Preview Canvas */}
        <div className="lg:col-span-2 min-h-[600px] lg:h-[700px] bg-carbon-900 rounded-2xl border border-carbon-800 flex flex-col relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-carbon-900/80 z-10">
              <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-neon-cyan font-display text-lg animate-pulse">Creating your masterpiece...</p>
              <p className="text-xs text-carbon-500 mt-2">Powered by Gemini 2.5 Flash Image</p>
            </div>
          )}

          {result ? (
            <>
              <div className="flex-1 p-4 flex items-center justify-center">
                <img
                  src={result}
                  alt="Generated scene"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              </div>
              <div className="p-4 bg-carbon-950 border-t border-carbon-800 flex justify-between items-center">
                <div className="text-sm text-carbon-400">
                  {selectedCar && (
                    <span>{selectedCar.color} {selectedCar.year} {selectedCar.make} {selectedCar.model}</span>
                  )}
                  <span className="mx-2">•</span>
                  <span>{selectedStyle.name}</span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${saved
                    ? 'bg-green-600 text-white'
                    : 'bg-neon-cyan text-carbon-950 hover:bg-neon-cyan/90'
                    }`}
                >
                  {saved ? (
                    <>
                      <Check size={18} />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save to Gallery</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-carbon-600">
              <div className="w-32 h-32 bg-carbon-800 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="text-carbon-700" size={56} />
              </div>
              <p className="text-lg font-medium mb-2">Ready to create magic?</p>
              <p className="text-sm text-carbon-500">Select a car and style to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Studio;