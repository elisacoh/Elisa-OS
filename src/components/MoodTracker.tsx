import React, { useState } from 'react';
import { Sun, Cloud, CloudRain, Zap } from 'lucide-react';

const moods = [
  { icon: Sun, label: 'Énergique', color: 'mood-energy', bg: 'bg-yellow-100' },
  { icon: Cloud, label: 'Paisible', color: 'mood-peace', bg: 'bg-blue-100' },
  { icon: Zap, label: 'Passionnée', color: 'mood-passion', bg: 'bg-red-100' },
  { icon: CloudRain, label: 'Fatiguée', color: 'mood-fatigue', bg: 'bg-gray-100' },
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState(0);
  const [energy, setEnergy] = useState(75);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Comment te sens-tu ?</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {moods.map((mood, index) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === index;
          return (
            <button
              key={index}
              onClick={() => setSelectedMood(index)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isSelected 
                  ? `${mood.bg} scale-105 shadow-md` 
                  : 'bg-neutral-50 hover:bg-neutral-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? `text-${mood.color}` : 'text-neutral-500'}`} />
              <span className={`text-sm font-medium ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-700">Niveau d'énergie</span>
          <span className="text-sm text-primary-600 font-semibold">{energy}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
          />
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(135deg, #b395ff, #d4949e);
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(135deg, #b395ff, #d4949e);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}