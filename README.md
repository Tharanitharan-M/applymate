# ApplyMate

ApplyMate is a tool I'm building to help me stay organized during my job search. Instead of juggling spreadsheets, notes, saved links, and random reminders, this app brings everything into one clean workflow.

I'm building it for myself first, but also as a full-stack project that shows the kind of systems I can architect, implement, and scale.

## What ApplyMate Does

ApplyMate helps me track jobs I'm interested in or have applied to. I can store company, role, job URL, dates, and notes in one place. I can upload and store multiple resumes. The app extracts text from each resume and uses AI to analyze it. It compares my resume against a job description and gives me an ATS style score. I can see missing skills, keyword suggestions, and resume improvements. Everything stays organized so I know where I applied and what to do next.

The goal is to make job searching more structured, less overwhelming, and a bit smarter.

## Why I'm Building This

I'm a graduate student working toward a software engineering role. ApplyMate is my way of demonstrating that I can design and build production ready full stack systems. I can use modern frameworks and cloud services. I can integrate AI into real workflows. I can work with databases, API routes, storage, and authentication. I can build something that solves a real problem I face every day.

ApplyMate isn't a toy. It's something I actually use.

## Tech Stack

Frontend

Next.js 14 with App Router, TypeScript, TailwindCSS, Zustand for state, and Zod for validation.

Backend and API

Next.js server routes, Prisma ORM, Neon PostgreSQL, AWS S3 for resume storage, and Vercel AI SDK with Gemini. I'm planning to add OpenAI, Claude, and Grok support in the future.

AI Features

Resume text extraction using pdf parse, ATS scoring using Gemini, keyword and bullet point suggestions, and a model agnostic architecture that makes it easy to swap models.

Dev and Infrastructure

Node.js, environmental config with .env.local, Git and GitHub, and AWS Cognito for authentication.

More infrastructure like CI/CD, Docker, and Terraform or CDK will come as the project grows.

## Current Repo Structure

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

## Current Status

Completed

Project setup with Next.js and TypeScript, database setup with Prisma and Neon, S3 integration for resume storage, user authentication with AWS Cognito including login, signup, logout, and email verification, resume upload API and UI with PDF text extraction, ATS scoring pipeline with Gemini integration that compares resumes against job descriptions, job creation and management UI with full CRUD operations, dashboard with analytics showing job stats and progress tracking, networking contacts management with interactions and reminders, resume management UI with ATS score display, job detail pages with match score analysis and AI chat, contact detail pages with interaction history and reminder management, profile page for user settings, and model agnostic AI setup with Vercel AI SDK.

Planned

Job scraping and auto fetching from job boards, outreach helper that suggests who to reach out to and what to say, and full CI/CD and cloud deployment.

## How to Run Locally

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
NEXT_PUBLIC_COGNITO_USER_POOL_ID="..."
NEXT_PUBLIC_COGNITO_CLIENT_ID="..."
NEXT_PUBLIC_COGNITO_REGION="us-east-1"
COGNITO_CLIENT_SECRET="..." # Optional, only if your app client has a secret
```

4. Push Prisma schema:

```bash
npx prisma generate
```

5. Start the dev server:

```bash
npm run dev
```

6. Visit the app and sign up or log in:

```bash
http://localhost:3000
```

You'll need to create an account first, then you can access the dashboard to manage jobs, resumes, and networking contacts.

## What I'm Demonstrating With ApplyMate

Building scalable full stack apps, integrating AI into real workflows, working with cloud services like AWS S3 and Cognito, database modeling and backend architecture, clean and maintainable code, ability to take a real problem and design a full solution, and iterating quickly while keeping a long term architecture in mind.

## Feedback Welcome

If you have suggestions or want to collaborate, feel free to reach out. I'm actively expanding this project and would love input from other engineers.
