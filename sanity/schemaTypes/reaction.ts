import {defineField, defineType} from 'sanity'

export const reactionType = defineType({
  name: 'reaction',
  title: 'Citizen Reaction',
  type: 'document',

  fields: [
    defineField({
      name: 'event',
      title: 'World Event',
      type: 'reference',
      to: [{type: 'worldEvent'}],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'citizen',
      title: 'Citizen',
      type: 'reference',
      to: [{type: 'citizen'}],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'reaction',
      title: 'Reaction',
      type: 'text',
      rows: 4,
      description: 'What the citizen decides to do.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'reasoning',
      title: 'Reason',
      type: 'text',
      rows: 4,
      description:
        'A concise explanation based on the citizen and world state, not hidden model reasoning.',
    }),

    defineField({
      name: 'proposedMood',
      title: 'Proposed Mood',
      type: 'string',
      options: {
        list: [
          {title: 'Happy', value: 'happy'},
          {title: 'Calm', value: 'calm'},
          {title: 'Worried', value: 'worried'},
          {title: 'Angry', value: 'angry'},
          {title: 'Sad', value: 'sad'},
          {title: 'Excited', value: 'excited'},
        ],
      },
    }),

    defineField({
      name: 'proposedEnergyChange',
      title: 'Proposed Energy Change',
      type: 'number',
      description: 'Example: -20 or +10.',
      validation: (rule) => rule.min(-100).max(100),
    }),

    defineField({
      name: 'proposedLocation',
      title: 'Proposed Location',
      type: 'reference',
      to: [{type: 'location'}],
    }),

    defineField({
      name: 'approvalStatus',
      title: 'Approval Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending Review', value: 'pending'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
        ],
      },
      initialValue: 'pending',
    }),
  ],

  preview: {
    select: {
      citizen: 'citizen.name',
      event: 'event.title',
      status: 'approvalStatus',
    },
    prepare({citizen, event, status}) {
      return {
        title: citizen || 'Unknown Citizen',
        subtitle: `${event || 'Unknown Event'} • ${status || 'pending'}`,
      }
    },
  },
})