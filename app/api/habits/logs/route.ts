import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  logHabit,
  getHabitLogsByDate,
  updateHabitLog,
  getHabitLogs,
} from '@/lib/db-store'

// GET /api/habits/logs?date=YYYY-MM-DD - Get logs for a specific date
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const habitId = url.searchParams.get('habitId')

    if (habitId) {
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')
      const logs = getHabitLogs(habitId, startDate || undefined, endDate || undefined)
      return NextResponse.json(logs)
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const logs = getHabitLogsByDate(session.userId, date)

    return NextResponse.json(logs)
  } catch (error) {
    console.error('[v0] Get habit logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/habits/logs - Create or update a habit log
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { habitId, date, completed, notes } = await request.json()

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'Habit ID and date are required' },
        { status: 400 }
      )
    }

    const log = logHabit(session.userId, habitId, date, completed, notes)

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('[v0] Create habit log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/habits/logs/:id - Update a habit log
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      )
    }

    const log = updateHabitLog(id, updates)

    if (!log) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('[v0] Update habit log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
