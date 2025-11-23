import React, { useState } from 'react';
import { Settings, Zap, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Car } from '../types';

interface CarCardProps {
  car: Car;
  onEdit?: (car: Car) => void;
  onDelete?: (carId: string) => void;
}

const CarCard: React.FC<CarCardProps> = ({ car, onEdit, onDelete }) => {
  // Handle multiple images
  const images = Array.isArray(car.images) && car.images.length > 0 
    ? car.images 
    : car.image_url 
      ? [car.image_url] 
      : ["https://via.placeholder.com/800x600?text=No+Image"];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group bg-carbon-900 rounded-2xl border border-carbon-800 overflow-hidden hover:border-neon-cyan/50 transition-all hover:shadow-lg hover:shadow-neon-cyan/5 flex flex-col">
      {/* Image Gallery */}
      <div className="aspect-[3/2] relative overflow-hidden bg-carbon-950">
        <img 
          src={images[currentImageIndex]} 
          alt={`${car.make} ${car.model}`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Year Badge */}
        {car.year && (
          <div className="absolute top-3 left-3 bg-carbon-950/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-neon-cyan border border-neon-cyan/30 shadow-lg">
            {car.year}
          </div>
        )}

        {/* Category Badge */}
        {car.category && (
          <div className="absolute top-3 right-3 bg-neon-cyan/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-neon-cyan border border-neon-cyan/50 shadow-lg">
            {car.category}
          </div>
        )}

        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-carbon-950/80 hover:bg-carbon-900 backdrop-blur-sm p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-carbon-950/80 hover:bg-carbon-900 backdrop-blur-sm p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex 
                      ? 'w-6 bg-neon-cyan' 
                      : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
              {car.make} <span className="text-neon-cyan">{car.model}</span>
            </h3>
            <p className="text-carbon-400 text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-purple"></span>
              {car.color || 'Unknown Color'}
            </p>
          </div>
          
          {/* Action Buttons */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(car);
              }}
              className="p-2.5 hover:bg-carbon-800 rounded-lg transition-colors text-carbon-400 hover:text-neon-cyan flex-shrink-0"
              title="Edit car"
            >
              <Edit size={20} />
            </button>
          )}
        </div>
        
        {/* Specs */}
        <div className="bg-carbon-950 rounded-lg p-4 space-y-3 mb-4 border border-carbon-800 flex-1">
          <div className="flex justify-between items-start gap-3">
            <span className="text-carbon-500 text-sm whitespace-nowrap pt-0.5">Engine</span>
            <span className="text-carbon-200 font-mono text-sm text-right flex-1 leading-tight">
              {car.specs?.engine || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-carbon-500 text-sm whitespace-nowrap">Power</span>
            <span className="text-carbon-200 font-mono text-sm">
              {car.specs?.horsepower ? `${car.specs.horsepower} HP` : 'N/A'}
            </span>
          </div>
          {car.specs?.mods && car.specs.mods.length > 0 && (
            <div className="pt-3 border-t border-carbon-800">
              <span className="text-carbon-500 text-sm block mb-2">Mods</span>
              <div className="flex flex-wrap gap-1.5">
                {car.specs.mods.slice(0, 3).map((mod, idx) => (
                  <span key={idx} className="bg-carbon-800 text-carbon-300 text-xs px-2 py-1 rounded max-w-full truncate">
                    {mod}
                  </span>
                ))}
                {car.specs.mods.length > 3 && (
                  <span className="text-carbon-500 text-xs flex items-center">
                    +{car.specs.mods.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 mt-auto">
          <button className="flex-1 bg-carbon-800 hover:bg-carbon-700 text-white py-3 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2">
            <Settings size={18}/> Specs
          </button>
          <button className="flex-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 py-3 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2">
            <Zap size={18}/> Tune
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
