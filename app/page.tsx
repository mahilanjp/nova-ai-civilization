import {client} from '@/sanity/lib/client'
export const dynamic = 'force-dynamic'
import ReactionActions from './components/ReactionActions'
import SimulateButton from './components/SimulateButton'
import ResolveEventButton from './components/ResolveEventButton'

type Citizen = {
  _id: string
  name: string
  occupation: string
  mood: string
  energy: number
  status: string
  location: string
}

type Location = {
  _id: string
  name: string
  type: string
  condition: string
  powerAvailable: boolean
  importance: number
}

type WorldEvent = {
  _id: string
  title: string
  eventType: string
  description: string
  severity: number
  status: string
  occurredAt?: string
  affectedLocations?: string[]
}

const query = `{
  "citizens": *[_type == "citizen"] | order(name asc) {
    _id,
    name,
    occupation,
    mood,
    energy,
    status,
    "location": location->name
  },

  "locations": *[_type == "location"] | order(name asc) {
    _id,
    name,
    type,
    condition,
    powerAvailable,
    importance
  },

  "activeEvents": *[
    _type == "worldEvent" &&
    status != "resolved" &&
    status != "rejected"
  ] | order(occurredAt desc) {
    _id,
    title,
    eventType,
    description,
    severity,
    status,
    occurredAt,
         "affectedLocations": affectedLocations[]->name
  },

  "reactions": *[_type == "reaction"] | order(_createdAt asc) {
    _id,
    reaction,
    reasoning,
    proposedMood,
    proposedEnergyChange,
    approvalStatus,

    "citizen": citizen->{
      _id,
      name,
      occupation
    },

    "event": event->{
      _id,
      title
    }
  }
}`

function moodIcon(mood: string) {
  switch (mood) {
    case 'happy':
      return '●'
    case 'excited':
      return '◆'
    case 'worried':
      return '▲'
    case 'angry':
      return '!'
    case 'sad':
      return '▼'
    default:
      return '●'
  }
}

export default async function Home() {
  const data: {
  citizens: Citizen[]
  locations: Location[]
  activeEvents: WorldEvent[]

  reactions: {
    _id: string
    reaction: string
    reasoning: string
    proposedMood: string
    proposedEnergyChange: number
    approvalStatus: string

    citizen: {
      _id: string
      name: string
      occupation: string
    }

    event: {
      _id: string
      title: string
    }
  }[]
} = await client.fetch(query)

  const primaryEvent = data.activeEvents[0]
  const primaryEventHasReactions = primaryEvent
  ? data.reactions.some(
      (reaction) => reaction.event?._id === primaryEvent._id,
    )
  : false
    
  const currentEventReactions = primaryEvent
  ? data.reactions.filter(
      (reaction) => reaction.event?._id === primaryEvent._id,
    )
  : []

  const operationalLocations = data.locations.filter(
    (location) => location.condition === 'operational',
  ).length

  const averageEnergy = data.citizens.length
    ? Math.round(
        data.citizens.reduce((total, citizen) => total + citizen.energy, 0) /
          data.citizens.length,
      )
    : 0

  return (
    <main className="min-h-screen px-5 py-6 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="mb-10 flex flex-col gap-5 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.35em] text-sky-400">
              NOVA CIVILIZATION SYSTEM
            </p>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              WORLD CONTROL
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Structured autonomous civilization simulation
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold tracking-widest text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            SYSTEM ONLINE
          </div>
        </header>

        {/* WORLD STATS */}

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="POPULATION"
            value={data.citizens.length}
            detail="Registered citizens"
          />

          <StatCard
            label="LOCATIONS"
            value={data.locations.length}
            detail={`${operationalLocations} operational`}
          />

          <StatCard
            label="ACTIVE EVENTS"
            value={data.activeEvents.length}
            detail={data.activeEvents.length ? 'Attention required' : 'World stable'}
          />

          <StatCard
            label="AVG. ENERGY"
            value={`${averageEnergy}%`}
            detail="Citizen network"
          />
        </section>

        {/* ACTIVE EVENT */}

        <section className="mb-12">
          <SectionTitle
            title="ACTIVE WORLD EVENT"
            subtitle="Current event requiring civilization response"
          />

          {primaryEvent ? (
            <article className="overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.04]">
              <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
                      {primaryEvent.eventType}
                    </span>

                    <span className="text-xs uppercase tracking-widest text-slate-500">
                      {primaryEvent.status
                          .replace(/([A-Z])/g, ' $1')
                          .trim()
                          .toUpperCase()}
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold md:text-3xl">
                    ⚡ {primaryEvent.title}
                  </h2>

                  <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                    {primaryEvent.description}
                  </p>

                  {primaryEvent.affectedLocations &&
                    primaryEvent.affectedLocations.length > 0 && (
                      <p className="mt-5 text-sm text-slate-500">
                        Affected:{' '}
                        {primaryEvent.affectedLocations.join(' • ')}
                      </p>
                    )}
                </div>

                <div className="min-w-52 rounded-xl border border-slate-800 bg-black/20 p-5">
                  <p className="text-xs tracking-[0.2em] text-slate-500">
                    SEVERITY
                  </p>

                  <p className="mt-2 text-4xl font-semibold text-amber-300">
                    {primaryEvent.severity}
                    <span className="text-lg text-slate-600"> / 10</span>
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${primaryEvent.severity * 10}%`,
                      }}
                    />
                  </div>

                  <SimulateButton
                          hasReactions={primaryEventHasReactions}
                          eventStatus={primaryEvent.status}
                  />
                  {primaryEvent.status === 'approved' && (
                         <ResolveEventButton eventId={primaryEvent._id} />
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              No active world events.
            </div>
          )}
        </section>
{/* AI DECISION QUEUE */}

<section className="mb-12">
  <SectionTitle
    title="AI DECISION QUEUE"
    subtitle="AI-proposed citizen responses awaiting human approval"
  />

  {currentEventReactions.length > 0 ? (
    <div className="grid gap-4 lg:grid-cols-2">
      {currentEventReactions.map((reaction) => (
        <article
          key={reaction._id}
          className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-400">
                AI PROPOSAL
              </p>

              <h3 className="mt-2 text-lg font-semibold">
                {reaction.citizen.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {reaction.citizen.occupation}
              </p>
            </div>

            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                reaction.approvalStatus === 'approved'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : reaction.approvalStatus === 'rejected'
                ? 'border-rose-400/20 bg-rose-400/10 text-rose-300'
                : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
               }`}
              >
  {reaction.approvalStatus}
</span>
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              PROPOSED REACTION
            </p>

            <p className="mt-3 leading-6 text-slate-200">
              {reaction.reaction}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              AI RATIONALE
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {reaction.reasoning}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-500">PROPOSED MOOD</p>

              <p className="mt-1 capitalize text-sky-300">
                {reaction.proposedMood}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-500">ENERGY CHANGE</p>

              <p
                className={
                  reaction.proposedEnergyChange >= 0
                    ? 'mt-1 text-emerald-400'
                    : 'mt-1 text-rose-400'
                }
              >
                {reaction.proposedEnergyChange > 0 ? '+' : ''}
                {reaction.proposedEnergyChange}
              </p>
            </div>
          </div>

          <ReactionActions
             reactionId={reaction._id}
             currentStatus={reaction.approvalStatus}
          />
        </article>
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8">
      <p className="text-slate-400">
          {primaryEvent
             ? 'No AI decisions have been generated for the current event.'
             : 'No active event. AI decision queue is clear.'}
      </p>
    </div>
  )}
</section>


        {/* CITIZENS */}

        <section className="mb-12">
          <SectionTitle
            title="CITIZEN NETWORK"
            subtitle="Live state from the Sanity Content Lake"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.citizens.map((citizen) => (
              <article
                key={citizen._id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:-translate-y-1 hover:border-slate-700"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{citizen.name}</h3>
                    <p className="mt-1 text-sm text-sky-400">
                      {citizen.occupation}
                    </p>
                  </div>

                  <span className="text-emerald-400">
                    {moodIcon(citizen.mood)}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <DataRow label="Mood" value={citizen.mood} />

                  <DataRow
                    label="Energy"
                    value={`${citizen.energy}%`}
                  />

                  <DataRow
                    label="Status"
                    value={citizen.status}
                  />

                  <DataRow
                    label="Location"
                    value={citizen.location || 'Unknown'}
                  />
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-400"
                    style={{width: `${citizen.energy}%`}}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* LOCATIONS */}

        <section>
          <SectionTitle
            title="INFRASTRUCTURE"
            subtitle="Live location and infrastructure status"
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.locations.map((location) => (
              <article
                key={location._id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                      {location.type}
                    </p>
                  </div>

                  <span
                   className={
                     location.condition === 'operational'
                     ? 'text-xs font-semibold text-emerald-400'
                     : location.condition === 'emergency'
                     ? 'text-xs font-semibold text-amber-400'
                     : location.condition === 'damaged'
                     ? 'text-xs font-semibold text-orange-400'
                     : 'text-xs font-semibold text-rose-400'
                   }
             >
  {location.condition.toUpperCase()}
</span>
                </div>

                <div className="mt-5 flex justify-between text-sm text-slate-400">
                  <span>
                    Power: {location.powerAvailable ? 'ONLINE' : 'OFFLINE'}
                  </span>

                  <span>Priority {location.importance}/10</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-14 border-t border-slate-800 py-6 text-xs tracking-wider text-slate-600">
          NOVA WORLD CONTROL // SANITY CONTENT LAKE
        </footer>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold">{value}</p>

      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-200">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

function DataRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] truncate capitalize text-right text-slate-300">
        {value}
      </span>
    </div>
  )
}