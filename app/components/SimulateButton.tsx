'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'

type Props = {
  hasReactions: boolean
  eventStatus: string
}

export default function SimulateButton({
  hasReactions,
  eventStatus,
}: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function simulate() {
    if (hasReactions || eventStatus !== 'draft') return

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed')
      }

      setMessage(
        `${data.generated ?? 0} citizen responses generated successfully.`,
      )

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Simulation failed',
      )
    } finally {
      setLoading(false)
    }
  }

  const decisionsComplete =
    eventStatus === 'approved' || eventStatus === 'rejected'

  const disabled =
    loading ||
    hasReactions ||
    decisionsComplete ||
    eventStatus !== 'draft'

  let buttonText = 'SIMULATE RESPONSE'

  if (loading) {
    buttonText = 'SIMULATING...'
  } else if (decisionsComplete) {
    buttonText = 'DECISIONS COMPLETE'
  } else if (hasReactions || eventStatus === 'awaitingApproval') {
    buttonText = 'AWAITING DECISIONS'
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={simulate}
        disabled={disabled}
        className="w-full rounded-lg bg-sky-400 px-4 py-3 text-sm font-bold tracking-wide text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {buttonText}
      </button>

      {message && (
        <p className="mt-3 text-xs text-emerald-400">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}