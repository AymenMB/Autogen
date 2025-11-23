
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Upload, Sparkles, Save, Car as CarIcon, Loader2 } from 'lucide-react';
import { supabase, mockCars } from '../services/supabaseClient';
import { analyzeCarUpload } from '../services/geminiService';
import { Car } from '../types';
import CarCard from '../components/CarCard';

const Garage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form State
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{url: string, base64: string, file: File}[]>([]);
  
  // We store the raw analysis here to save to DB later
  const [aiAnalysisRaw, setAiAnalysisRaw] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    category: '',
    specs: { engine: '', horsepower: '', mods: [] as string[] }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
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
        }
      }
    } else {
      setCars(mockCars as any);
    }
    setLoading(false);
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setIsAdding(true);
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year?.toString() || '',
      color: car.color || '',
      category: car.category || '',
      specs: {
        engine: car.specs?.engine || '',
        horsepower: car.specs?.horsepower?.toString() || '',
        mods: car.specs?.mods || []
      }
    });
    // Load existing images
    const existingImages = Array.isArray(car.images) && car.images.length > 0 
      ? car.images 
      : car.image_url 
        ? [car.image_url] 
        : [];
    setUploadedImages(existingImages.map((url, idx) => ({
      url,
      base64: '',
      file: new File([], `existing-${idx}.jpg`)
    })));
  };

  const handleDelete = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    
    try {
      if (!supabase) throw new Error("No backend");
      const { error } = await supabase.from('cars').delete().eq('id', carId);
      if (error) throw error;
      fetchCars();
    } catch (e: any) {
      alert("Failed to delete car: " + e.message);
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingCar(null);
    setUploadedImages([]);
    setAiAnalysisRaw(null);
    setFormData({ make: '', model: '', year: '', color: '', category: '', specs: { engine: '', horsepower: '', mods: [] } });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = e.target.files;
      const newImages: {url: string, base64: string, file: File}[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    newImages.push({
                        url: ev.target.result as string,
                        base64: (ev.target.result as string).split(',')[1],
                        file: file
                    });
                }
                resolve();
            };
            reader.readAsDataURL(file);
        });
      }

      setUploadedImages(prev => [...prev, ...newImages]);
      
      // Auto trigger analysis if it's the first batch and no manual data entered yet
      if (uploadedImages.length === 0 && newImages.length > 0 && formData.make === '') {
        analyzeImages(newImages.map(i => i.base64));
      }
    }
  };

  const analyzeImages = async (base64s: string[]) => {
    setAnalyzing(true);
    try {
      const resultJson = await analyzeCarUpload(base64s);
      const data = JSON.parse(resultJson);
      
      setAiAnalysisRaw(data); // Save raw data for DB

      setFormData(prev => ({
        ...prev,
        make: data.make || prev.make,
        model: data.model || prev.model,
        year: data.year?.toString() || prev.year,
        color: data.color || prev.color,
        specs: {
            engine: data.specs?.engine || prev.specs.engine,
            horsepower: data.specs?.horsepower?.toString() || prev.specs.horsepower,
            mods: data.specs?.mods || prev.specs.mods
        }
      }));
    } catch (e) {
      console.error("Analysis failed", e);
      alert("AI Analysis failed. Please fill details manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.make || !formData.model) {
        alert("Please enter Make and Model");
        return;
    }

    setUploading(true);
    try {
        if (!supabase) throw new Error("No backend");
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        // 1. Upload NEW Images to Storage (skip existing ones)
        const finalImageUrls: string[] = [];
        
        for (const img of uploadedImages) {
            // If it's an existing image (URL starts with http), keep it
            if (img.url.startsWith('http')) {
                finalImageUrls.push(img.url);
            } else {
                // Upload new image
                const fileName = `${user.id}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage
                    .from('garage')
                    .upload(fileName, img.file);
                
                if (data) {
                    const { data: { publicUrl } } = supabase.storage.from('garage').getPublicUrl(fileName);
                    finalImageUrls.push(publicUrl);
                } else {
                    console.warn("Storage upload failed, skipping image.", error);
                }
            }
        }

        const carData = {
            make: formData.make,
            model: formData.model,
            year: parseInt(formData.year) || null,
            color: formData.color,
            category: formData.category || null,
            specs: {
                engine: formData.specs.engine,
                horsepower: parseInt(formData.specs.horsepower) || null,
                mods: formData.specs.mods
            },
            image_url: finalImageUrls[0] || '', // Primary image
            images: finalImageUrls, // Array of all images as JSONB
            ai_analysis: aiAnalysisRaw,
            visual_description: aiAnalysisRaw?.visual_description || `${formData.color} ${formData.year} ${formData.make} ${formData.model}`,
            updated_at: new Date().toISOString()
        };

        // 2. Update or Insert into DB
        if (editingCar) {
            // Update existing car
            const { error } = await supabase.from('cars')
                .update(carData)
                .eq('id', editingCar.id);
            if (error) throw error;
        } else {
            // Insert new car
            const { error } = await supabase.from('cars').insert({
                ...carData,
                user_id: user.id
            });
            if (error) throw error;
        }

        cancelEdit();
        fetchCars();

    } catch (e: any) {
        console.error(e);
        alert("Failed to save car: " + e.message);
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-1">My Garage</h2>
          <p className="text-text-secondary-dark">Manage your digital showroom.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-carbon-900 border border-carbon-700 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
          >
            <option value="all" className="bg-carbon-900 text-white">All Categories</option>
            <option value="Sport" className="bg-carbon-900 text-white">Sport</option>
            <option value="Luxury" className="bg-carbon-900 text-white">Luxury</option>
            <option value="Classic" className="bg-carbon-900 text-white">Classic</option>
            <option value="SUV" className="bg-carbon-900 text-white">SUV</option>
            <option value="Supercar" className="bg-carbon-900 text-white">Supercar</option>
            <option value="Hypercar" className="bg-carbon-900 text-white">Hypercar</option>
            <option value="Sedan" className="bg-carbon-900 text-white">Sedan</option>
            <option value="Coupe" className="bg-carbon-900 text-white">Coupe</option>
            <option value="Convertible" className="bg-carbon-900 text-white">Convertible</option>
            <option value="Truck" className="bg-carbon-900 text-white">Truck</option>
            <option value="Electric" className="bg-carbon-900 text-white">Electric</option>
          </select>
          {!isAdding && (
              <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:bg-blue-600 whitespace-nowrap"
              >
              <Plus size={18} /> Add Car
              </button>
          )}
        </div>
      </div>

      {/* Add/Edit Car Wizard */}
      {isAdding && (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CarIcon className="text-neon-cyan" /> 
                    {editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h3>
                <button onClick={cancelEdit} className="text-carbon-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Image Upload */}
                <div className="space-y-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 hover:border-primary hover:bg-white/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[300px] relative overflow-hidden group"
                    >
                        {uploadedImages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 w-full h-full absolute inset-0 p-2 bg-carbon-900/50 overflow-y-auto">
                                {uploadedImages.map((img, idx) => (
                                    <img key={idx} src={img.url} className="w-full h-32 object-cover rounded-lg border border-carbon-600" alt="upload" />
                                ))}
                                <div className="flex items-center justify-center bg-carbon-800/80 rounded-lg h-32 border border-carbon-700">
                                    <Plus className="text-white" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <Upload className="text-carbon-500 mb-2 group-hover:text-neon-cyan transition-colors" size={40} />
                                <p className="text-carbon-400 font-medium">Upload photos for AI Analysis</p>
                                <p className="text-carbon-600 text-xs mt-2">Supports JPG, PNG</p>
                            </>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} multiple className="hidden" accept="image/*" />
                    
                    {uploadedImages.length > 0 && (
                         <button 
                            onClick={() => analyzeImages(uploadedImages.map(i => i.base64))}
                            disabled={analyzing}
                            className="w-full bg-carbon-800 hover:bg-carbon-700 text-neon-cyan border border-carbon-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                         >
                            {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                            {analyzing ? 'Analyzing...' : 'Re-Analyze with Gemini'}
                         </button>
                    )}
                </div>

                {/* Right: Details Form */}
                <div className="space-y-4">
                    {analyzing && (
                        <div className="bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan p-3 rounded-xl text-sm flex items-center gap-2 animate-pulse mb-4">
                            <Sparkles size={16} /> Gemini is extracting details from your photos...
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-neon-cyan mb-1 font-medium">Make</label>
                            <input 
                                type="text" 
                                value={formData.make} 
                                onChange={e => setFormData({...formData, make: e.target.value})}
                                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                                placeholder="e.g. Porsche" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neon-cyan mb-1 font-medium">Model</label>
                            <input 
                                type="text" 
                                value={formData.model} 
                                onChange={e => setFormData({...formData, model: e.target.value})}
                                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                                placeholder="e.g. 911 GT3" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-neon-cyan mb-1 font-medium">Year</label>
                            <input 
                                type="number" 
                                value={formData.year} 
                                onChange={e => setFormData({...formData, year: e.target.value})}
                                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                                placeholder="2024" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neon-cyan mb-1 font-medium">Color</label>
                            <input 
                                type="text" 
                                value={formData.color} 
                                onChange={e => setFormData({...formData, color: e.target.value})}
                                className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                                placeholder="Paint Color" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-neon-cyan mb-1 font-medium">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none"
                        >
                            <option value="">Select Category</option>
                            <option value="Sport">Sport</option>
                            <option value="Luxury">Luxury</option>
                            <option value="Classic">Classic</option>
                            <option value="SUV">SUV</option>
                            <option value="Supercar">Supercar</option>
                            <option value="Hypercar">Hypercar</option>
                            <option value="Sedan">Sedan</option>
                            <option value="Coupe">Coupe</option>
                            <option value="Convertible">Convertible</option>
                            <option value="Truck">Truck</option>
                            <option value="Electric">Electric</option>
                        </select>
                    </div>

                    <div className="border-t border-carbon-800 pt-4 mt-4">
                        <h4 className="text-sm font-bold text-white mb-3">Technical Specs</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-neon-cyan mb-1 font-medium">Engine</label>
                                <input 
                                    type="text" 
                                    value={formData.specs.engine} 
                                    onChange={e => setFormData({...formData, specs: {...formData.specs, engine: e.target.value}})}
                                    className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white text-sm"
                                    placeholder="4.0L Flat-6" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neon-cyan mb-1 font-medium">Horsepower</label>
                                <input 
                                    type="number" 
                                    value={formData.specs.horsepower} 
                                    onChange={e => setFormData({...formData, specs: {...formData.specs, horsepower: e.target.value}})}
                                    className="w-full bg-carbon-950 border border-carbon-700 rounded-lg p-3 text-white text-sm"
                                    placeholder="518" 
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs text-neon-cyan mb-1 font-medium">Detected Modifications</label>
                             <div className="flex flex-wrap gap-2">
                                {formData.specs.mods.map((mod, idx) => (
                                    <span key={idx} className="bg-carbon-800 text-carbon-200 text-xs px-2 py-1 rounded border border-carbon-700 flex items-center gap-1">
                                        {mod} <button onClick={() => {
                                            const newMods = formData.specs.mods.filter((_, i) => i !== idx);
                                            setFormData({...formData, specs: {...formData.specs, mods: newMods}});
                                        }} className="hover:text-white">×</button>
                                    </span>
                                ))}
                                <button 
                                    onClick={() => {
                                        const mod = prompt("Add modification:");
                                        if(mod) setFormData({...formData, specs: {...formData.specs, mods: [...formData.specs.mods, mod]}});
                                    }}
                                    className="bg-carbon-800 text-neon-cyan text-xs px-2 py-1 rounded border border-carbon-700 hover:border-neon-cyan"
                                >
                                    + Add
                                </button>
                             </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={handleSave}
                            disabled={uploading}
                            className="flex-1 bg-neon-cyan text-carbon-950 font-bold py-3 rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-neon-cyan/20"
                        >
                           {uploading ? <Loader2 className="animate-spin"/> : <Save size={18} />} 
                           {uploading ? 'Saving to Garage...' : 'Save Vehicle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Cars Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
             <Loader2 className="text-neon-cyan animate-spin" size={32} />
        </div>
      ) : cars.length === 0 && !isAdding ? (
         <div className="text-center py-20 text-carbon-500">
            <CarIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>Your garage is empty. Add your first car!</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 animate-in fade-in duration-500">
            {cars
              .filter(car => selectedCategory === 'all' || car.category === selectedCategory)
              .map((car) => (
              <CarCard 
                key={car.id} 
                car={car} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default Garage;
