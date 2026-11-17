# Plainly AI Newsletter

An independent daily AI newsletter with separate **AI in the U.S.** and **AI Around the World** sections.

## What it does

- Curates AI news from trusted newsletter emails and reputable web reporting
- Keeps every source attributed and linked
- Stores daily editions in Cloudflare D1
- Refreshes the published briefing through a private Site tool
- Runs as a Vinext/React app on OpenAI Sites

## Local development

```bash
pnpm install
pnpm dev
```

The newsletter source is independent. Publications such as The Rundown AI are attributed news sources, not the publisher or brand.

## Deployment

The live Site is managed through OpenAI Sites. The tracked `.openai/hosting.json` file contains its deployment configuration.
