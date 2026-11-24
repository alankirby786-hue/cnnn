import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'globalArticleInformation',
  title: 'Global Article Information',
  type: 'document',
  description:
    'The single source of truth for the six shared article values. Edit here and publish; every connected page updates.',
  fields: [
    defineField({
      name: 'advisorName',
      title: 'Advisor Name',
      type: 'string',
      description: 'Shown everywhere the advisor is named, e.g. Beau Wilson.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Shown everywhere the location is named, e.g. Louisiana.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published Date',
      type: 'string',
      description: 'Shown exactly as typed, e.g. August 16, 2026.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'updatedTime',
      title: 'Updated Time',
      type: 'string',
      description: 'Shown exactly as typed, e.g. 4:18 PM ET.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'totalLosses',
      title: 'Losses',
      type: 'string',
      description: 'Short loss figure used in copy and stat cards, e.g. $1.3B+.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'firmName',
      title: 'Firm Name',
      type: 'string',
      description: 'Shown everywhere the firm is named, e.g. Edward Jones.',
      validation: (Rule) => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'firmName',
      subtitle: 'advisorName'
    }
  },
  initialValue: {
    advisorName: 'Beau Wilson',
    location: 'Louisiana',
    publishedDate: 'August 16, 2026',
    updatedTime: '4:18 PM ET',
    totalLosses: '$1.3B+',
    firmName: 'Edward Jones'
  }
})
