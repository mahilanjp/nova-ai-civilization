import Groq from 'groq-sdk'
import {NextResponse} from 'next/server'

import {serverClient} from '@/sanity/lib/serverClient'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

type SimulationReaction = {
  citizenId: string
  reaction: string
  reasoning: string
  proposedMood: 'happy' | 'calm' | 'worried' | 'angry' | 'sad' | 'excited'
  proposedEnergyChange: number
}

const worldQuery = `{
  "event": *[
    _type == "worldEvent" &&
    status != "resolved" &&
    status != "rejected"
  ] | order(occurredAt desc)[0]{
    _id,
    title,
    eventType,
    description,
    severity,
    status,
    occurredAt,
    "affectedLocations": affectedLocations[]->{
      _id,
      name,
      type,
      condition,
      powerAvailable,
      importance
    }
  },

  "citizens": *[_type == "citizen"] | order(name asc){
    _id,
    name,
    age,
    occupation,
    personality,
    goal,
    mood,
    energy,
    wealth,
    status,
    "location": location->{
      _id,
      name,
      type,
      condition,
      powerAvailable,
      importance
    }
  },

  "relationships": *[_type == "relationship"]{
    _id,
    relationshipType,
    trust,
    affinity,
    notes,
    "fromCitizen": fromCitizen->{
      _id,
      name
    },
    "toCitizen": toCitizen->{
      _id,
      name
    }
  }
}`

export async function POST() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {success: false, error: 'GROQ_API_KEY is missing'},
        {status: 500},
      )
    }

    const world = await serverClient.fetch(worldQuery)

    if (!world.event) {
      return NextResponse.json(
        {success: false, error: 'No active world event found'},
        {status: 404},
      )
    }

    if (!world.citizens?.length) {
      return NextResponse.json(
        {success: false, error: 'No citizens found'},
        {status: 404},
      )
    }

    const existingReactionCount = await serverClient.fetch<number>(
      `count(*[
        _type == "reaction" &&
        event._ref == $eventId
      ])`,
      {eventId: world.event._id},
    )

    if (existingReactionCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This event already has generated reactions. Review them before simulating again.',
        },
        {status: 409},
      )
    }

    const citizenDirectory = world.citizens
      .map(
        (citizen: { _id: string; name: string }) =>
          `${citizen._id} = ${citizen.name}`,
      )
      .join('\n')

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',

      messages: [
        {
          role: 'system',
          content: `
You are NOVA's civilization simulation intelligence.

NOVA is a fictional town represented by structured Sanity data.

Given one world event, citizens, their current state, locations, goals,
personalities, occupations, and relationships, propose one believable
immediate reaction for every citizen.

Rules:
- Every citizen must receive exactly one reaction.
- Use only citizen IDs supplied in the citizen directory.
- Reactions should differ based on occupation, personality, location,
  relationships, and goals.
- Do not invent new citizens.
- Do not infer or invent personal attributes that are not present in the
  supplied Sanity data, including gender, pronouns, family details, or
  background.
- When a citizen's pronouns are not explicitly provided, refer to the
  citizen by name or use gender-neutral language such as "they/them".
- Do not permanently change world state.
- Energy change must be an integer from -100 to 100.
- proposedMood must be one of:
  happy, calm, worried, angry, sad, excited.
- "reasoning" means a short user-facing rationale, not hidden
  chain-of-thought.
- Keep each reaction and rationale concise.

Return ONLY valid JSON in exactly this shape:

{
  "reactions": [
    {
      "citizenId": "exact Sanity citizen id",
      "reaction": "what the citizen immediately does",
      "reasoning": "brief rationale",
      "proposedMood": "worried",
      "proposedEnergyChange": -10
    }
  ]
}
          `.trim(),
        },
        {
          role: 'user',
          content: `
CITIZEN DIRECTORY:
${citizenDirectory}

CURRENT NOVA WORLD STATE:
${JSON.stringify(world, null, 2)}

Simulate the immediate response of every citizen to the current event.
          `.trim(),
        },
      ],

      temperature: 0.6,
      max_completion_tokens: 3000,

      response_format: {
        type: 'json_object',
      },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('Groq returned an empty simulation')
    }

    const parsed = JSON.parse(content) as {
      reactions?: SimulationReaction[]
    }

    if (!Array.isArray(parsed.reactions)) {
      throw new Error('AI response did not contain a reactions array')
    }

    const validCitizenIds = new Set(
      world.citizens.map((citizen: {_id: string}) => citizen._id),
    )

    const validMoods = new Set([
      'happy',
      'calm',
      'worried',
      'angry',
      'sad',
      'excited',
    ])

    const seenCitizenIds = new Set<string>()

    const reactions = parsed.reactions.filter((reaction) => {
      if (!validCitizenIds.has(reaction.citizenId)) return false
      if (seenCitizenIds.has(reaction.citizenId)) return false
      if (!validMoods.has(reaction.proposedMood)) return false
      if (typeof reaction.reaction !== 'string') return false
      if (typeof reaction.reasoning !== 'string') return false

      seenCitizenIds.add(reaction.citizenId)

      reaction.proposedEnergyChange = Math.max(
        -100,
        Math.min(
          100,
          Math.round(Number(reaction.proposedEnergyChange) || 0),
        ),
      )

      return true
    })

    if (reactions.length !== world.citizens.length) {
      throw new Error(
        `Expected ${world.citizens.length} citizen reactions but received ${reactions.length} valid reactions`,
      )
    }

    let transaction = serverClient.transaction()

    for (const reaction of reactions) {
      transaction = transaction.create({
        _type: 'reaction',

        event: {
          _type: 'reference',
          _ref: world.event._id,
        },

        citizen: {
          _type: 'reference',
          _ref: reaction.citizenId,
        },

        reaction: reaction.reaction,
        reasoning: reaction.reasoning,
        proposedMood: reaction.proposedMood,
        proposedEnergyChange: reaction.proposedEnergyChange,
        approvalStatus: 'pending',
      })
    }

    transaction = transaction.patch(world.event._id, (patch) =>
      patch.set({
        status: 'awaitingApproval',
      }),
    )

    await transaction.commit()

    return NextResponse.json({
      success: true,
      event: world.event.title,
      generated: reactions.length,
      status: 'awaitingApproval',
      reactions,
    })
  } catch (error) {
    console.error('NOVA simulation error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown simulation error',
      },
      {status: 500},
    )
  }
}