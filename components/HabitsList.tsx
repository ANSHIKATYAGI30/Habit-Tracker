'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate } from '@/lib/utils'

interface Habit {
  id: string
  name: string
  category: string
  color: string
  stats: {
    completed: number
    total: number
    completionRate: number
    streak: number
  }
}

interface HabitLog {
  id: string
  habitId: string
  completed: boolean
}

export function HabitsList() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayLogs, setTodayLogs] = useState<Map<string, HabitLog>>(new Map())
  const [loading, setLoading] = useState(true)

  const today = formatDate(new Date())

  useEffect(() => {
    fetchHabits()
    fetchTodayLogs()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data)
      }
    } catch (err) {
      console.error('[v0] Error fetching habits:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayLogs = async () => {
    try {
      const response = await fetch(`/api/habits/logs?date=${today}`)
      if (response.ok) {
        const logs = await response.json()
        const logsMap = new Map(logs.map((log: HabitLog) => [log.habitId, log]))
        setTodayLogs(logsMap)
      }
    } catch (err) {
      console.error('[v0] Error fetching logs:', err)
    }
  }

  const handleToggleHabit = async (habitId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/habits/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date: today,
          completed: !completed,
        }),
      })

      if (response.ok) {
        const updatedLog = await response.json()
        const newLogs = new Map(todayLogs)
        newLogs.set(habitId, updatedLog)
        setTodayLogs(newLogs)
        fetchHabits()
      }
    } catch (err) {
      console.error('[v0] Error updating habit:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading habits...</div>
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No habits yet. Create one to get started!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => {
        const todayLog = todayLogs.get(habit.id)
        const isCompleted = todayLog?.completed || false

        return (
          <Card key={habit.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggleHabit(habit.id, isCompleted)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base">{habit.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {habit.stats.streak} day streak • {Math.round(habit.stats.completionRate)}% completion
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: getColorValue(habit.color),
                    }}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}

function getColorValue(colorName: string): string {
  const colors: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    yellow: '#f59e0b',
  }
  return colors[colorName] || colors.blue
}
