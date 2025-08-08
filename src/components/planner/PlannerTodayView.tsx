import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BookOpen, Plus, Target, CheckCircle2, Circle } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useEvents } from '../../hooks/useEvents';
import { useJournal } from '../../hooks/useJournal';
import TimelineView from './TimelineView';
import TaskListView from './TaskListView';
import MoodEnergyCard from './MoodEnergyCard';
import QuickNoteCard from './QuickNoteCard';
import DayStatsCard from './DayStatsCard';
import NewTaskModal from '../NewTaskModal';
import NewEventModal from '../NewEventModal';

interface PlannerTodayViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onViewChange: (view: string) => void;
}

export default function PlannerTodayView({ selectedDate, onDateChange, onViewChange }: PlannerTodayViewProps) {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  const { tasks, createTask, updateTask, toggleTaskStatus, getTasksForDate, isRecurringInstanceCompletedToday } = useTasks();
  const { goals, updateGoal } = useGoals();
  const { events, createEvent, updateEvent, getEventsForDate } = useEvents();
  const { currentEntry, setCurrentEntryForDate } = useJournal();

  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Load journal entry for selected date
  useEffect(() => {
    setCurrentEntryForDate(selectedDate);
  }, [selectedDate, setCurrentEntryForDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(date.toISOString().split('T')[0]);
  };

  // Get data for selected date using the new function
  const dayTasks = getTasksForDate(selectedDate);
  const todayEvents = getEventsForDate(selectedDate);
  const todayGoals = goals.filter(goal => 
    goal.timeline === 'daily' || 
    (goal.deadline && goal.deadline === selectedDate)
  );

  // Calculate completion stats
  const completedTasks = dayTasks.regular.filter(task => task.status === 'done').length +
    dayTasks.recurring.filter(task => isRecurringInstanceCompletedToday(task.id, selectedDate)).length;
  const totalTasks = dayTasks.all.length;

  const completedGoals = todayGoals.filter(goal => goal.status === 'done').length;
  const totalGoals = todayGoals.length;

  const handleNewTask = async (taskData: any) => {
    await createTask({ ...taskData, date_planned: selectedDate });
  };

  const handleNewEvent = async (eventData: any) => {
    await createEvent(eventData);
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    await updateTask(taskId, updates);
  };

  const handleUpdateEvent = async (eventId: string, updates: any) => {
    await updateEvent(eventId, updates);
  };

  const postponeTask = async (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    await updateTask(taskId, { 
      date_planned: tomorrow.toISOString().split('T')[0],
      reschedule_count: (tasks.find(t => t.id === taskId)?.reschedule_count || 0) + 1
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header de navigation */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-800 font-display">
                {formatDate(selectedDate)}
              </h1>
              {isToday && (
                <span className="text-sm text-primary-600 font-medium">Aujourd'hui</span>
              )}
            </div>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => onViewChange('weekly')}
              className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-600 px-4 py-2 rounded-xl hover:bg-neutral-200 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Voir la semaine
            </button>
            
            <button
              onClick={() => window.location.href = `/journal?date=${selectedDate}`}
              className="flex items-center justify-center gap-2 bg-primary-100 text-primary-600 px-4 py-2 rounded-xl hover:bg-primary-200 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Journal du jour
            </button>
          </div>
        </div>
      </div>

      {/* Structure principale optimisée pour mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Colonne principale - Timeline */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Timeline avec hauteur optimisée */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">
                Planning du jour
              </h2>
              <span className="text-sm text-neutral-500">
                {dayTasks.all.length + todayEvents.length} éléments
              </span>
            </div>
            <TimelineView
              tasks={dayTasks.all}
              events={todayEvents}
              selectedDate={selectedDate}
              isToday={isToday}
              onToggleTask={toggleTaskStatus}
              onUpdateTask={handleUpdateTask}
              onUpdateEvent={handleUpdateEvent}
              isRecurringInstanceCompleted={(taskId) => isRecurringInstanceCompletedToday(taskId, selectedDate)}
              expanded={false}
              height="400px"
            />
          </div>
        </div>

        {/* Colonne latérale optimisée */}
        <div className="lg:col-span-2 space-y-4">
          {/* Actions - Plus compact */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
            <h3 className="text-md font-semibold text-neutral-800 mb-3">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center justify-center gap-2 bg-primary-100 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-200 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Tâche
              </button>
              
              <button
                onClick={() => setShowNewEventModal(true)}
                className="flex items-center justify-center gap-2 bg-green-100 text-green-600 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Événement
              </button>
            </div>
          </div>

          {/* Vue complète des tâches - Plus compacte */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100">
            <div className="p-4 border-b border-neutral-100">
              <h3 className="text-md font-semibold text-neutral-800">Toutes les tâches</h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <TaskListView
                regularTasks={dayTasks.regular}
                recurringTasks={dayTasks.recurring}
                selectedDate={selectedDate}
                onToggleTask={toggleTaskStatus}
                onPostponeTask={postponeTask}
                isRecurringInstanceCompleted={(taskId) => isRecurringInstanceCompletedToday(taskId, selectedDate)}
                compact={true}
                showHeader={false}
              />
            </div>
          </div>

          {/* Bilan de la journée - Plus compact */}
          {isEvening && isToday && (
            <div className="bg-gradient-to-br from-primary-50 to-rose-50 rounded-xl p-4">
              <h3 className="text-md font-semibold text-neutral-800 mb-3">Bilan</h3>
              <DayStatsCard
                completedTasks={completedTasks}
                totalTasks={totalTasks}
                completedGoals={completedGoals}
                totalGoals={totalGoals}
                selectedDate={selectedDate}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section en bas - Comment te sens-tu et Note rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Comment te sens-tu */}
        <MoodEnergyCard
          selectedDate={selectedDate}
          currentEntry={currentEntry}
          compact={true}
        />

        {/* Note rapide */}
        <QuickNoteCard 
          selectedDate={selectedDate}
          compact={true}
        />
      </div>

      {/* Modals */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSave={handleNewTask}
      />

      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSave={handleNewEvent}
        defaultDate={selectedDate}
      />
    </div>
  );
}