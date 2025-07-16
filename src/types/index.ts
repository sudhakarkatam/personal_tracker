
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: 'todo' | 'in_progress' | 'completed';
  category: 'Work' | 'Personal' | 'Health' | 'Learning' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  type?: string;
  wordCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'wishlist' | 'reading' | 'completed' | 'paused' | 'dnf';
  format: 'physical' | 'ebook' | 'audiobook';
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  startDate?: Date;
  completedDate?: Date;
  rating?: number;
  review?: string;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrencePattern {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
  count?: number;
}

export interface EventReminder {
  id: string;
  time: number;
  type: 'notification' | 'email' | 'sound';
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'personal' | 'work' | 'health' | 'social';
  color: string;
  allDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  category: string;
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  category: string;
  location?: string;
  attendees?: string[];
  priority: 'low' | 'medium' | 'high';
  reminders: number[];
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  paymentMethod: string;
  type: 'expense' | 'income';
  currency: string;
  tags?: string[];
  receipt?: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
}

export interface FinancialGoal {
  id: string;
  name: string;
  type: 'savings' | 'investment' | 'debt_payment';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in_progress' | 'completed' | 'archived';
  developmentStage?: 'spark' | 'concept' | 'prototype' | 'mvp';
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  estimatedHours: number;
  actualHours: number;
  resources: string[];
  tags: string[];
  url?: string;
  notes?: string;
  type?: 'course' | 'book' | 'tutorial' | 'practice';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string[];
  category: 'strength' | 'cardio' | 'flexibility' | 'sports';
  muscleGroups: string[];
  equipment: string[] | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  tips?: string[];
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  duration?: number;
  restTime?: number;
  completed: boolean;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  duration?: number;
  restTime?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
  restTime?: number;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  date: Date;
  exercises: WorkoutExercise[];
  duration: number;
  type?: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  difficulty?: 'easy' | 'medium' | 'hard';
  notes?: string;
  createdAt?: Date;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'time' | 'distance';
  value: number;
  unit: string;
  date: Date;
  notes?: string;
}

export interface FocusSession {
  id: string;
  duration: number;
  type: 'focus' | 'short-break' | 'long-break';
  technique: 'pomodoro' | 'deep-work' | 'timeboxing';
  completed: boolean;
  date: Date;
  quality: number;
  distractions: number;
  notes?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlan {
  id: string;
  name: string;
  date: Date;
  meals: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
    snacks?: string[];
  };
  createdAt: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
  prepTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  rating?: number;
  createdAt: Date;
  image?: string;
  nutritionalInfo?: NutritionInfo;
  isFavorite?: boolean;
  cuisine?: string;
}

export interface WellnessEntry {
  id: string;
  date: string;
  mood?: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  energy?: number;
  stress?: number;
  sleep?: number;
  exercise?: boolean;
  symptoms?: string[];
  notes?: string;
  tags?: string[];
  waterIntake?: number;
  waterGlasses: number;
  sleepHours: number;
  meditationMinutes?: number;
  createdAt?: Date;
  energyLevel?: number;
  stressLevel?: number;
  steps?: number;
  weight?: number;
  heartRate?: number;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount?: number;
  target?: number;
  unit?: string;
  color?: string;
  type?: 'numeric' | 'boolean';
  difficulty?: 'easy' | 'medium' | 'hard';
  isActive?: boolean;
  reminderTime?: string | null;
  streak?: number;
  bestStreak?: number;
  completions: { date: string; count: number; completed?: boolean }[];
  createdAt: Date;
  updatedAt?: Date;
  icon?: string;
  streakTarget?: number;
  description?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: Date;
  count: number;
  notes?: string;
  completed?: boolean;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
}
