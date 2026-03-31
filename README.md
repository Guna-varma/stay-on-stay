# StayOnStay

Hotel management application for medical travelers and hospitality operations.

## Project overview

StayOnStay helps guests find and book stays near healthcare facilities, with support for reception, housekeeping, transport, finance, and compliance workflows.

## Getting started

### Prerequisites

- Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Run locally

```sh
# Clone the repository
git clone https://github.com/Guna-varma/stay-on-stay.git
cd stay-on-stay

# Install dependencies
npm install

# Start the development server
npm run dev
```

If `npm run dev` fails with "Cannot find package '@vitejs/plugin-react-swc'", run `npm install` again and retry.

### Edit in your IDE

Clone the repo, make changes locally, then commit and push to GitHub.

### Edit on GitHub

1. Open the file you want to change.
2. Click the "Edit" button (pencil icon).
3. Save and commit your changes.

### GitHub Codespaces

1. Open the repository on GitHub.
2. Click "Code" → "Codespaces" → "New codespace".
3. Edit in the Codespace, then commit and push when done.

## Tech stack

- **Vite** — build tool
- **TypeScript** — type-safe JavaScript
- **React** — UI
- **shadcn/ui** — components
- **Tailwind CSS** — styling

Backend, auth, payments, and the full roadmap are documented in **[ARCHITECTURE.md](./ARCHITECTURE.md)** (Supabase, Twilio, Razorpay, premium upgrades).

## Deploy to Vercel

1. Push your code to GitHub and import the repo in [Vercel](https://vercel.com).
2. Vercel will detect the Vite app and use `npm run build` with output in `dist`.
3. Client-side routes are handled by the `vercel.json` rewrite (all requests serve `index.html`).
4. If needed, set **Build Command** to `npm run build` and **Output Directory** to `dist`.

## License

© 2026 StayOnStay. All rights reserved.
