import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import cnnReportStory from './schemaTypes/cnnReportStory'
import globalArticleInformation from './schemaTypes/globalArticleInformation'

export default defineConfig({
  name: 'cnn-report-content',
  title: 'CNN Report Content',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '5758yrpf',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Global Article Information')
              .id('globalArticleInformation')
              .child(
                S.document()
                  .schemaType('globalArticleInformation')
                  .documentId('globalArticleInformation')
              ),
            S.divider(),
            S.documentTypeListItem('cnnReportStory').title('CNN Report Story')
          ])
    })
  ],
  schema: {
    types: [globalArticleInformation, cnnReportStory]
  }
})
