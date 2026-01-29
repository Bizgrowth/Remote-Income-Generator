# Remote Income Generator - Project Context

## Overview
Full-stack web app helping remote job seekers find AI/tech jobs. Scrapes jobs from multiple platforms, matches them to user skills, and uses Claude AI to optimize resumes and generate cover letters.

**Live**: https://remote-income-generator.onrender.com

## Tech Stack
- **Backend**: Express.js + TypeScript, Prisma 7 + PostgreSQL, JWT auth, Claude API
- **Frontend**: React 18 + Vite 5, Tailwind CSS, Context API
- **AI**: Anthropic Claude (claude-sonnet-4-20250514)

## Project Structure
```
remote-income-generator/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express server entry
│   │   ├── routes/            # API endpoints (auth, jobs, favorites, resume, optimize)
│   │   ├── middleware/auth.ts # JWT verification
│   │   ├── services/          # Business logic (auth, aiResumeOptimizer, pdfParser, matcher)
│   │   ├── scrapers/          # Job scrapers (remoteok, weworkremotely, upwork, indeed)
│   │   ├── lib/prisma.ts      # Prisma client
│   │   └── types/index.ts     # TypeScript interfaces
│   └── prisma/schema.prisma   # Database schema
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main app with providers
│   │   ├── components/        # Dashboard, JobList, JobCard, FavoritesDashboard, etc.
│   │   ├── context/           # AuthContext, ThemeContext
│   │   └── hooks/             # useJobs, useFavorites
│   └── vite.config.ts         # Vite config with API proxy
└── docs: README.md, AGENT_CONTEXT.md, DEPLOYMENT.md
```

## Database Models (Prisma)
- **User**: id, email, passwordHash, name
- **Profile**: userId, skills (JSON), experienceLevel, minHourlyRate, preferRemote
- **Resume**: userId, name, originalText, contactInfo, summary, experience, skills
- **FavoriteJob**: userId, externalId, title, company, url, matchScore, notes, priority
- **OptimizedResume**: resumeId, favoriteJobId, optimizedSummary, atsScore, keywordsMatched
- **CoverLetter**: userId, favoriteJobId, content, tone
- **Application**: userId, favoriteJobId, status (favorited→optimized→applied→interviewing→offered)

## Key API Endpoints
```
POST /api/auth/register, /login    # Auth
GET  /api/auth/me                  # Current user
GET  /api/jobs/recent, /top        # Job listings
POST /api/jobs/refresh             # Scrape new jobs
GET  /api/favorites                # User's saved jobs
POST /api/favorites                # Save a job
POST /api/optimize/resume          # AI resume optimization
POST /api/optimize/cover-letter    # AI cover letter generation
GET  /api/optimize/:jobId/export/pdf  # Download optimized resume
```

## Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="min-32-char-secret"
ANTHROPIC_API_KEY="sk-ant-..."
PORT=3001
NODE_ENV="development"

# Frontend (.env)
VITE_API_URL="http://localhost:3001/api"
```

## Development Commands
```bash
# Backend (port 3001)
cd backend && npm install && npx prisma migrate dev && npm run dev

# Frontend (port 5173)
cd frontend && npm install && npm run dev
```

## Current Status
- All core features complete: job scraping, skill matching, favorites, AI optimization
- Using PostgreSQL with Prisma 7 adapter
- Recent fixes: database connection, CORS configuration, error handling

## Architecture Notes
- JWT auth (stateless, bcrypt hashing)
- 30 skill categories across 6 groups for matching
- Claude Sonnet for fast AI responses
- Monorepo structure (separate frontend/backend folders)
- Dark mode with localStorage persistence
