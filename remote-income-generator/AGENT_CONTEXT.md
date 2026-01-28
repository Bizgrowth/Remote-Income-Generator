# Agent Context: Remote AI Agent Income Generator

## Quick Reference
- **GitHub**: https://github.com/Bizgrowth/Remote-Income-Generator
- **Live Site**: https://remote-income-generator.onrender.com
- **Local Path**: `d:\CODING PROJECTS\Anititest folder\remote-income-generator\`

## Project Structure
```
remote-income-generator/
├── backend/   # Express + TypeScript API (port 3001)
│   ├── prisma/           # Database schema & migrations
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   └── lib/          # Prisma client
├── frontend/  # React + Vite + Tailwind CSS (port 5173)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Auth & Theme contexts
│   │   └── hooks/        # Custom hooks
```

---

## What's Built

### Core Features
| Feature | Status | Description |
|---------|--------|-------------|
| 30 Skill Categories | ✅ Complete | Across 6 groups (AI, Content, Testing, Tech, Advisory, Management) |
| Curated Platform Links | ✅ Complete | Search URLs for 8 job platforms |
| Dark Mode | ✅ Complete | Toggle in header, localStorage persistence |
| PDF Resume Parsing | ✅ Complete | Extract skills from uploaded documents |
| Skill Matching | ✅ Complete | Score jobs based on selected skills |
| **User Authentication** | ✅ NEW | JWT-based auth with register/login |
| **Job Favorites** | ✅ NEW | Star jobs, save with full details |
| **AI Resume Optimizer** | ✅ NEW | 20-year recruiter persona, ATS optimization |
| **Cover Letter Generator** | ✅ NEW | AI-generated, 3 tone options |
| **Application Tracking** | ✅ NEW | Status: favorited → optimized → applied → interviewing |
| **PDF/DOCX Export** | ✅ NEW | Download optimized resumes |
| **One-Click Copy** | ✅ NEW | Copy resume sections to clipboard |

### New Feature: AI Resume Optimization System

**How it works:**
1. User signs in and uploads their master resume
2. User browses jobs and clicks ⭐ to favorite
3. In Favorites tab, clicks "Optimize" on a job
4. AI analyzes job description, extracts keywords
5. AI rewrites resume summary, experience bullets, skills
6. ATS score calculated (keyword match percentage)
7. User can copy sections or download PDF/DOCX
8. Optional: Generate tailored cover letter

**AI Recruiter Persona:**
- 20+ years experience in talent acquisition
- Deep ATS knowledge
- Focuses on exact keyword matching
- Quantifies achievements with metrics
- Never fabricates experience

---

## Key Files (Updated)

### Backend
| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Database models (User, Resume, FavoriteJob, OptimizedResume, etc.) |
| `backend/src/routes/auth.ts` | Register, login, profile endpoints |
| `backend/src/routes/favorites.ts` | Favorite jobs CRUD |
| `backend/src/routes/resume.ts` | Resume upload & management |
| `backend/src/routes/optimize.ts` | AI optimization & export endpoints |
| `backend/src/services/aiResumeOptimizer.ts` | Claude API integration, recruiter prompts |
| `backend/src/services/auth.ts` | JWT generation & verification |
| `backend/src/middleware/auth.ts` | Route protection middleware |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/context/AuthContext.tsx` | Auth state management |
| `frontend/src/context/ThemeContext.tsx` | Dark mode state |
| `frontend/src/hooks/useFavorites.ts` | Favorites, optimization, resumes API hooks |
| `frontend/src/components/Dashboard.tsx` | Main UI with tabs |
| `frontend/src/components/FavoritesDashboard.tsx` | Favorites list, optimization modal |
| `frontend/src/components/JobCard.tsx` | Job card with ⭐ button |
| `frontend/src/components/AuthModal.tsx` | Login/register modal |

---

## Database Schema (Prisma + SQLite)

```
User
├── Profile (skills, preferences)
├── Resume[] (master resumes)
├── FavoriteJob[] (saved jobs)
├── OptimizedResume[] (AI-generated)
├── CoverLetter[]
└── Application[] (tracking)

FavoriteJob
├── title, company, description, url
├── matchScore, matchReasons
├── notes, priority
└── applications[], optimizedResumes[], coverLetters[]

OptimizedResume
├── optimizedSummary
├── optimizedExperience (JSON)
├── optimizedSkills (JSON)
├── atsScore
├── keywordsMatched, keywordsMissing
└── suggestions
```

---

## API Endpoints (New)

### Authentication
```
POST /api/auth/register    - Create account
POST /api/auth/login       - Login, get JWT
GET  /api/auth/me          - Get current user
PUT  /api/auth/profile     - Update profile
```

### Favorites
```
GET    /api/favorites           - List all favorites
POST   /api/favorites           - Add job to favorites
GET    /api/favorites/:id       - Get single favorite
PATCH  /api/favorites/:id       - Update notes/priority
DELETE /api/favorites/:id       - Remove favorite
PATCH  /api/favorites/:id/status - Update application status
```

### Resumes
```
GET  /api/resumes              - List user's resumes
POST /api/resumes/upload       - Upload & parse resume
GET  /api/resumes/:id          - Get resume details
GET  /api/resumes/:id/download - Download original file
```

### AI Optimization
```
POST /api/optimize/resume       - Optimize resume for job
POST /api/optimize/cover-letter - Generate cover letter
POST /api/optimize/ats-check    - ATS compatibility analysis
GET  /api/optimize/:jobId       - Get existing optimization
GET  /api/optimize/:jobId/export/pdf  - Download PDF
GET  /api/optimize/:jobId/export/docx - Download DOCX
GET  /api/optimize/:jobId/export/txt  - Download plain text
```

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
ANTHROPIC_API_KEY="your-anthropic-api-key"
PORT=3001
```

### Frontend
```
VITE_API_URL=http://localhost:3001/api
```

---

## Local Development

```bash
# Backend
cd "d:\CODING PROJECTS\Anititest folder\remote-income-generator\backend"
npm install
npx prisma migrate dev   # Run migrations
npm run dev

# Frontend (separate terminal)
cd "d:\CODING PROJECTS\Anititest folder\remote-income-generator\frontend"
npm install
npm run dev
```

---

## Potential Next Steps

1. **Real-time Job API** - Integrate Adzuna/Remotive for live listings
2. **Email Notifications** - Job match alerts, application reminders
3. **Resume Templates** - Multiple format options for export
4. **Interview Prep** - AI-generated interview questions based on job
5. **Salary Negotiation Tips** - AI advice based on market data
6. **Browser Extension** - Auto-fill applications, detect job pages

---

## Architecture Notes

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + Prisma
- **Database**: SQLite (can migrate to PostgreSQL)
- **AI**: Claude API (claude-sonnet-4-20250514)
- **Auth**: JWT tokens stored in localStorage
- **Export**: PDFKit for PDF, docx for DOCX

---

*Last updated: January 2026*
