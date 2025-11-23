import React from 'react';
import { PLACEHOLDER_CAR_1, PLACEHOLDER_CAR_2, getCarImageUrl } from '../constants';

const Discover: React.FC = () => {
  const featuredCars = [
    {
      id: 1,
      title: 'Porsche 911 GT3 RS',
      category: 'Sports Car',
      year: 2024,
      image: getCarImageUrl('Porsche 911 GT3 RS'),
      views: '125K',
      featured: true
    },
    {
      id: 2,
      title: 'Classic Mercedes 300SL',
      category: 'Classic',
      year: 1955,
      image: getCarImageUrl('Classic Mercedes 300SL'),
      views: '89K',
      featured: true
    },
    {
      id: 3,
      title: 'Ferrari SF90',
      category: 'Hypercar',
      year: 2023,
      image: getCarImageUrl('Ferrari SF90'),
      views: '203K',
      featured: false
    },
    {
      id: 4,
      title: 'Lamborghini Huracán',
      category: 'Sports Car',
      year: 2023,
      image: getCarImageUrl('Lamborghini Huracán STO real photo'),
      views: '156K',
      featured: false
    },
    {
      id: 5,
      title: 'McLaren 720S',
      category: 'Supercar',
      year: 2024,
      image: getCarImageUrl('McLaren 720S'),
      views: '98K',
      featured: false
    },
    {
      id: 6,
      title: 'Aston Martin DB11',
      category: 'Grand Tourer',
      year: 2023,
      image: getCarImageUrl('Aston Martin DB11'),
      views: '76K',
      featured: false
    }
  ];

  const categories = [
    { name: 'All', icon: 'grid_view' },
    { name: 'Sports', icon: 'speed' },
    { name: 'Classic', icon: 'history' },
    { name: 'Electric', icon: 'electric_car' },
    { name: 'Luxury', icon: 'diamond' },
    { name: 'Off-Road', icon: 'terrain' }
  ];

  const [selectedCategory, setSelectedCategory] = React.useState('All');

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-display font-bold text-white">Discover</h2>
        <p className="text-text-secondary-dark">Explore the finest automotive creations from around the world</p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${selectedCategory === cat.name
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-surface-dark border-white/10 text-text-secondary-dark hover:text-white hover:border-white/20'
              }`}
          >
            <span className="material-symbols-outlined text-xl">{cat.icon}</span>
            <span className="text-sm font-medium">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Featured Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Featured</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredCars.filter(car => car.featured).map((car) => (
            <div
              key={car.id}
              className="group relative bg-surface-dark rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="aspect-[16/9] bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url("${car.image}")` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <span className="material-symbols-outlined text-lg">star</span>
                  <span>Featured</span>
                </div>
                <h4 className="text-white text-xl font-bold">{car.title}</h4>
                <div className="flex items-center justify-between text-text-secondary-dark text-sm">
                  <span>{car.category} • {car.year}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    {car.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Cars Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Trending</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredCars
            .filter(car => {
              if (selectedCategory === 'All') return true;
              if (selectedCategory === 'Sports' && car.category === 'Sports Car') return true;
              return car.category === selectedCategory;
            })
            .map((car) => (
              <div
                key={car.id}
                className="group bg-surface-dark rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="aspect-square bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url("${car.image}")` }} />
                <div className="p-4 space-y-2">
                  <h4 className="text-white text-sm font-semibold line-clamp-1">{car.title}</h4>
                  <div className="flex items-center justify-between text-xs text-text-secondary-dark">
                    <span>{car.category}</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      {car.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Discover;
