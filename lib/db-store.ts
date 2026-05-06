import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  password: string
  name?: string
  createdAt: Date
}

export interface Habit {
  id: string
  userId: string
  name: string
  category: string
  color: string
  frequency: string
  createdAt: Date
  updatedAt: Date
}

export interface HabitLog {
  id: string
  userId: string
  habitId: string
  date: string // YYYY-MM-DD
  completed: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// In-memory stores
let users: Map<string, User> = new Map()
let habits: Map<string, Habit> = new Map()
let habitLogs: Map<string, HabitLog> = new Map()

// User operations
export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User | null> {
  if (Array.from(users.values()).some(u => u.email === email)) {
    return null // Email already exists
  }

  const id = Math.random().toString(36).substring(2, 15)
  const hashedPassword = await bcrypt.hash(password, 10)

  const user: User = {
    id,
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
  }

  users.set(id, user)
  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return (
    Array.from(users.values()).find(u => u.email === email) || null
  )
}

export async function getUserById(id: string): Promise<User | null> {
  return users.get(id) || null
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Habit operations
export function createHabit(
  userId: string,
  name: string,
  category: string = 'general',
  color: string = 'blue'
): Habit {
  const id = Math.random().toString(36).substring(2, 15)
  const now = new Date()

  const habit: Habit = {
    id,
    userId,
    name,
    category,
    color,
    frequency: 'daily',
    createdAt: now,
    updatedAt: now,
  }

  habits.set(id, habit)
  return habit
}

export function getHabitsByUserId(userId: string): Habit[] {
  return Array.from(habits.values()).filter(h => h.userId === userId)
}

export function getHabitById(id: string): Habit | null {
  return habits.get(id) || null
}

export function updateHabit(id: string, updates: Partial<Habit>): Habit | null {
  const habit = habits.get(id)
  if (!habit) return null

  const updated = { ...habit, ...updates, updatedAt: new Date() }
  habits.set(id, updated)
  return updated
}

export function deleteHabit(id: string): boolean {
  return habits.delete(id)
}

// HabitLog operations
export function logHabit(
  userId: string,
  habitId: string,
  date: string,
  completed: boolean,
  notes?: string
): HabitLog {
  const id = Math.random().toString(36).substring(2, 15)
  const now = new Date()

  // Check if log already exists for this habit on this date
  const existing = Array.from(habitLogs.values()).find(
    log => log.habitId === habitId && log.date === date && log.userId === userId
  )

  if (existing) {
    return updateHabitLog(existing.id, { completed, notes }) || existing
  }

  const log: HabitLog = {
    id,
    userId,
    habitId,
    date,
    completed,
    notes,
    createdAt: now,
    updatedAt: now,
  }

  habitLogs.set(id, log)
  return log
}

export function getHabitLogsByDate(
  userId: string,
  date: string
): HabitLog[] {
  return Array.from(habitLogs.values()).filter(
    log => log.userId === userId && log.date === date
  )
}

export function getHabitLogs(
  habitId: string,
  startDate?: string,
  endDate?: string
): HabitLog[] {
  return Array.from(habitLogs.values()).filter(log => {
    if (log.habitId !== habitId) return false
    if (startDate && log.date < startDate) return false
    if (endDate && log.date > endDate) return false
    return true
  })
}

export function updateHabitLog(
  id: string,
  updates: Partial<HabitLog>
): HabitLog | null {
  const log = habitLogs.get(id)
  if (!log) return null

  const updated = { ...log, ...updates, updatedAt: new Date() }
  habitLogs.set(id, updated)
  return updated
}

// Statistics
export function getHabitStats(habitId: string) {
  const logs = getHabitLogs(habitId)
  const completedCount = logs.filter(l => l.completed).length
  const totalCount = logs.length

  // Calculate streak
  let streak = 0
  const today = new Date()
  let currentDate = new Date(today)

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const log = logs.find(l => l.date === dateStr && l.completed)
    if (!log) break
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return {
    completed: completedCount,
    total: totalCount,
    completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    streak,
  }
}
