import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Zap, Dumbbell, Brain, Book, Coffee, Heart, Moon, Code, Music, Camera, Palette, Timer, Layout, Star, Target, Droplets, Flame, Smile, Globe, Mountain, Box, Crown, Layers, Activity, Calendar, Sprout } from 'lucide-react';
import { HabitType, HabitStatus, Habit, UserProfile } from '../types';
import { storageService } from '../storage';

const AVAILABLE_ICONS = [
  { id: 'Zap', icon: Zap },
  { id: 'Dumbbell', icon: Dumbbell },
  { id: 'Brain', icon: Brain },
  { id: 'Book', icon: Book },
  { id: 'Coffee', icon: Coffee },
  { id: 'Heart', icon: Heart },
  { id: 'Moon', icon: Moon },
  { id: 'Code', icon: Code },
  { id: 'Music', icon: Music },
  { id: 'Camera', icon: Camera },
  { id: 'Palette', icon: Palette },
  { id: 'Timer', icon: Timer },
  { id: 'Layout', icon: Layout },
  { id: 'Star', icon: Star },
  { id: 'Target', icon: Target },
  { id: 'Droplets', icon: Droplets },
  { id: 'Flame', icon: Flame },
  { id: 'Smile', icon: Smile },
  { id: 'Globe', icon: Globe },
  { id: 'Mountain', icon: Mountain },
  { id: 'Box', icon: Box },
  { id: 'Crown', icon: Crown },
  { id: 'Layers', icon: Layers },
  { id: 'Activity', icon: Activity },
  { id: 'Calendar', icon: Calendar },
  { id: 'Sprout', icon: Sprout },
];

interface Props {
  userId: string;
  userKey: string;
  profile: UserProfile;
  onClose: () => void;
  onCreated: () => void;
}

export default function HabitCreation({ userId, userKey, profile, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState('');
  const [reasons, setReasons] = useState('');
  const [type, setType] = useState<HabitType>(HabitType.POSITIVE);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goals.trim() || !reasons.trim()) return;

    setLoading(true);
    const id = crypto.randomUUID();
    const newHabit: Habit = {
      id,
      userId,
      name: name.trim(),
      description: description.trim(),
      goals: goals.trim(),
      reasons: reasons.trim(),
      type,
      startDate: new Date().toISOString(),
      currentDay: 1,
      streak: 0,
      earnedXp: 0,
      status: HabitStatus.ACTIVE,
      icon: 'Zap'
    };

    // If this is the first habit, activate the marathon profile dates
    if (!profile.startDate) {
      const now = new Date();
      const deadline = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      storageService.updateProfile(userKey, {
        startDate: now.toISOString(),
        deadline: deadline.toISOString()
      });
    }

    storageService.addHabit(userKey, newHabit);
    setLoading(false);
    onCreated();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ y: '100%', scale: 1 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%', scale: 0.9 }}
        className="w-full max-w-md bg-white rounded-[2rem] p-8 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight italic">Новая привычка</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Название</label>
              <input 
                type="text" 
                autoFocus
                className="w-full p-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-neutral-100 focus:bg-white transition-all outline-none text-lg font-bold"
                placeholder="Напр. Бег"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Цели</label>
              <textarea 
                className="w-full p-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-neutral-100 focus:bg-white transition-all outline-none text-sm font-medium min-h-[80px]"
                placeholder="Что ты хочешь достичь?"
                value={goals}
                onChange={e => setGoals(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Причины / Мотивация</label>
              <textarea 
                className="w-full p-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-neutral-100 focus:bg-white transition-all outline-none text-sm font-medium min-h-[80px]"
                placeholder="Причины (почему это важно?)"
                value={reasons}
                onChange={e => setReasons(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Тип привычки</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setType(HabitType.POSITIVE)}
                className={`flex-1 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all border-2 ${type === HabitType.POSITIVE ? 'bg-neutral-900 text-neutral-50 shadow-lg border-neutral-900' : 'bg-neutral-50 border-transparent text-neutral-400'}`}
              >
                <Check size={20} /> Полезная
              </button>
              <button
                type="button"
                onClick={() => setType(HabitType.NEGATIVE)}
                className={`flex-1 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all border-2 ${type === HabitType.NEGATIVE ? 'bg-neutral-900 text-neutral-50 shadow-lg border-neutral-900' : 'bg-neutral-50 border-transparent text-neutral-400'}`}
              >
                <X size={20} /> Отказ
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-neutral-900 text-white rounded-[1.5rem] font-bold text-lg tracking-tight shadow-xl shadow-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Создание...' : '✅ Создать'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
