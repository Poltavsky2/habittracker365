import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Habit, HabitStatus, Achievement } from '../types';
import { ChevronLeft, ShieldAlert, Award, Trophy, LogOut, RefreshCw, X, AlertTriangle, Moon, Sun, Star, Zap, Dumbbell, Brain, Book, Coffee, Heart, Code, Music, Camera, Palette, Timer, Layout, Droplets, Flame, Smile, Target, Globe, Mountain, Box, Crown, Layers, Activity, Calendar, Sprout } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { storageService } from '../storage';
import { getXpForCurrentLevel, getXpForNextLevel, ACHIEVEMENTS } from '../constants';

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Dumbbell, Brain, Book, Coffee, Heart, Moon, Code, Music, Camera, Palette, Timer, Layout, Star, Target, Droplets, Flame, Smile,
  Globe, Mountain, Box, Crown, Layers, Activity, Calendar, Sprout, Trophy
};

import WebApp from '@twa-dev/sdk';

interface Props {
  profile: UserProfile;
  habits: Habit[];
  onBack: () => void;
  onLogout: () => void;
  userKey: string;
  onRefresh: () => void;
}

export default function ProfileView({ 
  profile, 
  habits, 
  onBack, 
  onLogout, 
  userKey, 
  onRefresh
}: Props) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const activeHabits = habits.filter(h => h.status === HabitStatus.ACTIVE);
  const unlockedIds = new Set(profile.achievements || []);
  const isTelegram = userKey.startsWith('TG_');

  const handleResetProgress = () => {
    storageService.resetProgress(userKey);
    onRefresh();
    setShowResetConfirm(false);
    
    try {
      WebApp.showAlert('Прогресс успешно сброшен. Марафон начнется заново с вашей первой новой привычки.');
    } catch (e) {
      alert('Прогресс успешно сброшен. Марафон начнется заново с вашей первой новой привычки.');
    }
  };

  const handleDeleteAccount = () => {
    storageService.deleteAccount(userKey);
    onLogout();
    setShowDeleteConfirm(false);
  };

  const currentLevelThreshold = getXpForCurrentLevel(profile.level);
  const nextLevelThreshold = getXpForNextLevel(profile.level);
  const xpInCurrentLevel = profile.xp - currentLevelThreshold;
  const xpRequiredForNext = nextLevelThreshold - currentLevelThreshold;
  const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNext) * 100));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white border border-neutral-100 rounded-2xl shadow-sm active:scale-90 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold tracking-tight italic">Профиль</h2>
        </div>
      </header>

      <section className="bg-neutral-900 text-white p-8 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy size={140} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black italic">Level {profile.level}</span>
            <span className="text-sm font-mono text-neutral-400">{profile.xp} <span className="text-neutral-600">/ {nextLevelThreshold} XP</span></span>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-neutral-50 h-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
          <StatItem label="Привычки" value={activeHabits.length} />
          <StatItem label="Ошибки" value={profile.errors} color="text-red-400" />
          <StatItem label="Награды" value={unlockedIds.size} color="text-amber-400" />
        </div>
      </section>

      {/* Achievement Gallery */}
      <section className="space-y-6">
        <div className="flex justify-between items-center ml-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Награды ({unlockedIds.size} / {ACHIEVEMENTS.length})</h3>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {ACHIEVEMENTS.map(achv => {
            const isUnlocked = unlockedIds.has(achv.id);
            const Icon = ICON_MAP[achv.icon] || Trophy;
            return (
              <button 
                key={achv.id}
                onClick={() => setSelectedAchievement(achv)}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95 ${isUnlocked ? 'bg-amber-50 text-amber-500 shadow-sm border border-amber-100' : 'bg-neutral-100 text-neutral-300'}`}
              >
                <Icon size={24} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 ml-1">Активные привычки</h3>
        <div className="space-y-3">
          {habits.map(h => (
            <div key={h.id} className="flex justify-between items-center p-5 bg-white border border-neutral-100 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold tracking-tight">{h.name}</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{h.streak}d streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold"> {h.currentDay}d</p>
                <p className="text-[9px] font-black text-neutral-400">+{h.earnedXp || 0} XP</p>
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <p className="text-center text-neutral-400 italic py-8">История пуста</p>
          )}
        </div>
      </div>

      {/* Audit Errors */}
      {profile.errorHistory && profile.errorHistory.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 ml-1">Аудит ошибок</h3>
          <div className="space-y-3">
            {profile.errorHistory.map(error => (
              <div key={error.id} className="p-4 bg-white border border-neutral-100 rounded-2xl border-l-4 border-l-red-400 shadow-sm flex justify-between items-center overflow-hidden">
                <div>
                  <p className="font-bold text-sm">{error.habitName}</p>
                  <p className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">{error.reason}</p>
                </div>
                <p className="font-mono text-[9px] font-bold text-neutral-300">{format(parseISO(error.date), 'dd.MM.yy')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-8 space-y-4 pb-20">
        {!isTelegram && (
          <button 
            onClick={onLogout}
            className="w-full py-4 border-2 border-neutral-100 text-neutral-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-100 transition-all font-mono text-xs uppercase shadow-sm"
          >
            <LogOut size={16} /> Выйти из сессии
          </button>
        )}
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 py-4 bg-neutral-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase"
          >
            <RefreshCw size={16} /> Сбросить прогресс
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase shadow-lg shadow-red-900/20"
          >
            <ShieldAlert size={16} /> Удалить аккаунт
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailModal 
            achievement={selectedAchievement} 
            isUnlocked={unlockedIds.has(selectedAchievement.id)}
            onClose={() => setSelectedAchievement(null)} 
          />
        )}
        {showResetConfirm && (
          <ResetConfirmModal onConfirm={handleResetProgress} onClose={() => setShowResetConfirm(false)} />
        )}
        {showDeleteConfirm && (
          <DeleteConfirmModal onConfirm={handleDeleteAccount} onClose={() => setShowDeleteConfirm(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatItem({ label, value, color = "text-white" }: { label: string, value: number, color?: string }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-[9px] font-black uppercase text-neutral-500 tracking-[0.2em]">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function AchievementDetailModal({ achievement, isUnlocked, onClose }: { achievement: Achievement, isUnlocked: boolean, onClose: () => void }) {
  const Icon = ICON_MAP[achievement.icon] || Trophy;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 space-y-6 text-center shadow-2xl">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center shadow-inner ${isUnlocked ? 'bg-amber-50 text-amber-500 border-2 border-amber-100' : 'bg-neutral-100 text-neutral-300'}`}>
          <Icon size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black italic tracking-tighter text-neutral-900">{achievement.label}</h3>
          <p className="text-neutral-500 text-sm font-medium leading-relaxed italic">
            {isUnlocked ? achievement.description : 'Эта вершина еще не покорена. Продолжай марафон, чтобы открыть её!'}
          </p>
        </div>
        
        <div className="p-4 bg-neutral-50 rounded-2xl text-left border border-neutral-100">
          <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">{isUnlocked ? 'Как вы это получили' : 'Условие разблокировки'}</p>
          <p className="text-sm font-bold text-neutral-700">{achievement.condition}</p>
        </div>

        <button onClick={onClose} className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl shadow-neutral-200">ЗАКРЫТЬ</button>
      </motion.div>
    </motion.div>
  );
}

function ResetConfirmModal({ onConfirm, onClose }: { onConfirm: () => void, onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-[2.5rem] space-y-6 max-w-sm text-center shadow-2xl">
        <div className="mx-auto w-20 h-20 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center">
          <RefreshCw size={40} />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black italic tracking-tighter">Сбросить марафон?</h3>
          <p className="text-sm text-neutral-500 leading-relaxed font-medium">Ваш прогресс (XP, уровень, привычки) будет обнулен. Марафон начнется заново с добавления первой привычки.</p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button onClick={onConfirm} className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black">ДА, ОБНУЛИТЬ</button>
          <button onClick={onClose} className="w-full py-4 text-neutral-400 font-bold">Отмена</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ onConfirm, onClose }: { onConfirm: () => void, onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center shadow-2xl">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-[2.5rem] space-y-6 max-w-sm">
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black italic tracking-tighter text-red-600">УДАЛИТЬ ПОЛНОСТЬЮ?</h3>
          <p className="text-sm text-neutral-500 font-medium leading-relaxed">Профиль и все данные будут стерты из системы навсегда. Ключ перестанет действовать.</p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button onClick={onConfirm} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase">УДАЛИТЬ БЕЗВОЗВРАТНО</button>
          <button onClick={onClose} className="w-full py-4 text-neutral-400 font-bold font-mono">ОТМЕНА</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
