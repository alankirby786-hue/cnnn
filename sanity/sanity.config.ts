import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import cnnReportStory from './schemaTypes/cnnReportStory'

export default defineConfig({
  name: 'cnn-report-content',
  title: 'CNN Report Content',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '5758yrpf',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool()],
  schema: {
    types: [cnnReportStory]
  }
})
