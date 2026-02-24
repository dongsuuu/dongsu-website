# dongsu Website

A production-ready website for the "dongsu" AI agent infrastructure on Base chain.

## Features

- 🚀 **Next.js 14** with App Router
- 📘 **TypeScript** for type safety
- 🎨 **Tailwind CSS** + custom dark theme
- 🧩 **shadcn/ui** components
- 🔧 **Server-side API routes** with caching
- 📊 **Fallback data** for reliability
- 🔍 **Search & filters** on agents page
- 📱 **Responsive design**

## Pages

- `/` - Home with hero, services, stats
- `/agents/` - Agents directory with search/filters
- `/agents/[slug]/` - Individual agent details
- `/evaluation/` - Evaluation results
- `/docs/` - Documentation
- `/contact/` - Contact information

## API Routes

- `/api/agents` - List all agents (with caching)
- `/api/agents/[slug]` - Single agent details
- `/api/evaluation` - Evaluation results

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `USE_EXTERNAL_DATA=false` - Use fallback data (default)
- `USE_EXTERNAL_DATA=true` - Fetch from external APIs

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Static Export

```bash
npm run export
```

Output will be in `dist/` folder.

## Project Structure

```
dongsu-website/
├── app/
│   ├── api/              # API route handlers
│   ├── agents/           # Agents pages
│   ├── contact/          # Contact page
│   ├── docs/             # Documentation page
│   ├── evaluation/       # Evaluation page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   ├── not-found.tsx     # 404 page
│   └── page.tsx          # Home page
├── components/
│   └── ui/               # UI components
├── lib/
│   ├── fallbackData.ts   # Fallback data
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── .env.example          # Environment template
├── next.config.js        # Next.js config
├── package.json          # Dependencies
├── tailwind.config.ts    # Tailwind config
└── tsconfig.json         # TypeScript config
```

## Data Sources

### Fallback Data (Default)
All agent and service data is stored in `lib/fallbackData.ts`.
Edit this file to update content quickly.

### External APIs (Optional)
Set `USE_EXTERNAL_DATA=true` to fetch from:
- Virtuals Protocol ACP
- Custom APIs

## Customization

### Adding a new agent

Edit `lib/fallbackData.ts`:

```typescript
export const fallbackAgents: Agent[] = [
  {
    id: 'agent-new',
    slug: 'new-agent',
    displayName: 'New Agent',
    description: 'Description here',
    // ... rest of config
  }
];
```

### Adding a new service

Add to an agent's services array:

```typescript
services: [
  {
    id: 'svc-new',
    name: 'New Service',
    description: 'Description',
    price: 0.01,
    currency: 'USDC',
    category: 'analysis',
    tags: ['tag1', 'tag2'],
    action: {
      type: 'link',
      url: 'https://...'
    }
  }
]
```

## License

MIT
