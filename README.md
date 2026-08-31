# NextStop NYC

A web app that helps you plan NYC outings by suggesting nearby activities within your budget. Never wonder "where next?" again.

## Features

- **Step-by-Step Mode**: Pick your first stop, get smart suggestions for what's next based on distance and budget
- **Full Plan Mode**: Set your preferences (budget, # of stops, vibe) and generate a complete itinerary
- **Budget Tracking**: Real-time budget bar that filters suggestions as you spend
- **Walking + Transit**: Toggle between walking distance and subway/bus routes
- **Save & Share**: Sign in to save itineraries and share them via link

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS** + shadcn/ui
- **PostgreSQL** via Supabase
- **Prisma** ORM
- **NextAuth.js** (Google OAuth)
- **Google Places API** (New) + Google Maps Directions API
- **Zustand** for client state

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud project with Places API and Directions API enabled
- A Supabase project (for database + auth)

### Setup

1. Clone the repo and install dependencies:

```bash
cd nyc-itinerary
npm install
```

2. Copy `.env.local` and fill in your keys:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
DATABASE_URL=your_supabase_postgresql_url
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

3. Push the database schema:

```bash
npx prisma db push
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (places, directions, itineraries, auth)
│   ├── plan/              # Itinerary builder pages
│   ├── itineraries/       # Saved itineraries pages
│   └── auth/              # Auth pages
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   └── map/              # Google Maps components
├── lib/                   # Core logic
│   ├── google-places.ts  # Google Places API wrapper
│   ├── google-maps.ts    # Directions API wrapper
│   ├── budget-engine.ts  # Budget calculation logic
│   └── suggestion-engine.ts  # Place scoring/ranking
└── store/                 # Zustand state management
```

## API Keys

You need to enable these APIs in your Google Cloud Console:
- Places API (New)
- Maps JavaScript API
- Routes API (for directions)

For Supabase, create a project and copy the PostgreSQL connection string from Settings > Database.
