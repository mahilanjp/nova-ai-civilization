import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'

if (!process.env.SANITY_API_WRITE_TOKEN) {
  throw new Error('SANITY_API_WRITE_TOKEN is missing')
}

export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})