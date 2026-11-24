import { defineField, defineType } from 'sanity'

const statFields = [
  defineField({ name: 'k', title: 'Label', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'v', title: 'Value', type: 'string', validation: (Rule) => Rule.required() })
]

const relatedStoryFields = [
  defineField({ name: 'tag', title: 'Tag', type: 'string' }),
  defineField({ name: 'time', title: 'Read time', type: 'string' }),
  defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'href', title: 'Link', type: 'string' })
]

export default defineType({
  name: 'cnnReportStory',
  title: 'CNN Report Story',
  type: 'document',
  groups: [
    { name: 'editorial', title: 'Editorial', default: true },
    { name: 'display', title: 'Display copy' },
    { name: 'recurring', title: 'Recurring blocks' }
  ],
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      group: 'editorial',
      description:
        'Use {{firmName}}, {{location}}, {{advisorName}} and other tokens. Values come from Global Article Information.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'dek',
      title: 'Dek / summary',
      type: 'text',
      rows: 3,
      group: 'editorial',
      description:
        'Use shared-value tokens instead of typing names, dates, times or loss figures.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'byline',
      title: 'Byline',
      type: 'string',
      group: 'editorial',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker',
      type: 'string',
      group: 'display'
    }),
    defineField({
      name: 'readTime',
      title: 'Read time',
      type: 'string',
      group: 'display'
    }),
    defineField({
      name: 'editorNote',
      title: 'Verification note',
      type: 'text',
      rows: 3,
      group: 'display'
    }),
    defineField({
      name: 'heroCaption',
      title: 'Hero caption',
      type: 'text',
      rows: 2,
      group: 'display'
    }),
    defineField({
      name: 'bottomLineHeading',
      title: 'Bottom line heading',
      type: 'string',
      group: 'display'
    }),
    defineField({
      name: 'bottomLineBody',
      title: 'Bottom line body',
      type: 'text',
      rows: 4,
      group: 'display'
    }),
    defineField({
      name: 'protectBlurb',
      title: 'Protection blurb',
      type: 'text',
      rows: 4,
      group: 'display'
    }),
    defineField({
      name: 'guidanceBlurb',
      title: 'Immediate guidance blurb',
      type: 'text',
      rows: 3,
      group: 'display'
    }),
    defineField({
      name: 'newsletterBlurb',
      title: 'Newsletter blurb',
      type: 'text',
      rows: 2,
      group: 'display'
    }),
    defineField({
      name: 'stats',
      title: 'Stat cards',
      type: 'array',
      group: 'recurring',
      of: [{ type: 'object', name: 'stat', fields: statFields }]
    }),
    defineField({
      name: 'tickerItems',
      title: 'Ticker items',
      type: 'array',
      group: 'recurring',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'relatedStories',
      title: 'Related stories',
      type: 'array',
      group: 'recurring',
      of: [{ type: 'object', name: 'relatedStory', fields: relatedStoryFields }]
    }),
    defineField({
      name: 'scopeItems',
      title: 'Scope tags',
      type: 'array',
      group: 'recurring',
      of: [{ type: 'string' }]
    })
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'byline'
    }
  }
})
