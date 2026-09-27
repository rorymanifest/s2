import {defineCliConfig} from 'sanity/cli'
// Keep these in sync with ../sanity-config.js (used by the website)
const projectId = '83kbmspt'
const dataset = 'production'

export default defineCliConfig({
  api: {projectId, dataset},
  // Studio is hosted at https://<studioHost>.sanity.studio after `npm run deploy`
  studioHost: 'skyway-cleaning',
})
