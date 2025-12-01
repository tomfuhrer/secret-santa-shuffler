# Secret Santa Shuffler

A simple web app for organizing Secret Santa gift exchanges. Create an exchange, add participants, shuffle assignments, and share unique links with each person.

## Features

- Create gift exchanges with a name and optional budget
- Add participants with names and emails
- Shuffle assignments using Sattolo's algorithm (guarantees no one gets themselves)
- Send unique links to each participant to reveal their assignment
- Magic link authentication for organizers

## Tech Stack

- [Qwik](https://qwik.dev/) with QwikCity
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting
- [Cloudflare D1](https://developers.cloudflare.com/d1/) for database

## Development

```shell
npm install
npm run dev
```

## Database Setup

Create the D1 database:

```shell
wrangler d1 create santa-db
```

Run migrations locally:

```shell
npm run db:generate
```

## Building

```shell
npm run build
```

## Local Preview

Preview the production build locally:

```shell
npm run serve
```

Then visit http://localhost:8787/

## Deployment

Deploy to Cloudflare Pages:

```shell
npm run deploy
```
