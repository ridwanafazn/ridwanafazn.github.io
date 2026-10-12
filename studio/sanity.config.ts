import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { projectSchema } from './schemas/project'
import { profileSchema } from './schemas/profile'
import { skillsSchema, activitySchema } from './schemas/misc'

export default defineConfig({
  name: 'ridwanafazn-porto',
  title: 'ridwanafazn | Portfolio CMS',

  projectId: 'exvebwem',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Konten Porto')
          .items([
            S.listItem()
              .title('Profile')
              .child(S.document().schemaType('profile').documentId('singleton-profile')),
            S.listItem()
              .title('Tech Skills')
              .child(S.document().schemaType('skills').documentId('singleton-skills')),
            S.divider(),
            S.documentTypeListItem('project').title('Projects'),
            S.documentTypeListItem('activity').title('Activities'),
          ]),
    }),
  ],

  schema: {
    types: [projectSchema, profileSchema, skillsSchema, activitySchema],
  },
})
