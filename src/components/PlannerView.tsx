import React, { useState } from 'react';
import PlannerTodayView from './planner/PlannerTodayView';
import PlannerWeeklyView from './planner/PlannerWeeklyView';

export default function PlannerView() {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  return (
    <div className="space-y-6">
      {/* Onglets principaux */}
      <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl">
        {[
          { key: 'today', label: 'Today' },
          { key: 'weekly', label: 'Weekly' },
          { key: 'monthly', label: 'Monthly' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-primary-600 shadow-sm font-medium'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'today' && (
        <PlannerTodayView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onViewChange={setActiveTab}
        />
      )}
      
      {activeTab === 'weekly' && (
        <PlannerWeeklyView
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      )}
      
      {activeTab === 'monthly' && (
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
          <h3 className="text-lg font-medium text-neutral-600 mb-2">Vue mensuelle</h3>
          <p className="text-neutral-500">À venir prochainement...</p>
        </div>
      )}
    </div>
  );
}