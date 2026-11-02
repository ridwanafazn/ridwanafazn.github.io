import { defineField, defineType } from 'sanity'

export const skillsSchema = defineType({
  name: 'skills',
  title: 'Tech Skills',
  type: 'document',
  fields: [
    defineField({
      name: 'categories',
      title: 'Kategori Skill',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'category', title: 'Nama Kategori', type: 'string' }),
          defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'string' }] }),
        ],
        preview: { select: { title: 'category' } },
      }],
    }),
  ],
})

export const activitySchema = defineType({
  name: 'activity',
  title: 'Activity',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'type',
      title: 'Tipe',
      type: 'string',
      options: {
        list: ['Volunteer', 'Publication', 'Leadership'],
        layout: 'radio',
      },
    }),
    defineField({ name: 'title', title: 'Judul', type: 'string' }),
    defineField({ name: 'organization', title: 'Organisasi', type: 'string' }),
    defineField({ name: 'description', title: 'Deskripsi', type: 'text', rows: 3 }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'organization' },
  },
})
