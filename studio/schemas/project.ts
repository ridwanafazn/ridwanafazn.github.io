import { defineField, defineType } from 'sanity'

export const projectSchema = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'URL-friendly ID. Contoh: smile-fest, jymz, vessel',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Nama Proyek',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Posisi',
      type: 'string',
      description: 'Contoh: Fullstack Developer, Backend Engineer',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Deskripsi Singkat',
      type: 'text',
      rows: 3,
      description: 'Tampil di card proyek dan ringkasan halaman detail.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'longDescription',
      title: 'Deskripsi Panjang (khusus halaman detail)',
      type: 'text',
      rows: 6,
      description: 'Opsional. Kalau diisi, halaman detail pakai ini, bukan deskripsi singkat.',
    }),
    defineField({
      name: 'techStack',
      title: 'Tech Stack',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Poin-poin pencapaian konkret. Contoh: 151 Tiket Terjual, Rp4.8Jt Revenue',
    }),
    defineField({
      name: 'isTopProject',
      title: 'Featured Project?',
      type: 'boolean',
      description: 'Tampil di halaman utama kalau diaktifkan.',
      initialValue: false,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: ['Live', 'WIP', 'Archived'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'order',
      title: 'Urutan Tampil',
      type: 'number',
      description: 'Angka kecil tampil lebih dulu. Isi ini untuk atur urutan di halaman Projects.',
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
            defineField({
              name: 'icon',
              title: 'Icon (Material Symbol name)',
              type: 'string',
              description: 'Contoh: open_in_new, code, terminal, link',
            }),
          ],
        },
      ],
    }),
  ],
  orderings: [
    {
      title: 'Urutan Manual',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'role' },
  },
})
