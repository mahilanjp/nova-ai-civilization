import {defineField, defineType} from 'sanity'

export const worldEventType = defineType({
  name: 'worldEvent',
  title: 'World Event',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          {title: 'Blackout', value: 'blackout'},
          {title: 'Storm', value: 'storm'},
          {title: 'Economic Event', value: 'economic'},
          {title: 'Public Emergency', value: 'emergency'},
          {title: 'New Law', value: 'law'},
          {title: 'Social Event', value: 'social'},
          {title: 'Unexpected Event', value: 'unexpected'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'severity',
      title: 'Severity',
      type: 'number',
      description: 'Impact level from 1 to 10.',
      validation: (rule) => rule.required().min(1).max(10),
    }),

    defineField({
      name: 'affectedLocations',
      title: 'Affected Locations',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'location'}],
        },
      ],
    }),

    defineField({
      name: 'status',
      title: 'Simulation Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Simulating', value: 'simulating'},
          {title: 'Awaiting Approval', value: 'awaitingApproval'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Resolved', value: 'resolved'},
        ],
      },
      initialValue: 'draft',
    }),

    defineField({
      name: 'occurredAt',
      title: 'Occurred At',
      type: 'datetime',
    }),

    defineField({
      name: 'worldImpact',
      title: 'World Impact',
      type: 'text',
      rows: 4,
      description: 'Summary of how this event changed the civilization.',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      eventType: 'eventType',
      severity: 'severity',
    },
    prepare({title, eventType, severity}) {
      return {
        title,
        subtitle: `${eventType || 'Event'} • Severity ${severity ?? '?'}/10`,
      }
    },
  },
})