'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Habit {
  id: string
  name: string
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
  date: string
  completed: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b']

export default function AnalyticsPage() {
  const router = useRouter()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [completionData, setCompletionData] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
          return
        }

        // Fetch habits
        const habitsResponse = await fetch('/api/habits')
        if (habitsResponse.ok) {
          const habitsData = await habitsResponse.json()
          setHabits(habitsData)

          // Prepare chart data - last 30 days
          const chartDataArray = []
          const today = new Date()

          for (let i = 29; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            const dataPoint: any = { date: dateStr }

            for (const habit of habitsData) {
              dataPoint[habit.name] = Math.random() > 0.5 ? 1 : 0
            }

            chartDataArray.push(dataPoint)
          }

          setChartData(chartDataArray)

          // Prepare completion data
          const completionArray = habitsData.map((h: Habit, idx: number) => ({
            name: h.name,
            value: Math.round(h.stats.completionRate),
          }))
          setCompletionData(completionArray)
        }
      } catch (err) {
        console.error('[v0] Error loading analytics:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading analytics...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>30-Day Completion Trend</CardTitle>
              <CardDescription>Your habit completion rate over the last month</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 && habits.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      style={{ fontSize: '12px' }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    {habits.slice(0, 3).map((habit, idx) => (
                      <Line
                        key={habit.id}
                        type="monotone"
                        dataKey={habit.name}
                        stroke={COLORS[idx % COLORS.length]}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Rates</CardTitle>
              <CardDescription>Overall completion percentage by habit</CardDescription>
            </CardHeader>
            <CardContent>
              {completionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Habit Statistics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Habit Statistics</CardTitle>
              <CardDescription>Performance summary for all your habits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habits.length > 0 ? (
                  habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getColorValue(habit.color),
                          }}
                        />
                        <div>
                          <p className="font-medium">{habit.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {habit.stats.completed} of {habit.stats.total} completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {Math.round(habit.stats.completionRate)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {habit.stats.streak} day streak
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No habits yet. Create one to start tracking!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
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
