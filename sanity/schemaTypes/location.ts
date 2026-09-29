import {defineField, defineType} from 'sanity'

export const locationType = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Location Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'type',
      title: 'Location Type',
      type: 'string',
      options: {
        list: [
          {title: 'Government', value: 'government'},
          {title: 'Healthcare', value: 'healthcare'},
          {title: 'Infrastructure', value: 'infrastructure'},
          {title: 'Education', value: 'education'},
          {title: 'Commercial', value: 'commercial'},
          {title: 'Residential', value: 'residential'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'condition',
      title: 'Condition',
      type: 'string',
      options: {
        list: [
          {title: 'Operational', value: 'operational'},
          {title: 'Damaged', value: 'damaged'},
          {title: 'Offline', value: 'offline'},
          {title: 'Emergency', value: 'emergency'},
        ],
      },
      initialValue: 'operational',
    }),

    defineField({
      name: 'powerAvailable',
      title: 'Power Available',
      type: 'boolean',
      initialValue: true,
    }),

    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'importance',
      title: 'Importance',
      type: 'number',
      description: 'Strategic importance from 1 to 10.',
      validation: (rule) => rule.min(1).max(10),
      initialValue: 5,
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
    },
  },
})