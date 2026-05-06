import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  createHabit,
  getHabitsByUserId,
  deleteHabit,
  updateHabit,
  getHabitStats,
} from '@/lib/db-store'

// GET /api/habits - Get all habits for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const habits = getHabitsByUserId(session.userId)
    const habitsWithStats = habits.map(habit => ({
      ...habit,
      stats: getHabitStats(habit.id),
    }))

    return NextResponse.json(habitsWithStats)
  } catch (error) {
    console.error('[v0] Get habits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { name, category = 'general', color = 'blue' } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      )
    }

    const habit = createHabit(session.userId, name, category, color)

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error('[v0] Create habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/habits/:id - Update a habit
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
        { error: 'Habit ID is required' },
        { status: 400 }
      )
    }

    const habit = updateHabit(id, updates)

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(habit)
  } catch (error) {
    console.error('[v0] Update habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/habits/:id - Delete a habit
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      )
    }

    const deleted = deleteHabit(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete habit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
