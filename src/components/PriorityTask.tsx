import React from 'react';
import { Star, Battery } from 'lucide-react';

export default function PriorityTask() {
  const task = {
    title: "Préparer la présentation client",
    description: "Finaliser les slides et répéter la présentation",
    energyLevel: 3,
    deadline: "Aujourd'hui 15h",
    completed: false
  };

  const energyColors = ['text-green-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
  const energyBgs = ['bg-green-100', 'bg-yellow-100', 'bg-orange-100', 'bg-red-100'];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-neutral-800">Tâche prioritaire</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-neutral-800 mb-1">{task.title}</h4>
            <p className="text-sm text-neutral-600 mb-3">{task.description}</p>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span>📅 {task.deadline}</span>
              <div className="flex items-center gap-1">
                <Battery className={`w-4 h-4 ${energyColors[task.energyLevel - 1]}`} />
                <span>Énergie: {task.energyLevel}/4</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${energyBgs[task.energyLevel - 1]} ${energyColors[task.energyLevel - 1]}`}>
            {'🔋'.repeat(task.energyLevel)}
          </div>
        </div>
        
        <button className="w-full bg-gradient-to-r from-primary-500 to-rose-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
          Commencer cette tâche
        </button>
      </div>
    </div>
  );
}