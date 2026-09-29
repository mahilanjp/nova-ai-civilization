import {defineField, defineType} from 'sanity'

export const relationshipType = defineType({
  name: 'relationship',
  title: 'Relationship',
  type: 'document',

  fields: [
    defineField({
      name: 'fromCitizen',
      title: 'From Citizen',
      type: 'reference',
      to: [{type: 'citizen'}],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'toCitizen',
      title: 'To Citizen',
      type: 'reference',
      to: [{type: 'citizen'}],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'relationshipType',
      title: 'Relationship Type',
      type: 'string',
      options: {
        list: [
          {title: 'Friend', value: 'friend'},
          {title: 'Family', value: 'family'},
          {title: 'Colleague', value: 'colleague'},
          {title: 'Rival', value: 'rival'},
          {title: 'Mentor', value: 'mentor'},
          {title: 'Authority', value: 'authority'},
          {title: 'Acquaintance', value: 'acquaintance'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'trust',
      title: 'Trust',
      type: 'number',
      description: 'Trust level from 0 to 100.',
      initialValue: 50,
      validation: (rule) => rule.min(0).max(100),
    }),

    defineField({
      name: 'affinity',
      title: 'Affinity',
      type: 'number',
      description: 'How positively this citizen feels about the other, from -100 to 100.',
      initialValue: 0,
      validation: (rule) => rule.min(-100).max(100),
    }),

    defineField({
      name: 'notes',
      title: 'Relationship Notes',
      type: 'text',
      rows: 3,
    }),
  ],

  preview: {
    select: {
      from: 'fromCitizen.name',
      to: 'toCitizen.name',
      type: 'relationshipType',
    },
    prepare({from, to, type}) {
      return {
        title: `${from || 'Unknown'} → ${to || 'Unknown'}`,
        subtitle: type || 'Relationship',
      }
    },
  },
})