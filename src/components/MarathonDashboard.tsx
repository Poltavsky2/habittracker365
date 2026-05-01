import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Habit, HabitType, HabitStatus, LogStatus, HabitLog, ErrorLog, Achievement } from '../types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Plus, Check, X, Flame, AlertCircle, Edit2, Info, HelpCircle, Trash2, Trophy, PartyPopper, Star, Zap, Dumbbell, Brain, Book, Coffee, Heart, Moon, Code, Music, Camera, Palette, Timer, Layout, Droplets, Smile, Target, Globe, Mountain, Box, Crown, Layers, Activity, Calendar, Sprout } from 'lucide-react';
import { storageService } from '../storage';
import HabitCreation from './HabitCreation';
import { calculateLevel, STREAK_BONUSES, checkAchievements, ACHIEVEMENTS } from '../constants';

import WebApp from '@twa-dev/sdk';

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Dumbbell, Brain, Book, Coffee, Heart, Moon, Code, Music, Camera, Palette, Timer, Layout, Star, Target, Droplets, Flame, Smile,
  Globe, Mountain, Box, Crown, Layers, Activity, Calendar, Sprout,
};

interface Props {
  profile: UserProfile;
  habits: Habit[];
  onOpenProfile: () => void;
  userKey: string;
  onRefresh: () => void;
}

export default function MarathonDashboard({ profile, habits, onOpenProfile, userKey, onRefresh }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{ type: 'fail' | 'delete', habitId: string } | null>(null);
  const [expandedHabits, setExpandedHabits] = useState<Record<string, boolean>>({});
  const [todayLogs, setTodayLogs] = useState<Record<string, LogStatus>>({});
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showTrialNotice, setShowTrialNotice] = useState(false);

  const dayOfMarathon = profile.startDate ? differenceInDays(new Date(), parseISO(profile.startDate)) + 1 : 0;
  const activeHabits = habits.filter(h => h.status === HabitStatus.ACTIVE);
  
  // Check achievements
  useEffect(() => {
    const newlyUnlockedIds = checkAchievements(profile, habits);
    if (newlyUnlockedIds.length > 0) {
      const unlockedAchivs = newlyUnlockedIds
        .map(id => ACHIEVEMENTS.find(a => a.id === id))
        .filter(Boolean) as Achievement[];
      
      setNewAchievements(prev => [...prev, ...unlockedAchivs]);
      
      // Save to profile
      storageService.updateProfile(userKey, {
        achievements: [...(profile.achievements || []), ...newlyUnlockedIds]
      });
      onRefresh();
    }
  }, [profile, habits, userKey, onRefresh]);
  
  // Can add a new habit every 30 days
  const canAddHabit = habits.length < Math.min(12, Math.floor((dayOfMarathon || 1) / 30) + 1);

  useEffect(() => {
    const userData = storageService.login(userKey);
    if (userData) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs: Record<string, LogStatus> = {};
      userData.logs.forEach(log => {
        if (log.date === today) {
          logs[log.habitId] = log.status;
        }
      });
      setTodayLogs(logs);
    }
  }, [userKey, habits]);

  const toggleExpand = (id: string) => {
    setExpandedHabits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLog = (habitId: string, status: LogStatus) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const logId = `${habitId}_${today}`;
    
    // Create log
    storageService.logHabit(userKey, {
      id: logId,
      habitId,
      userId: profile.id,
      date: today,
      status
    });

    try {
      if (status === LogStatus.DONE) {
        WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        WebApp.HapticFeedback.notificationOccurred('warning');
      }
    } catch (e) {}

    // Update habit streak/currentDay
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const isDone = status === LogStatus.DONE;
      const newStreak = isDone ? (habit.streak || 0) + 1 : 0;
      
      // Calculate XP
      let xpChange = 0;
      let streakBonus = 0;

      if (isDone) {
        xpChange = 1; // Base XP
        // Streak bonus
        streakBonus = STREAK_BONUSES[newStreak] || 0;
        xpChange += streakBonus;
      } else {
        // Missed penalty
        const isGracePeriod = (habit.currentDay || 0) <= 3;
        xpChange = isGracePeriod ? 0 : -2;
      }

      const totalNewHabitXp = (habit.earnedXp || 0) + (isDone ? xpChange : 0);

      storageService.updateHabit(userKey, habitId, {
        streak: newStreak,
        currentDay: isDone ? (habit.currentDay || 0) + 1 : habit.currentDay,
        earnedXp: totalNewHabitXp
      });

      // Update Profile XP and Level
      const newTotalXp = Math.max(0, (profile.xp || 0) + xpChange);
      const newLevel = calculateLevel(newTotalXp);

      const isGracePeriodGlobal = (habit.currentDay || 0) <= 3;
      const errorChange = (status === LogStatus.MISSED && !isGracePeriodGlobal) ? 1 : 0;

      if (status === LogStatus.MISSED && !isGracePeriodGlobal) {
        const errorLog: ErrorLog = {
          id: crypto.randomUUID(),
          habitId,
          habitName: habit.name,
          date: today,
          reason: 'Пропущено выполнение'
        };
        storageService.logError(userKey, errorLog);
      }

      storageService.updateProfile(userKey, {
        xp: newTotalXp,
        level: newLevel,
        errors: (profile.errors || 0) + errorChange,
        lastActiveDate: new Date().toISOString()
      });
    }

    setTodayLogs(prev => ({ ...prev, [habitId]: status }));
    onRefresh();
  };

  const handleFailHabit = (habitId: string) => {
    try { WebApp.HapticFeedback.notificationOccurred('error'); } catch (e) {}
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isGracePeriod = habit.currentDay <= 3;
    const habitXp = habit.earnedXp || 0;
    const penalty = isGracePeriod ? 0 : Math.floor(habitXp * 0.5);
    const errorChange = isGracePeriod ? 0 : 1;

    storageService.updateHabit(userKey, habitId, { 
      currentDay: 0, 
      streak: 0,
      earnedXp: 0
    });
    
    const newTotalXp = Math.max(0, (profile.xp || 0) - penalty);
    const newLevel = calculateLevel(newTotalXp);

    storageService.updateProfile(userKey, { 
      errors: (profile.errors || 0) + errorChange,
      xp: newTotalXp,
      level: newLevel
    });

    onRefresh();
    setConfirmingAction(null);
  };

  const handleDeleteHabit = (habitId: string) => {
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch (e) {}
    storageService.deleteHabit(userKey, habitId);
    onRefresh();
    setConfirmingAction(null);
  };

  const handleEditHabit = (habit: Habit) => {
    if (habit.currentDay > 3) {
      const msg = 'Редактирование доступно только в первые 3 дня!';
      try {
        WebApp.showAlert(msg);
      } catch (e) {
        alert(msg);
      }
      return;
    }
    setEditingHabit(habit);
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10 pb-12"
    >
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          {dayOfMarathon > 0 && (
            <span className="text-8xl font-black italic tracking-tighter opacity-10 absolute -top-4 -left-4 pointer-events-none">
              {dayOfMarathon}
            </span>
          )}
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-neutral-400">ДЕНЬ МАРАФОНА</p>
          <h2 className="text-4xl font-bold tracking-tighter">{dayOfMarathon} <span className="text-neutral-300">/ 365</span></h2>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <button 
            onClick={() => setShowInstructions(true)}
            className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
            title="Как это работает?"
          >
            <HelpCircle size={24} />
          </button>
          <div className="">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400">FINISH</p>
            <p className="font-mono text-sm">{profile.deadline ? format(parseISO(profile.deadline), 'dd.MM.yyyy') : '—'}</p>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">Ваши привычки</h3>
          {canAddHabit && (
            <button 
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-neutral-50 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-neutral-200"
            >
              <Plus size={16} /> Добавить
            </button>
          )}
        </div>

        <div className="space-y-4">
          {activeHabits.length === 0 && (
            <div className="p-8 border-2 border-dashed border-neutral-200 rounded-3xl text-center space-y-4">
              <p className="text-neutral-400 font-medium italic">У вас пока нет активных привычек. Добавьте первую, чтобы запустить отсчет 365 дней.</p>
              {canAddHabit && (
                <button onClick={() => setShowCreate(true)} className="text-neutral-900 font-bold underline underline-offset-4">Создать первую</button>
              )}
            </div>
          )}
          {activeHabits.map((habit) => {
            const isLogged = todayLogs[habit.id];
            const isExpanded = expandedHabits[habit.id];
            const canEdit = habit.currentDay <= 3;
            
            return (
              <div 
                key={habit.id}
                className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-4 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-xl tracking-tight text-neutral-900">{habit.name}</h4>
                       {canEdit ? (
                         <button onClick={() => handleEditHabit(habit)} className="p-1 text-neutral-300 hover:text-neutral-900 transition-colors" title="Редактировать">
                            <Edit2 size={12} />
                         </button>
                       ) : (
                         <div className="p-1 px-2 bg-neutral-50 text-[7px] font-black uppercase text-neutral-300 rounded-md tracking-tighter" title="Редактирование закрыто">
                           Locked
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                        <Flame size={14} className={habit.streak > 0 ? 'text-orange-500' : 'text-neutral-300'} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none pt-0.5">{habit.streak} D-STREAK / {habit.currentDay} DAY</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleExpand(habit.id)}
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${isExpanded ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'}`}
                        title={isExpanded ? 'Скрыть детали' : 'Показать детали'}
                      >
                         <Info size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmingAction({ type: 'fail', habitId: habit.id })}
                        className="p-2.5 bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all flex items-center justify-center"
                        title="Завалить привычку"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {habit.type === HabitType.NEGATIVE ? (
                        <span className="px-2 py-1 bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-red-100">Отказ</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-100">Полезная</span>
                      )}
                      <button 
                        onClick={() => setConfirmingAction({ type: 'delete', habitId: habit.id })}
                        className="p-1 text-neutral-200 hover:text-neutral-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-neutral-50 pt-4"
                    >
                      <div className="space-y-4 text-sm font-medium tracking-tight">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Цели</p>
                          <p className="text-neutral-600 italic bg-neutral-50 p-3 rounded-xl whitespace-pre-wrap">{habit.goals || 'Цели не указаны'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Причины</p>
                          <p className="text-neutral-600 italic bg-neutral-50 p-3 rounded-xl whitespace-pre-wrap">{habit.reasons || 'Причины не указаны'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>


                <div className="flex gap-3">
                  {!isLogged ? (
                    <>
                      <button 
                        onClick={() => handleLog(habit.id, LogStatus.DONE)}
                        className="flex-1 py-3 bg-neutral-900 text-neutral-50 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all"
                      >
                        <Check size={18} /> Выполнил
                      </button>
                      <button 
                        onClick={() => handleLog(habit.id, LogStatus.MISSED)}
                        className="p-3 border-2 border-neutral-200 text-neutral-400 bg-transparent rounded-2xl active:scale-95 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <div className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm ${isLogged === LogStatus.DONE ? 'bg-green-50 text-green-600 font-black' : 'bg-red-50 text-red-600 font-black'}`}>
                      {isLogged === LogStatus.DONE ? <><Check size={18} /> ЗАЧТЕНО</> : <><X size={18} /> ПРОПУЩЕНО</>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Habits Queue */}
      {!canAddHabit && (
        <div className="p-6 bg-neutral-100 rounded-3xl border border-neutral-200 flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-inner">
            <AlertCircle className="text-neutral-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Следующая привычка</p>
            <p className="text-sm font-medium">Будет доступна на 30-й день этого месяца.</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {confirmingAction && (
          <ConfirmActionModal 
            type={confirmingAction.type} 
            habit={habits.find(h => h.id === confirmingAction.habitId)}
            onConfirm={() => confirmingAction.type === 'fail' ? handleFailHabit(confirmingAction.habitId) : handleDeleteHabit(confirmingAction.habitId)} 
            onClose={() => setConfirmingAction(null)} 
          />
        )}
        {showInstructions && (
          <InstructionsModal onClose={() => setShowInstructions(false)} />
        )}
        {showCreate && (
          <HabitCreation 
            userId={profile.id} 
            userKey={userKey}
            profile={profile}
            onClose={() => setShowCreate(false)} 
            onCreated={() => {
              setShowCreate(false);
              setShowTrialNotice(true);
              onRefresh();
            }} 
          />
        )}
        {editingHabit && (
          <HabitEditModal 
            habit={editingHabit} 
            userKey={userKey}
            onClose={() => setEditingHabit(null)} 
            onUpdated={() => {
              setEditingHabit(null);
              onRefresh();
            }}
          />
        )}
        {newAchievements.length > 0 && (
          <AchievementUnlockModal 
            achievement={newAchievements[0]} 
            onClose={() => setNewAchievements(prev => prev.slice(1))} 
          />
        )}
        {showTrialNotice && (
          <TrialPeriodNoticeModal onClose={() => setShowTrialNotice(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TrialPeriodNoticeModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] bg-neutral-900/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ y: 50, scale: 0.9 }} 
        animate={{ y: 0, scale: 1 }} 
        exit={{ y: -50, scale: 0.9 }} 
        className="w-full max-w-sm bg-white rounded-[3rem] p-10 space-y-8 shadow-2xl text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-neutral-900" />
        
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center shadow-inner">
            <Timer size={40} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Внимание</p>
            <h3 className="text-3xl font-black italic tracking-tighter text-neutral-900 leading-tight uppercase">Адаптация</h3>
          </div>
          <div className="text-neutral-500 text-sm font-medium leading-relaxed space-y-4">
            <p>У тебя есть <span className="font-bold text-neutral-900 underline underline-offset-4 decoration-2">3 дня</span>, чтобы протестировать этот ритм без последствий.</p>
            <div className="bg-neutral-50 p-4 rounded-2xl text-left space-y-2 border border-neutral-100">
              <div className="flex gap-3">
                <div className="mt-1"><Edit2 size={14} className="text-neutral-900" /></div>
                <p className="text-xs">Меняй название и цели под себя без ограничений.</p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1"><AlertCircle size={14} className="text-neutral-900" /></div>
                <p className="text-xs">Любые пропуски <span className="font-bold uppercase">не</span> записываются в аудит ошибок.</p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1"><Zap size={14} className="text-amber-500" /></div>
                <p className="text-xs">Опыт (XP) начнет расти сразу после периода адаптации.</p>
              </div>
            </div>
            <p className="italic">Привыкай к новому ритму без давления!</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-5 bg-neutral-900 text-white rounded-[1.8rem] font-black text-lg active:scale-95 transition-all shadow-xl shadow-neutral-200"
        >
          ПОНЯЛ, ПОЕХАЛИ!
        </button>
      </motion.div>
    </motion.div>
  );
}

function AchievementUnlockModal({ achievement, onClose }: { achievement: Achievement, onClose: () => void }) {
  const Icon = ICON_MAP[achievement.icon] || Trophy;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] bg-neutral-900/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ y: 50, scale: 0.9 }} 
        animate={{ y: 0, scale: 1 }} 
        exit={{ y: -50, scale: 0.9 }} 
        className="w-full max-w-sm bg-white rounded-[3rem] p-10 space-y-8 shadow-2xl text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        
        <div className="flex justify-center">
          <motion.div 
             animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
             transition={{ duration: 1.5, repeat: Infinity }}
             className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shadow-inner"
          >
            <Icon size={48} />
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Достижение получено!</p>
            <h3 className="text-3xl font-black italic tracking-tighter text-neutral-900 leading-tight">{achievement.label}</h3>
          </div>
          <p className="text-neutral-500 text-sm font-medium leading-relaxed italic">
            "{achievement.description}"
          </p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl flex items-center gap-3 text-left">
          <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Условие выполнено</p>
            <p className="text-xs font-bold text-neutral-700">{achievement.condition}</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-5 bg-neutral-900 text-white rounded-[1.8rem] font-black text-lg active:scale-95 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2"
        >
          <PartyPopper size={20} /> ВЕЛИКОЛЕПНО
        </button>
      </motion.div>
    </motion.div>
  );
}

function InstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[85vh] relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-300 hover:text-neutral-900 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Гайд марафонца</p>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Кодекс 365</h2>
        </div>
        
        <div className="space-y-6 text-sm text-neutral-600 leading-relaxed font-medium">
          <div className="space-y-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <p className="font-black text-neutral-900 text-[10px] uppercase tracking-widest">🚀 Запуск</p>
            <p className="text-xs">Первая привычка активирует таймер. У тебя ровно 365 дней, чтобы дойти до конца. Финишная дата зафиксирована — ты не можешь её изменить.</p>
          </div>

          <div className="space-y-2">
            <p className="font-black text-neutral-900 text-[10px] uppercase tracking-widest">📦 Модульная система</p>
            <p className="text-xs">Каждые 30 дней открывается слот для +1 новой привычки. К концу года их будет 12. Вводить всё сразу запрещено — мозг не выдержит.</p>
          </div>

          <div className="space-y-2">
            <p className="font-black text-neutral-900 text-[10px] uppercase tracking-widest">⏳ Период адаптации</p>
            <p className="text-xs">Первые 3 дня новой привычки — тестовые. Можно редактировать, сбрасывать и ошибаться без штрафа к опыту (XP) и записи «ошибок» в личный профиль.</p>
          </div>

          <div className="space-y-2">
            <p className="font-black text-neutral-900 text-[10px] uppercase tracking-widest">⚔️ Система XP</p>
            <p className="text-xs">Выполнил — получаешь XP и бонусы за серию (Streak). Пропустил — теряешь -2 XP. Если "Завалил" (сбросил) активную привычку — теряешь 50% её накопленного опыта.</p>
          </div>

          <div className="space-y-2">
            <p className="font-black text-neutral-900 text-[10px] uppercase tracking-widest">🏆 Твоя цель</p>
            <p className="text-xs">Не стать идеальным за день, а не сдаться за год. Твой профиль — твой аудит. Не бойся ошибок, бойся остановиться.</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-5 bg-neutral-900 text-white rounded-[1.5rem] font-black text-lg active:scale-95 transition-all shadow-xl shadow-neutral-200"
        >
          ПРИНЯТО
        </button>
      </motion.div>
    </motion.div>
  );
}

function ConfirmActionModal({ type, habit, onConfirm, onClose }: { type: 'fail' | 'delete', habit?: Habit, onConfirm: () => void, onClose: () => void }) {
  const isFail = type === 'fail';
  const isGracePeriod = habit && habit.currentDay <= 3;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[60] bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="w-full max-w-sm bg-white rounded-[2rem] p-8 space-y-6 shadow-2xl text-center"
      >
        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
          {isFail ? <Flame size={32} /> : <Trash2 size={32} />}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold italic tracking-tight">
            {isFail ? 'Завалить привычку?' : 'Удалить привычку?'}
          </h3>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {isFail 
              ? (isGracePeriod 
                  ? 'Первые 3 дня — тестовый период. Вы можете сбросить привычку без штрафов XP и записи в аудит ошибок.' 
                  : 'Прогресс по этой привычке сбросится до 0. Вы потеряете 50% накопленного этой привычкой опыта и получите +1 к ошибкам.')
              : 'Привычка будет удалена навсегда вместе со всей историей её выполнения.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button 
            onClick={onConfirm} 
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95 transition-all"
          >
            {isFail ? 'Да, я завалил' : 'Да, удалить навсегда'}
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-4 text-neutral-400 hover:text-neutral-600 font-bold active:scale-95 transition-all"
          >
            Отмена
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HabitEditModal({ habit, userKey, onClose, onUpdated }: { habit: Habit, userKey: string, onClose: () => void, onUpdated: () => void }) {
  const [name, setName] = useState(habit.name);
  const [goals, setGoals] = useState(habit.goals || '');
  const [reasons, setReasons] = useState(habit.reasons || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goals.trim() || !reasons.trim()) return;

    setLoading(true);
    storageService.updateHabit(userKey, habit.id, {
      name: name.trim(),
      goals: goals.trim(),
      reasons: reasons.trim()
    });
    setLoading(false);
    onUpdated();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-end justify-center p-6">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-md bg-white rounded-[2rem] p-8 space-y-6">
        <h2 className="text-xl font-bold tracking-tight italic">Редактирование привычки</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input className="w-full p-4 bg-neutral-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-neutral-200" value={name} onChange={e => setName(e.target.value)} placeholder="Название"/>
          <textarea className="w-full p-4 bg-neutral-50 rounded-2xl text-sm h-32 border-none outline-none focus:ring-2 focus:ring-neutral-200" value={goals} onChange={e => setGoals(e.target.value)} placeholder="Цели"/>
          <textarea className="w-full p-4 bg-neutral-50 rounded-2xl text-sm h-32 border-none outline-none focus:ring-2 focus:ring-neutral-200" value={reasons} onChange={e => setReasons(e.target.value)} placeholder="Причины"/>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-neutral-400">Отмена</button>
            <button type="submit" disabled={loading} className="flex-2 py-4 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl">
              {loading ? '...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
