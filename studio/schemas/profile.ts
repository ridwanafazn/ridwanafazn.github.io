import { defineField, defineType } from 'sanity'

export const profileSchema = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nama Lengkap', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'nickname', title: 'Nickname', type: 'string' }),
    defineField({ name: 'role', title: 'Role / Jabatan', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 4 }),
    defineField({
      name: 'stats',
      title: 'Statistik (StatBar)',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Label', type: 'string' }),
          defineField({ name: 'value', title: 'Nilai (Value)', type: 'string' }),
        ],
        preview: { select: { title: 'label', subtitle: 'value' } },
      }],
    }),
    defineField({
      name: 'currentFocus',
      title: 'Fokus Sekarang',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Judul Fokus', type: 'string' }),
        defineField({ name: 'description', title: 'Deskripsi', type: 'text', rows: 3 }),
      ],
    }),
    defineField({
      name: 'experience',
      title: 'Pengalaman',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'role', title: 'Role / Jabatan', type: 'string' }),
          defineField({ name: 'organization', title: 'Organisasi / Perusahaan', type: 'string' }),
          defineField({ name: 'period', title: 'Periode', type: 'string', description: 'Contoh: Jan 2024 – Sekarang' }),
          defineField({ name: 'description', title: 'Deskripsi', type: 'text', rows: 2 }),
        ],
        preview: { select: { title: 'role', subtitle: 'organization' } },
      }],
    }),
    defineField({
      name: 'education',
      title: 'Pendidikan',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'institution', title: 'Institusi', type: 'string' }),
          defineField({ name: 'degree', title: 'Gelar / Program', type: 'string' }),
          defineField({ name: 'gpa', title: 'IPK', type: 'string' }),
          defineField({ name: 'highlights', title: 'Highlights', type: 'array', of: [{ type: 'string' }] }),
        ],
      }],
    }),
    defineField({
      name: 'certifications',
      title: 'Sertifikasi',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name', title: 'Nama Sertifikasi', type: 'string' }),
          defineField({ name: 'issuer', title: 'Penerbit', type: 'string' }),
        ],
      }],
    }),
    defineField({
      name: 'howIBuild',
      title: 'Cara Kerja (How I Build)',
      type: 'object',
      fields: [
        defineField({ name: 'summary', title: 'Ringkasan', type: 'text', rows: 2 }),
        defineField({
          name: 'steps',
          title: 'Langkah-langkah',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'step', title: 'Judul Langkah', type: 'string' }),
              defineField({ name: 'detail', title: 'Detail', type: 'text', rows: 2 }),
            ],
          }],
        }),
        defineField({ name: 'why', title: 'Penutup / Why', type: 'text', rows: 2 }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role' },
  },
})
