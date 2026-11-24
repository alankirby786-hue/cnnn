import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Set SANITY_API_TOKEN in your shell before running this script. Do not paste the token into files.')
  process.exit(1)
}

const projectId = process.env.SANITY_PROJECT_ID || '5758yrpf'
const dataset = process.env.SANITY_DATASET || 'production'
const here = dirname(fileURLToPath(import.meta.url))
const documents = [
  JSON.parse(readFileSync(join(here, 'seed', 'globalArticleInformation.json'), 'utf8')),
  JSON.parse(readFileSync(join(here, 'seed', 'cnnReportStory.json'), 'utf8'))
]

const response = await fetch(
  `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      mutations: documents.map((document) => ({ createOrReplace: document }))
    })
  }
)

if (!response.ok) {
  const body = await response.text()
  console.error(`Sanity mutation failed with ${response.status}: ${body}`)
  process.exit(1)
}

const result = await response.json()
console.log(`Seeded ${documents.map((document) => document._id).join(', ')} into ${projectId}/${dataset}.`)
console.log(`Document IDs: ${(result.documents || []).join(', ') || documents.map((document) => document._id).join(', ')}`)
