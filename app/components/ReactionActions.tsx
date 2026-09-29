'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'

type Props = {
  reactionId: string
  currentStatus: string
}

export default function ReactionActions({
  reactionId,
  currentStatus,
}: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(action: 'approve' | 'reject') {
    try {
      setLoading(action)
      setError(null)

      const response = await fetch(`/api/reactions/${reactionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({action}),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Decision failed')
      }

      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      )
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus !== 'pending') {
    return (
      <div
        className={
          currentStatus === 'approved'
            ? 'mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider text-emerald-400'
            : 'mt-5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider text-rose-400'
        }
      >
        {currentStatus}
      </div>
    )
  }

  return (
    <div className="mt-5">
      <div className="flex gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => decide('approve')}
          className="flex-1 cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-wait disabled:opacity-50"
        >
          {loading === 'approve' ? 'APPLYING...' : 'APPROVE'}
        </button>

        <button
          type="button"
          disabled={loading !== null}
          onClick={() => decide('reject')}
          className="flex-1 cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:cursor-wait disabled:opacity-50"
        >
          {loading === 'reject' ? 'REJECTING...' : 'REJECT'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}