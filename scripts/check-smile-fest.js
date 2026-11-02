import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'exvebwem',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const p = await c.fetch(
  `*[_type == "project" && id.current == "smile-fest"][0]{ _id, title, links }`
);
console.log(JSON.stringify(p, null, 2));