
import { UserProfile, Habit, HabitLog, LogStatus, ErrorLog } from './types';

const STORAGE_KEY = 'habit_marathon_data';

interface AppData {
  users: Record<string, {
    profile: UserProfile;
    habits: Habit[];
    logs: HabitLog[];
  }>;
}

const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { users: {} };
};

const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const storageService = {
  register: (name: string, key: string): string => {
    const data = getAppData();
    const userId = crypto.randomUUID();
    
    data.users[key] = {
      profile: {
        id: userId,
        name,
        xp: 0,
        level: 1,
        errors: 0,
        totalStreak: 0,
        lastActiveDate: new Date().toISOString(),
        errorHistory: [],
        achievements: [],
      },
      habits: [],
      logs: [],
    };
    
    saveAppData(data);
    return userId;
  },

  login: (key: string) => {
    const data = getAppData();
    return data.users[key] || null;
  },

  updateProfile: (key: string, updates: Partial<UserProfile>) => {
    const data = getAppData();
    if (data.users[key]) {
      data.users[key].profile = { ...data.users[key].profile, ...updates };
      saveAppData(data);
    }
  },

  addHabit: (key: string, habit: Habit) => {
    const data = getAppData();
    if (data.users[key]) {
      data.users[key].habits.push(habit);
      saveAppData(data);
    }
  },

  updateHabit: (key: string, habitId: string, updates: Partial<Habit>) => {
    const data = getAppData();
    if (data.users[key]) {
      data.users[key].habits = data.users[key].habits.map(h => 
        h.id === habitId ? { ...h, ...updates } : h
      );
      saveAppData(data);
    }
  },

  logHabit: (key: string, log: HabitLog) => {
    const data = getAppData();
    if (data.users[key]) {
      // Remove existing log for same day/habit if exists
      data.users[key].logs = data.users[key].logs.filter(l => 
        !(l.habitId === log.habitId && l.date === log.date)
      );
      data.users[key].logs.push(log);
      saveAppData(data);
    }
  },

  resetProgress: (key: string) => {
    const data = getAppData();
    if (data.users[key]) {
      const { name, id } = data.users[key].profile;
      data.users[key] = {
        profile: {
          id,
          name,
          xp: 0,
          level: 1,
          errors: 0,
          totalStreak: 0,
          lastActiveDate: new Date().toISOString(),
          errorHistory: [],
          achievements: [],
        },
        habits: [],
        logs: [],
      };
      saveAppData(data);
    }
  },

  deleteAccount: (key: string) => {
    const data = getAppData();
    delete data.users[key];
    saveAppData(data);
  },

  deleteHabit: (key: string, habitId: string) => {
    const data = getAppData();
    if (data.users[key]) {
      data.users[key].habits = data.users[key].habits.filter(h => h.id !== habitId);
      // Also remove logs for this habit
      data.users[key].logs = data.users[key].logs.filter(l => l.habitId !== habitId);
      
      // If no habits left, reset marathon dates
      if (data.users[key].habits.length === 0) {
        data.users[key].profile.startDate = undefined;
        data.users[key].profile.deadline = undefined;
      }
      
      saveAppData(data);
    }
  },

  logError: (key: string, error: ErrorLog) => {
    const data = getAppData();
    if (data.users[key]) {
      if (!data.users[key].profile.errorHistory) {
        data.users[key].profile.errorHistory = [];
      }
      data.users[key].profile.errorHistory.unshift(error);
      saveAppData(data);
    }
  }
};
