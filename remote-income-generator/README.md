# Remote AI Agent Income Generator

A web-based dashboard that scrapes remote AI/tech jobs from multiple platforms, matches them against your skills, and displays results with direct links and relevance scores.

## Features

- **Multi-Source Job Scraping**: RemoteOK, WeWorkRemotely, Upwork, Indeed
- **Smart Skill Matching**: 25 pre-defined AI/tech skill categories
- **PDF Resume Parsing**: Upload documents to auto-extract skills
- **Match Scoring**: Jobs scored 0-100% based on your profile
- **Real-time Filtering**: Sort by match, recency, or pay

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Database**: JSON file storage (no external DB required)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/remote-income-generator.git
cd remote-income-generator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Development

```bash
# Terminal 1 - Start backend (port 3001)
cd backend
npm run dev

# Terminal 2 - Start frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

## Project Structure

```
remote-income-generator/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server
│   │   ├── routes/           # API endpoints
│   │   ├── scrapers/         # Job site scrapers
│   │   ├── services/         # Business logic
│   │   └── types/            # TypeScript types
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── types/            # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/jobs/recent` | Get recent jobs |
| GET | `/api/jobs/top` | Get top matching jobs |
| GET | `/api/jobs/search` | Search with filters |
| POST | `/api/jobs/refresh` | Scrape new jobs |
| GET | `/api/profile` | Get user profile |
| POST | `/api/profile` | Update profile |
| POST | `/api/documents/upload` | Upload resume/PDF |

## Supported Skill Categories

1. AI Prompt Engineering & Optimization
2. AI Training Data Labeling & RLHF
3. AI-Powered Content Moderation
4. Custom GPT/Assistant Development
5. No-Code AI Automation Consulting
6. AI-Assisted Copywriting & SEO Content
7. Video Script Writing for YouTube/TikTok
8. Podcast Production & Editing
9. UGC (User-Generated Content) Creation
10. Social Media Community Management
11. Website & App User Testing
12. Beta Testing & QA for Software
13. Search Engine Evaluation
14. Market Research Participant
15. Competitive Intelligence Research
16. CRM Setup & Management
17. Webflow/Framer Website Development
18. Notion/Airtable Workspace Design
19. API Integration Specialist
20. Spreadsheet Automation & Dashboard Building
21. Fractional COO for Startups
22. Business Process Documentation
23. Executive Coaching
24. Pitch Deck & Investor Presentation Creation
25. Online Course Creation & Launch Consulting

## Environment Variables

Create `.env` files for production:

**Backend (.env)**
```
PORT=3001
NODE_ENV=production
```

**Frontend (.env)**
```
VITE_API_URL=https://your-backend-url.com
```

## Deployment

### Railway (Recommended)
1. Connect GitHub repo to Railway
2. Add backend service pointing to `/backend`
3. Add frontend service pointing to `/frontend`
4. Set environment variables
5. Deploy

### Manual Deployment
1. Build both projects
2. Deploy backend to any Node.js host
3. Deploy frontend to Vercel/Netlify/static host
4. Configure CORS and API URLs

## Best Practices

### Development Workflow
1. Create feature branches from `main`
2. Test locally before pushing
3. Use meaningful commit messages
4. Keep scrapers updated as sites change

### Security
- Never commit `.env` files
- Rate limit API endpoints in production
- Validate file uploads
- Sanitize user input

### Maintenance
- Update scrapers if job sites change HTML
- Clear old jobs periodically
- Monitor API rate limits

## License

MIT
