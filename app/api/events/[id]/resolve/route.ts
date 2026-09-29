import {NextRequest, NextResponse} from 'next/server'

import {serverClient} from '@/sanity/lib/serverClient'

type EventDocument = {
  _id: string
  title: string
  eventType: string
  status: string
  affectedLocations?: {
    _id: string
    name: string
    type: string
    condition: string
    powerAvailable: boolean
  }[]
}

export async function POST(
  _request: NextRequest,
  context: {params: Promise<{id: string}>},
) {
  try {
    const {id} = await context.params

    const event = await serverClient.fetch<EventDocument | null>(
      `*[_type == "worldEvent" && _id == $id][0]{
        _id,
        title,
        eventType,
        status,

        "affectedLocations": affectedLocations[]->{
          _id,
          name,
          type,
          condition,
          powerAvailable
        }
      }`,
      {id},
    )

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'World event not found',
        },
        {status: 404},
      )
    }

    if (event.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only approved events can be resolved',
        },
        {status: 409},
      )
    }

    let transaction = serverClient.transaction()
    let worldImpact = ''

    if (event.eventType === 'blackout') {
      const affectedLocations = event.affectedLocations ?? []

      for (const location of affectedLocations) {
        if (location.type === 'healthcare') {
          transaction = transaction.patch(location._id, (patch) =>
            patch.set({
              condition: 'emergency',
              powerAvailable: true,
            }),
          )
        } else {
          transaction = transaction.patch(location._id, (patch) =>
            patch.set({
              condition: 'offline',
              powerAvailable: false,
            }),
          )
        }
      }

      worldImpact =
        'The blackout disrupted NOVA infrastructure. Affected locations went offline while healthcare entered emergency operation on backup power.'
    } else {
      worldImpact =
        'Citizen decisions were completed and the event was resolved. No automated infrastructure mutation was defined for this event type.'
    }

    transaction = transaction.patch(event._id, (patch) =>
      patch.set({
        status: 'resolved',
        worldImpact,
      }),
    )

    await transaction.commit()

    return NextResponse.json({
      success: true,
      event: event.title,
      status: 'resolved',
      worldImpact,
    })
  } catch (error) {
    console.error('NOVA event resolution error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown event resolution error',
      },
      {status: 500},
    )
  }
}