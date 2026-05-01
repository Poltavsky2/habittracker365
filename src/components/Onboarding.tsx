import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { addDays } from 'date-fns';

interface Props {
  userId: string;
  userName?: string;
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ userId, userName, onComplete }: Props) {
  const startMarathon = () => {
    const startDate = new Date();
    const deadline = addDays(startDate, 365);
    
    const profile: UserProfile = {
      id: userId,
      name: userName || 'Герой',
      xp: 0,
      level: 1,
      errors: 0,
      totalStreak: 0,
      lastActiveDate: startDate.toISOString(),
      errorHistory: [],
      achievements: [],
    };

    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8 font-sans transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full space-y-12"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xl font-bold tracking-tight text-neutral-400 transition-colors">Привет, {userName || 'герой'}!</p>
            <h1 className="text-4xl font-bold tracking-tighter leading-tight italic transition-colors">
              "Ты можешь ошибаться, но не можешь остановиться"
            </h1>
          </div>
          
          <div className="space-y-4 text-neutral-500 font-medium tracking-tight transition-colors">
            <p className="flex items-start gap-4">
              <span className="text-neutral-900 font-black text-xs uppercase tracking-widest pt-1 min-w-[3rem]">Стек</span>
              <span className="text-sm">12 месяцев — 12 новых навыков. По одному в 30 дней. Мозг должен успевать адаптироваться.</span>
            </p>
            <p className="flex items-start gap-4">
              <span className="text-neutral-900 font-black text-xs uppercase tracking-widest pt-1 min-w-[3rem]">Цикл</span>
              <span className="text-sm">Марафон длится 365 дней. Дата финиша неизменна. Ты либо доходишь, либо вылетаешь.</span>
            </p>
            <p className="flex items-start gap-4">
              <span className="text-neutral-900 font-black text-xs uppercase tracking-widest pt-1 min-w-[3rem]">Откат</span>
              <span className="text-sm">Пропуски уменьшают XP и пишутся в твой аудит. Ври кому угодно, кроме своей истории успеха.</span>
            </p>
          </div>
        </div>

        <button
          onClick={startMarathon}
          className="w-full py-4 bg-neutral-900 text-neutral-50 rounded-2xl font-bold tracking-tight shadow-xl hover:bg-neutral-800 transition-all active:scale-95"
        >
          🚀 Начать марафон
        </button>
      </motion.div>
    </div>
  );
}
