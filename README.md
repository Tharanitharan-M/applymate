# ApplyMate

ApplyMate is a tool I’m building to help me stay organized during my job search. Instead of juggling spreadsheets, notes, saved links, and random reminders, this app brings everything into one clean workflow.

I’m building it for myself first, but also as a full-stack project that shows the kind of systems I can architect, implement, and scale.

## 🎯 What ApplyMate Does

ApplyMate helps me:

- Track jobs I’m interested in or have applied to.
- Store company, role, job URL, dates, and notes in one place.
- Upload and store multiple resumes.
- Extract text from each resume and use AI to analyze it.
- Compare my resume against a job description and get an ATS-style score.
- See missing skills, keyword suggestions, and resume improvements.
- Keep everything organized so I know where I applied and what to do next.

The goal is to make job-searching more structured, less overwhelming, and a bit smarter.

## 🧰 Why I’m Building This

I’m a graduate student working toward a software engineering role. ApplyMate is my way of demonstrating that I can:

- Design and build production-ready full-stack systems.
- Use modern frameworks and cloud services.
- Integrate AI into real workflows.
- Work with databases, API routes, storage, and authentication.
- Build something that solves a real problem I face every day.

ApplyMate isn’t a toy. It’s something I actually use.

## 🛠 Tech Stack

Frontend

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Zustand (for state)
- Zod (for validation)

Backend / API

- Next.js server routes
- Prisma ORM
- Neon PostgreSQL
- AWS S3 (resume storage)
- Vercel AI SDK (Gemini, future: OpenAI / Claude / Grok)

AI Features

- Resume text extraction (pdf-parse)
- ATS scoring using Gemini
- Keyword & bullet point suggestions
- Model-agnostic architecture (easy to swap models)

Dev & Infra

- Node.js
- Environmental config with .env.local
- Git + GitHub

More infrastructure (Cognito authentication, CI/CD, Docker, Terraform/CDK) will come as the project grows.

📂 Current Repo Structure

```
applymate/
  ├── src/
  │   ├── app/
  │   ├── lib/
  │   ├── api/
  ├── prisma/
  ├── public/
  ├── README.md
  └── package.json
```

This will expand as I add more features and services.

## ✅ Current Status

Completed

- Project setup with Next.js + TypeScript
- Database setup with Prisma + Neon
- S3 integration
- Resume upload API
- PDF text extraction
- Auto-creating a test user
- ATS scoring pipeline structure
- Model-agnostic AI setup with Vercel AI SDK

In Progress

- Resume upload UI
- Job creation UI
- ATS scoring integration in the job creation process

Planned

- User authentication (AWS Cognito or Auth.js)
- Dashboard with analytics
- Job scraping / auto-fetching
- Outreach helper (suggest who to reach out to and what to say)
- Reminders & notifications
- Full CI/CD and cloud deployment

## 🚀 How to Run Locally

1. Clone the repo:

```bash
git clone https://github.com/Tharanitharan-M/applymate.git
cd applymate
```

2. Install dependencies:

```bash
npm install
```

3. Add required environment variables in .env.local:

```bash
DATABASE_URL="..."
GEMINI_API_KEY="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="..."
AWS_REGION="us-east-1"
```

4. Push Prisma schema:

```bash
npx prisma generate
```

5. Start the dev server:

```bash
npm run dev
```

6. Visit the test page to try resume upload:

```bash
http://localhost:3000/test-upload
```

## 🔭 What I’m Demonstrating With ApplyMate

- Building scalable full-stack apps
- Integrating AI into real workflows
- Working with cloud services (AWS S3, future Cognito)
- Database modeling and backend architecture
- Clean, maintainable code
- Ability to take a real problem and design a full solution
- Iterating quickly while keeping a long-term architecture in mind

## 📩 Feedback Welcome

If you have suggestions or want to collaborate, feel free to reach out.
I’m actively expanding this project and would love input from other engineers.
