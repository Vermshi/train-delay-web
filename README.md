This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

It is "vibe-coded" used Claud and is only intended as a hobby project for educational purposes.

## Environment Setup

Create a `.env.local` file in the project root with the following variable:

```
GOOGLE_SERVICE_ACCOUNT_JSON=./service-account-key.json
```

Place your GCP service account key JSON file at `service-account-key.json` in the project root (downloaded from the GCP Console). The app reads the key from that file path at runtime.

The service account needs:

- `BigQuery Job User` on the billing project
- `BigQuery Data Viewer` on Entur's project (`ent-data-sharing-ext-prd`)

## Getting Started

Install dependencies

```bash
npm i
```

Run the development server:

```bash
npm run dev
```

The dev server opens at [http://localhost:3000](http://localhost:3000).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
