
export enum HabitType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

export enum HabitStatus {
  ACTIVE = 'active',
  FAILED = 'failed',
}

export enum LogStatus {
  DONE = 'done',
  MISSED = 'missed',
}

export interface ErrorLog {
  id: string;
  habitId: string;
  habitName: string;
  date: string;
  reason: string;
}

export interface UserProfile {
  id: string;
  name: string;
  startDate?: string;
  deadline?: string;
  xp: number;
  level: number;
  errors: number;
  totalStreak: number;
  lastActiveDate: string;
  errorHistory: ErrorLog[];
  achievements: string[];
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string;
  goals: string;
  reasons: string;
  type: HabitType;
  startDate: string;
  currentDay: number;
  streak: number;
  earnedXp: number;
  status: HabitStatus;
  icon: string;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  condition: string;
  icon: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: LogStatus;
}
