import {defineField, defineType} from 'sanity'

export const citizenType = defineType({
  name: 'citizen',
  title: 'Citizen',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'age',
      title: 'Age',
      type: 'number',
      validation: (rule) => rule.required().min(0).max(120),
    }),

    defineField({
      name: 'occupation',
      title: 'Occupation',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'location',
      title: 'Current Location',
      type: 'reference',
      to: [{type: 'location'}],
    }),

    defineField({
      name: 'personality',
      title: 'Personality',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Core personality traits of this citizen.',
    }),

    defineField({
      name: 'goal',
      title: 'Primary Goal',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'mood',
      title: 'Current Mood',
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
      initialValue: 'calm',
    }),

    defineField({
      name: 'energy',
      title: 'Energy',
      type: 'number',
      description: 'Current energy level from 0 to 100.',
      validation: (rule) => rule.min(0).max(100),
      initialValue: 100,
    }),

    defineField({
      name: 'wealth',
      title: 'Wealth',
      type: 'number',
      description: 'Amount of NOVA credits owned by this citizen.',
      validation: (rule) => rule.min(0),
      initialValue: 100,
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Resting', value: 'resting'},
          {title: 'Working', value: 'working'},
          {title: 'Emergency', value: 'emergency'},
        ],
      },
      initialValue: 'active',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'occupation',
    },
  },
})