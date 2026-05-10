# Technical Architecture

This document describes the **technical architecture** of the portfolio application, covering system design, implementation details, deployment infrastructure, and codebase organization.

---

## Overview

The portfolio is a **static site generator (SSG)** application built with modern web technologies, featuring automated data updates via AI and continuous deployment via GitHub Actions.

### Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI components and state management |
| **Meta-Framework** | TanStack Start | SSG, routing, file-based routing |
| **Styling** | Tailwind CSS 4 | Utility-first styling |
| **Build** | Vite | Fast bundling and dev server |
| **UI Components** | Radix UI | Accessible component primitives |
| **Animations** | Framer Motion | Smooth, declarative animations |
| **Icons** | Lucide React | Modern icon library |
| **AI** | Google Gemini 1.5 Flash | Project summary generation |
| **Data Source** | GitHub REST API | Project metadata |
| **Hosting** | GitHub Pages | Static site hosting |
| **CI/CD** | GitHub Actions | Automated deployment |

---

## System Architecture

```mermaid
flowchart TB
    subgraph "External Services"
        GH[GitHub API]
        GEMINI[Gemini AI API]
        DNS[GitHub Pages CDN]
    end
    
    subgraph "Development Environment"
        DEV[Developer Machine]
        CODE[Source Code]
        SCRIPT[update-projects.cjs]
        VITE_DEV[Vite Dev Server]
    end
    
    subgraph "Build Pipeline"
        GA[GitHub Actions]
        NODE[Node.js 22]
        NPM[npm install]
        VITE_BUILD[Vite Build]
        DIST[dist/ folder]
    end
    
    subgraph "Static Assets"
        HTML[index.html]
        JS[JavaScript Chunks]
        CSS[Tailwind CSS]
        API_DATA[API JSON Files]
        IMAGES[Images & Fonts]
    end
    
    subgraph "Client Browser"
        BROWSER[User Browser]
        REACT[React App]
        ROUTER[TanStack Router]
        COMPONENTS[UI Components]
    end
    
    %% Development Flow
    DEV -->|Edit| CODE
    DEV -->|Run| SCRIPT
    SCRIPT -->|Fetch| GH
    SCRIPT -->|Analyze| GEMINI
    SCRIPT -->|Update| API_DATA
    DEV -->|npm run dev| VITE_DEV
    VITE_DEV -->|Hot Reload| BROWSER
    
    %% Build Flow
    CODE -->|Push| GA
    GA -->|Setup| NODE
    NODE -->|Install| NPM
    NPM -->|Build| VITE_BUILD
    VITE_BUILD -->|Generate| DIST
    DIST -->|Contains| HTML
    DIST -->|Contains| JS
    DIST -->|Contains| CSS
    DIST -->|Contains| API_DATA
    DIST -->|Contains| IMAGES
    
    %% Deployment Flow
    DIST -->|Deploy| DNS
    
    %% Runtime Flow
    BROWSER -->|Request| DNS
    DNS -->|Serve| HTML
    HTML -->|Load| JS
    JS -->|Initialize| REACT
    REACT -->|Mount| ROUTER
    ROUTER -->|Render| COMPONENTS
    COMPONENTS -->|Fetch| API_DATA
    COMPONENTS -->|Display| BROWSER
    
    %% Styling
    classDef external fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef dev fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef build fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef assets fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef client fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class GH,GEMINI,DNS external
    class DEV,CODE,SCRIPT,VITE_DEV dev
    class GA,NODE,NPM,VITE_BUILD,DIST build
    class HTML,JS,CSS,API_DATA,IMAGES assets
    class BROWSER,REACT,ROUTER,COMPONENTS client
```

---

## Component Architecture

### Frontend Component Tree

```mermaid
flowchart TD
    ROOT[__root.tsx<br/>Root Layout]
    INDEX[index.tsx<br/>Homepage]
    
    ROOT --> INDEX
    
    INDEX --> HERO[Hero Section]
    INDEX --> ABOUT[About Section]
    INDEX --> EXP[Experience Section]
    INDEX --> PROJECTS[Projects Section]
    INDEX --> CERTS[Certificates Section]
    INDEX --> HOBBIES[Hobbies Section]
    INDEX --> CONTACT[Contact Section]
    
    PROJECTS --> GH_PROJ[GitHubProjects.tsx]
    GH_PROJ --> PROJ_CARD[Project Cards]
    
    ABOUT --> SKILLS[Skills.tsx]
    SKILLS --> SKILL_GRID[Skill Categories]
    
    %% UI Components
    PROJ_CARD --> CARD[ui/card.tsx]
    PROJ_CARD --> BADGE[ui/badge.tsx]
    PROJ_CARD --> BUTTON[ui/button.tsx]
    
    SKILL_GRID --> ACCORDION[ui/accordion.tsx]
    SKILL_GRID --> BADGE
    
    HERO --> AVATAR[ui/avatar.tsx]
    
    %% Styling
    classDef layout fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef section fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef feature fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef ui fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    
    class ROOT,INDEX layout
    class HERO,ABOUT,EXP,PROJECTS,CERTS,HOBBIES,CONTACT section
    class GH_PROJ,SKILLS,PROJ_CARD,SKILL_GRID feature
    class CARD,BADGE,BUTTON,ACCORDION,AVATAR ui
```

---

## Data Architecture

### Data Sources and Flow

```mermaid
flowchart LR
    subgraph "Source"
        GH_REPO[GitHub Repository:<br/>AI-PROJECTS]
    end
    
    subgraph "Processing Layer"
        UPDATE_SCRIPT[update-projects.cjs]
        GEMINI_API[Gemini AI API]
        CATEGORIZER[Skill Categorizer]
    end
    
    subgraph "Storage Layer"
        PROJ_JSON[public/api/<br/>project_rankings.json]
        SKILLS_JSON[public/api/<br/>skills.json]
    end
    
    subgraph "Build Layer"
        VITE[Vite Builder]
        DIST_PROJ[dist/api/<br/>project_rankings.json]
        DIST_SKILLS[dist/api/<br/>skills.json]
    end
    
    subgraph "Client Layer"
        FETCH[fetch API]
        STATE[React State]
        UI[UI Components]
    end
    
    GH_REPO -->|Fetch Commits| UPDATE_SCRIPT
    UPDATE_SCRIPT -->|Send README| GEMINI_API
    GEMINI_API -->|Return Analysis| UPDATE_SCRIPT
    UPDATE_SCRIPT -->|Extract Tech Stack| CATEGORIZER
    UPDATE_SCRIPT -->|Write| PROJ_JSON
    CATEGORIZER -->|Write| SKILLS_JSON
    
    PROJ_JSON -->|Copy| VITE
    SKILLS_JSON -->|Copy| VITE
    VITE -->|Bundle| DIST_PROJ
    VITE -->|Bundle| DIST_SKILLS
    
    DIST_PROJ -->|HTTP Request| FETCH
    DIST_SKILLS -->|HTTP Request| FETCH
    FETCH -->|Update| STATE
    STATE -->|Render| UI
    
    classDef source fill:#e1f5ff,stroke:#01579b
    classDef process fill:#fff3e0,stroke:#e65100
    classDef storage fill:#f3e5f5,stroke:#6a1b9a
    classDef build fill:#e8f5e9,stroke:#2e7d32
    classDef client fill:#fce4ec,stroke:#c2185b
    
    class GH_REPO source
    class UPDATE_SCRIPT,GEMINI_API,CATEGORIZER process
    class PROJ_JSON,SKILLS_JSON storage
    class VITE,DIST_PROJ,DIST_SKILLS build
    class FETCH,STATE,UI client
```

### Data Schema

#### project_rankings.json

```json
{
  "projects": [
    {
      "name": "string",
      "description": "string",
      "commits": "number",
      "commits_list": [
        {
          "sha": "string",
          "date": "ISO 8601 date",
          "message": "string"
        }
      ],
      "tech_stack": ["string"],
      "highlights": ["string"],
      "readme_url": "string",
      "repo_url": "string",
      "last_commit_date": "ISO 8601 date",
      "last_updated": "ISO 8601 date"
    }
  ]
}
```

#### skills.json

```json
{
  "Languages": ["Python", "JavaScript"],
  "AI/ML": ["TensorFlow", "PyTorch"],
  "Web Frameworks": ["React", "FastAPI"],
  "Databases": ["MongoDB", "PostgreSQL"],
  "Cloud & DevOps": ["AWS", "Docker"],
  "Data Tools": ["Pandas", "NumPy"],
  "Other": ["Git", "Linux"]
}
```

---

## Build System

### Vite Configuration

**File:** `vite.config.ts`

```mermaid
flowchart LR
    A[Source Files] --> B[Vite]
    B --> C[Transpile TSX]
    B --> D[Bundle JS]
    B --> E[Process CSS]
    B --> F[Optimize Images]
    B --> G[Code Split]
    
    C --> H[dist/]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[index.html]
    H --> J[assets/*.js]
    H --> K[assets/*.css]
    H --> L[assets/*.jpg/png]
    
    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef process fill:#fff3e0,stroke:#e65100
    classDef output fill:#e8f5e9,stroke:#2e7d32
    
    class A input
    class B,C,D,E,F,G process
    class H,I,J,K,L output
```

**Key Features:**
- **React Plugin:** JSX/TSX transformation
- **TanStack Router Plugin:** File-based routing
- **Code Splitting:** Automatic chunk optimization
- **Tree Shaking:** Remove unused code
- **Minification:** Compress JS/CSS
- **Asset Hashing:** Cache busting

### Build Process

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Vite as Vite
    participant FS as File System
    participant Router as TanStack Router
    participant Tailwind as Tailwind CSS
    
    Dev->>Vite: npm run build
    
    Vite->>Router: Generate route tree
    Router-->>Vite: routeTree.gen.ts
    
    Vite->>Tailwind: Process styles
    Tailwind-->>Vite: Compiled CSS
    
    Vite->>FS: Read src/ files
    FS-->>Vite: TypeScript/TSX content
    
    Vite->>Vite: Transpile TSX → JS
    Vite->>Vite: Bundle modules
    Vite->>Vite: Optimize assets
    Vite->>Vite: Code split
    Vite->>Vite: Minify
    
    Vite->>FS: Write dist/index.html
    Vite->>FS: Write dist/assets/*.js
    Vite->>FS: Write dist/assets/*.css
    Vite->>FS: Write dist/assets/*.jpg
    
    Vite-->>Dev: ✅ Build complete!
```

---

## Deployment Infrastructure

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```mermaid
flowchart TD
    A[Push to main] --> B[Trigger Workflow]
    
    B --> C{Build Job}
    C --> D[actions/checkout@v4]
    D --> E[actions/setup-node@v4<br/>Node 22]
    E --> F[npm install]
    F --> G[npm run build]
    
    G --> H[Prepare dist/]
    H --> I[Copy public/api/ → dist/api/]
    I --> J[Copy CNAME → dist/]
    J --> K[Create dist/.nojekyll]
    K --> L[Verify index.html]
    L --> M[Verify assets/]
    
    M --> N[actions/configure-pages@v4]
    N --> O[actions/upload-pages-artifact@v3]
    
    O --> P{Deploy Job}
    P --> Q[actions/deploy-pages@v4]
    Q --> R[GitHub Pages Server]
    R --> S[CDN Distribution]
    S --> T[reberog.github.io]
    
    classDef trigger fill:#fff3e0,stroke:#e65100
    classDef build fill:#e3f2fd,stroke:#1565c0
    classDef prepare fill:#f3e5f5,stroke:#6a1b9a
    classDef deploy fill:#e8f5e9,stroke:#2e7d32
    
    class A,B trigger
    class C,D,E,F,G build
    class H,I,J,K,L,M,N,O prepare
    class P,Q,R,S,T deploy
```

### Deployment Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **Trigger** | `push` to `main`, `workflow_dispatch` | Auto-deploy on commit |
| **Node Version** | 22 | Match local dev environment |
| **Package Manager** | npm | Install dependencies |
| **Build Command** | `npm run build` | Generate static site |
| **Artifact Path** | `./dist` | Deploy only built files |
| **Base Path** | `/` | Root domain (not subdirectory) |

**Critical Files in dist/:**
- `.nojekyll` - Disables Jekyll processing (MUST exist)
- `CNAME` - Custom domain configuration (optional)
- `index.html` - Entry point
- `assets/` - Bundled JS/CSS
- `api/` - Project data JSON files

---

## API Integration

### GitHub API

**Purpose:** Fetch commit data and README files

**Authentication:** Personal Access Token (if needed for rate limits)

**Endpoints Used:**
```
GET /repos/{owner}/{repo}/commits
GET /repos/{owner}/{repo}/readme
GET /repos/{owner}/{repo}/contents/{path}
```

**Rate Limits:**
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour

### Gemini AI API

**Purpose:** Generate project summaries and extract metadata

**Model:** `gemini-1.5-flash`

**API Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

**Request Format:**
```javascript
{
  "contents": [
    {
      "parts": [
        {
          "text": "Analyze this README and extract:\n1. Summary\n2. Highlights\n3. Tech stack\n\n[README CONTENT]"
        }
      ]
    }
  ]
}
```

**Response Parsing:**
- Extract JSON from text response
- Validate schema
- Fallback to default values on error

---

## Security

### API Key Management

```mermaid
flowchart LR
    A[.env File] -->|Git Ignored| B[Local Development]
    C[GitHub Secrets] -->|Encrypted| D[GitHub Actions]
    
    B --> E[process.env.GEMINI_API_KEY]
    D --> F[env.GEMINI_API_KEY]
    
    E --> G[update-projects.cjs]
    F --> G
    
    G --> H[Gemini API]
    
    classDef secure fill:#e8f5e9,stroke:#2e7d32
    classDef env fill:#fff3e0,stroke:#e65100
    classDef code fill:#e3f2fd,stroke:#1565c0
    classDef api fill:#f3e5f5,stroke:#6a1b9a
    
    class A,C secure
    class B,D,E,F env
    class G code
    class H api
```

### Best Practices

1. **No Secrets in Code:** API keys only in `.env` and GitHub Secrets
2. **Git Ignore:** `.env` never committed
3. **Public Data:** All output data in `public/api/` is public
4. **No Sensitive Info:** Don't include private data in summaries
5. **Rate Limiting:** Respect GitHub and Gemini API limits

---

## Performance Optimizations

### Build-Time Optimizations

```mermaid
flowchart TD
    A[Source Code] --> B{Optimization Layer}
    
    B --> C[Tree Shaking]
    C --> D[Remove Unused Code]
    
    B --> E[Code Splitting]
    E --> F[Create Route Chunks]
    
    B --> G[Minification]
    G --> H[Compress JS/CSS]
    
    B --> I[Asset Optimization]
    I --> J[Compress Images]
    I --> K[Inline Small Files]
    
    B --> L[Bundle Analysis]
    L --> M[Identify Large Deps]
    
    D --> N[Smaller Bundle]
    F --> N
    H --> N
    J --> N
    K --> N
    
    N --> O[Faster Load Time]
    
    classDef input fill:#e1f5ff,stroke:#01579b
    classDef process fill:#fff3e0,stroke:#e65100
    classDef output fill:#e8f5e9,stroke:#2e7d32
    
    class A input
    class B,C,E,G,I,L,M process
    class D,F,H,J,K,N,O output
```

### Runtime Optimizations

| Technique | Implementation | Benefit |
|-----------|---------------|---------|
| **Lazy Loading** | React.lazy() for routes | Reduce initial bundle |
| **Image Optimization** | WebP format, lazy loading | Faster image loads |
| **CDN Caching** | GitHub Pages CDN | Global distribution |
| **Code Splitting** | Vite automatic chunks | Parallel downloads |
| **CSS Purging** | Tailwind JIT | Minimal CSS |
| **Preloading** | Link rel=preload | Faster critical resources |

---

## Error Handling & Monitoring

### Build Errors

```mermaid
flowchart TD
    A[Build Process] --> B{Error Type?}
    
    B -->|TypeScript| C[Type Check Failed]
    C --> D[Show Type Errors]
    D --> E[Fix Types]
    
    B -->|Dependency| F[Missing Package]
    F --> G[npm install]
    
    B -->|Vite| H[Build Config Error]
    H --> I[Check vite.config.ts]
    
    B -->|Asset| J[Missing File]
    J --> K[Check File Paths]
    
    E --> L[Retry Build]
    G --> L
    I --> L
    K --> L
    
    L --> M{Success?}
    M -->|Yes| N[✅ Deploy]
    M -->|No| O[❌ Fail Workflow]
    
    classDef error fill:#ffebee,stroke:#c62828
    classDef fix fill:#e3f2fd,stroke:#1565c0
    classDef success fill:#e8f5e9,stroke:#2e7d32
    
    class C,F,H,J,O error
    class D,E,G,I,K,L fix
    class N success
```

### Runtime Errors

**Error Boundaries:**
- Catch React component errors
- Display fallback UI
- Log to console

**API Failures:**
- Retry with exponential backoff
- Fallback to cached data
- Display user-friendly message

---

## Development Workflow

### Local Development

```mermaid
flowchart LR
    A[Clone Repo] --> B[npm install]
    B --> C[Copy .env.example → .env]
    C --> D[Add GEMINI_API_KEY]
    D --> E[npm run update]
    E --> F[npm run dev]
    F --> G[Open localhost:5173]
    
    G --> H{Make Changes}
    H --> I[Edit Code]
    I --> J[Hot Reload]
    J --> G
    
    H --> K[Update Projects]
    K --> E
    
    H --> L[Ready to Deploy]
    L --> M[git push origin main]
    M --> N[Auto Deploy]
    
    classDef setup fill:#e3f2fd,stroke:#1565c0
    classDef dev fill:#fff3e0,stroke:#e65100
    classDef deploy fill:#e8f5e9,stroke:#2e7d32
    
    class A,B,C,D setup
    class E,F,G,H,I,J,K dev
    class L,M,N deploy
```

### Testing Strategy

```mermaid
flowchart TD
    A[Code Changes] --> B[Local Testing]
    B --> C[npm run build]
    C --> D[npm run preview]
    D --> E{Works Locally?}
    
    E -->|No| F[Debug Issues]
    F --> B
    
    E -->|Yes| G[git push]
    G --> H[GitHub Actions]
    H --> I[Build Job]
    I --> J{Build Success?}
    
    J -->|No| K[Check Logs]
    K --> F
    
    J -->|Yes| L[Deploy Job]
    L --> M[Live Site]
    M --> N{Works Live?}
    
    N -->|No| O[Rollback or Fix]
    O --> B
    
    N -->|Yes| P[✅ Success!]
    
    classDef test fill:#e3f2fd,stroke:#1565c0
    classDef build fill:#fff3e0,stroke:#e65100
    classDef deploy fill:#e8f5e9,stroke:#2e7d32
    classDef error fill:#ffebee,stroke:#c62828
    
    class B,C,D,E test
    class G,H,I,J build
    class L,M,N,P deploy
    class F,K,O error
```

---

## File Structure Details

### Key Files Explained

| File | Purpose | Modification Frequency |
|------|---------|----------------------|
| `vite.config.ts` | Vite build configuration | Rarely |
| `tailwind.config.js` | Tailwind CSS settings | Occasionally |
| `tsconfig.json` | TypeScript compiler options | Rarely |
| `update-projects.cjs` | Auto-update script | Occasionally |
| `src/routes/index.tsx` | Homepage component | Frequently |
| `src/components/GitHubProjects.tsx` | Project display logic | Occasionally |
| `.github/workflows/deploy.yml` | CI/CD pipeline | Rarely |
| `public/api/*.json` | Data files (auto-generated) | Automatically |

### Environment Files

```
.env                    # Local secrets (git ignored)
.env.example            # Template for .env
.gitignore             # Files to exclude from git
.nojekyll (in public/) # Disable Jekyll (copied to dist/)
```

---

## Scaling Considerations

### Future Scalability

```mermaid
flowchart TD
    A[Current: Static Site] --> B{Scale Needed?}
    
    B -->|High Traffic| C[Add CDN<br/>Cloudflare/Vercel]
    
    B -->|Dynamic Data| D[Add Backend API<br/>Serverless Functions]
    
    B -->|Real-time| E[Add WebSocket Server<br/>Live Updates]
    
    B -->|Analytics| F[Add Tracking<br/>Google Analytics/Plausible]
    
    B -->|CMS| G[Add Headless CMS<br/>Contentful/Sanity]
    
    C --> H[Improved Performance]
    D --> I[Database Integration]
    E --> J[Live Collaboration]
    F --> K[Usage Insights]
    G --> L[Non-dev Content Updates]
    
    classDef current fill:#e3f2fd,stroke:#1565c0
    classDef scale fill:#fff3e0,stroke:#e65100
    classDef result fill:#e8f5e9,stroke:#2e7d32
    
    class A,B current
    class C,D,E,F,G scale
    class H,I,J,K,L result
```

---

## Conclusion

This technical architecture provides a solid foundation for a modern, maintainable portfolio site. The combination of static generation, automated updates, and CI/CD ensures reliability and ease of maintenance.

**Key Technical Strengths:**
- ⚡ Fast build times with Vite
- 🔄 Automated updates with AI
- 🚀 Zero-downtime deployments
- 📦 Optimized bundle sizes
- 🔒 Secure secret management
- 🎯 Type-safe codebase with TypeScript

For functional behavior and user flows, see [ARCHITECTURE.md](./ARCHITECTURE.md).
