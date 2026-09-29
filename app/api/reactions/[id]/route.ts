import {NextRequest, NextResponse} from 'next/server'

import {serverClient} from '@/sanity/lib/serverClient'

type ReactionDocument = {
  _id: string
  approvalStatus: string
  proposedMood?: string
  proposedEnergyChange?: number

  citizen?: {
    _id: string
    name: string
    energy: number
  }

  event?: {
    _id: string
  }
}

export async function POST(
  request: NextRequest,
  context: {params: Promise<{id: string}>},
) {
  try {
    const {id} = await context.params

    const body = await request.json()
    const action = body.action

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        {
          success: false,
          error: 'Action must be approve or reject',
        },
        {status: 400},
      )
    }

    const reaction = await serverClient.fetch<ReactionDocument | null>(
      `*[_type == "reaction" && _id == $id][0]{
        _id,
        approvalStatus,
        proposedMood,
        proposedEnergyChange,

        "citizen": citizen->{
          _id,
          name,
          energy
        },

        "event": event->{
          _id
        }
      }`,
      {id},
    )

    if (!reaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reaction not found',
        },
        {status: 404},
      )
    }

    if (reaction.approvalStatus !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Reaction is already ${reaction.approvalStatus}`,
        },
        {status: 409},
      )
    }

    if (action === 'approve') {
      if (!reaction.citizen?._id) {
        throw new Error('Reaction has no citizen reference')
      }

      const currentEnergy = reaction.citizen.energy ?? 0
      const energyChange = reaction.proposedEnergyChange ?? 0

      const newEnergy = Math.max(
        0,
        Math.min(100, currentEnergy + energyChange),
      )

      let transaction = serverClient.transaction()

      transaction = transaction.patch(reaction._id, (patch) =>
        patch.set({
          approvalStatus: 'approved',
        }),
      )

      transaction = transaction.patch(reaction.citizen._id, (patch) => {
        const updates: {
          energy: number
          mood?: string
        } = {
          energy: newEnergy,
        }

        if (reaction.proposedMood) {
          updates.mood = reaction.proposedMood
        }

        return patch.set(updates)
      })

      await transaction.commit()
    } else {
      await serverClient
        .patch(reaction._id)
        .set({
          approvalStatus: 'rejected',
        })
        .commit()
    }

       if (reaction.event?._id) {
      const decisionCounts = await serverClient.fetch<{
        pending: number
        approved: number
        rejected: number
      }>(
        `{
          "pending": count(*[
            _type == "reaction" &&
            event._ref == $eventId &&
            approvalStatus == "pending"
          ]),

          "approved": count(*[
            _type == "reaction" &&
            event._ref == $eventId &&
            approvalStatus == "approved"
          ]),

          "rejected": count(*[
            _type == "reaction" &&
            event._ref == $eventId &&
            approvalStatus == "rejected"
          ])
        }`,
        {
          eventId: reaction.event._id,
        },
      )

      if (decisionCounts.pending === 0) {
        const finalStatus =
          decisionCounts.approved > 0 ? 'approved' : 'rejected'

        await serverClient
          .patch(reaction.event._id)
          .set({
            status: finalStatus,
          })
          .commit()
      }
    }

    return NextResponse.json({
      success: true,
      action,
      reactionId: reaction._id,
      citizen: reaction.citizen?.name,
    })
  } catch (error) {
    console.error('NOVA reaction decision error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown reaction decision error',
      },
      {status: 500},
    )
  }
}