import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'The web address of the post, e.g. how-often-to-clean-gutters',
      options: {source: 'title', maxLength: 96},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown on the blog list and in Google results',
      validation: (r) => r.max(200),
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: 'Alt text', type: 'string'}),
            defineField({name: 'caption', type: 'string'}),
          ],
        }),
      ],
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', date: 'publishedAt', media: 'mainImage'},
    prepare: ({title, date, media}) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString('en-AU') : 'No date',
      media,
    }),
  },
})
