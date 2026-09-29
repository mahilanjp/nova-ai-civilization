'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'

type Props = {
  eventId: string
}

export default function ResolveEventButton({eventId}: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function resolveEvent() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `/api/events/${eventId}/resolve`,
        {
          method: 'POST',
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Event resolution failed')
      }

      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Event resolution failed',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={resolveEvent}
        disabled={loading}
        className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold tracking-wide text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'RESOLVING...' : 'RESOLVE EVENT'}
      </button>

      {error && (
        <p className="mt-3 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}