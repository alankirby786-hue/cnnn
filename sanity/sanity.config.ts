import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import cnnReportStory from './schemaTypes/cnnReportStory'

export default defineConfig({
  name: 'cnn-report-content',
  title: 'CNN Report Content',
  projectId: '5758yrpf',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [cnnReportStory]
  }
})
