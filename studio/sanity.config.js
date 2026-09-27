import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
// Keep these in sync with ../sanity-config.js (used by the website)
const projectId = '83kbmspt'
const dataset = 'production'

export default defineConfig({
  name: 'default',
  title: 'Skyway Cleaning',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes},
})
