import { Achievement, Habit, UserProfile } from './types';

export const LEVEL_THRESHOLDS = [
  50, 120, 220, 360, 540, 770, 1050, 1380, 1780, 2250, 2800, 3450, 4200, 5050, 6000
];

export const STREAK_BONUSES: Record<number, number> = {
  7: 5,
  14: 10,
  30: 20,
  60: 30,
  90: 50,
  180: 100,
  365: 200
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_habit',
    label: '🌱 Точка отсчёта',
    description: 'Вы сделали первый шаг к переменам, создав свою первую привычку.',
    condition: 'Создать первую привычку',
    icon: 'Sprout'
  },
  {
    id: 'spark_7',
    label: '🔥 Искра дисциплины',
    description: 'Дисциплина начинается с малого. Неделя — это уже серьезно!',
    condition: 'Удерживать любую привычку 7 дней подряд',
    icon: 'Zap'
  },
  {
    id: 'rewire_21',
    label: '🧠 Перепрошивка привычки',
    description: '21 день — считается, что именно столько нужно для базового формирования нейронных связей.',
    condition: 'Удерживать любую привычку 21 день подряд',
    icon: 'Brain'
  },
  {
    id: 'foundation_3_21',
    label: '💪 Фундамент стабильности',
    description: 'Три привычки по три недели. Вы строите надежный фундамент своей новой жизни.',
    condition: 'Удерживать 3 привычки по 21 дню подряд каждую',
    icon: 'Activity'
  },
  {
    id: 'lock_60',
    label: '📅 Закрепление поведения',
    description: 'Два месяца жизни в новом ритме. Привычка становится частью вас.',
    condition: 'Удерживать любую привычку более 60 дней подряд',
    icon: 'Calendar'
  },
  {
    id: 'system_5',
    label: '🧩 Система привычек',
    description: 'Вы жонглируете пятью привычками одновременно. Это уже целая экосистема.',
    condition: 'Иметь 5 активных привычек одновременно',
    icon: 'Layers'
  },
  {
    id: 'iron_100',
    label: '👑 Железный режим',
    description: '100 дней. Ваша воля крепка как железо.',
    condition: 'Удерживать любую привычку более 100 дней подряд',
    icon: 'Crown'
  },
  {
    id: 'indestructible_180',
    label: '🗿 Несокрушимость',
    description: 'Полгода дисциплины. Теперь вас практически невозможно сломить.',
    condition: 'Удерживать любую привычку более 180 дней подряд',
    icon: 'Box'
  },
  {
    id: 'monolith_5_180',
    label: '🗿 Монолит поведения',
    description: 'Пять привычек по полгода! Ваша жизнь — это неприступная крепость.',
    condition: 'Удерживать 5 привычек более 180 дней подряд каждую',
    icon: 'Mountain'
  },
  {
    id: 'architect_365',
    label: '🌌 Архитектор привычек',
    description: 'Год! Вы полностью перестроили свою жизнь. Вы — архитектор своей судьбы.',
    condition: 'Удерживать любую привычку 365 дней подряд',
    icon: 'Globe'
  }
];

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 2;
    } else {
      break;
    }
  }
  return level;
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel - 1 >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[currentLevel - 1];
}

export function getXpForCurrentLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  return LEVEL_THRESHOLDS[currentLevel - 2];
}

export function checkAchievements(profile: UserProfile, habits: Habit[]): string[] {
  const newAchievements: string[] = [];
  const currentIds = new Set(profile.achievements || []);

  const unlocked = (id: string) => currentIds.has(id);

  // Stats
  const streaks = habits.map(h => h.streak);
  const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
  const activeHabits = habits.filter(h => h.status === 'active');
  const count21 = habits.filter(h => h.streak >= 21).length;
  const count180 = habits.filter(h => h.streak >= 180).length;

  // 1. 🌱 Точка отсчёта
  if (!unlocked('first_habit') && habits.length > 0) {
    newAchievements.push('first_habit');
  }

  // 1. 🔥 Искра дисциплины - 7 дней
  if (!unlocked('spark_7') && maxStreak >= 7) {
    newAchievements.push('spark_7');
  }

  // 3. 🧠 Перепрошивка привычки - 21 день
  if (!unlocked('rewire_21') && maxStreak >= 21) {
    newAchievements.push('rewire_21');
  }

  // 4. 💪 Фундамент стабильности - 3 привычки по 21 дню
  if (!unlocked('foundation_3_21') && count21 >= 3) {
    newAchievements.push('foundation_3_21');
  }

  // 5. 📅 Закрепление поведения - более 60 дней
  if (!unlocked('lock_60') && maxStreak >= 60) {
    newAchievements.push('lock_60');
  }

  // 6. 🧩 Система привычек (5 активных) - оставляем как было
  if (!unlocked('system_5') && activeHabits.length >= 5) {
    newAchievements.push('system_5');
  }

  // 7. 👑 Железный режим - более 100 дней
  if (!unlocked('iron_100') && maxStreak >= 100) {
    newAchievements.push('iron_100');
  }

  // 8. 🗿 Несокрушимость - более 180 дней
  if (!unlocked('indestructible_180') && maxStreak >= 180) {
    newAchievements.push('indestructible_180');
  }

  // 9. 🗿 Монолит поведения - 5 привычек по 180 дней
  if (!unlocked('monolith_5_180') && count180 >= 5) {
    newAchievements.push('monolith_5_180');
  }

  // 10. 🌌 Архитектор привычек - 365 дней
  if (!unlocked('architect_365') && maxStreak >= 365) {
    newAchievements.push('architect_365');
  }

  return newAchievements;
}
