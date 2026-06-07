# NSMQ Training Hub

An independent, full-stack training platform for Ghanaian SHS students preparing for National Science and Maths Quiz-style competition. It focuses on speed, accuracy, shortcut methods, repeated patterns, and confidence-building feedback without copying official branding or protected question sets.

## Features

- Five-round full contest simulation with solo and three-team modes
- Self-practice filters for subject, topic, subtopic, round, difficulty, count, and timing
- Speed Race, Problem of the Day, True/False, and four-clue Riddle modes
- Tolerant answer checking: case-insensitive, whitespace-trimmed, accepted alternatives, numeric tolerance, and T/F aliases
- Immediate shortcut, full solution, common-trap, and encouragement feedback
- Progress dashboard backed by saved attempts
- Searchable question bank with pattern and source filters
- Coach/admin question creation, editing, deletion, and CSV/JSON import
- Source and permission tracking for every question
- 120 original seed questions: 30 each for Mathematics, Physics, Chemistry, and Biology
- Ghana-context questions and riddles covering examples such as kenkey fermentation, Akosombo hydroelectric power, trotro motion, gari drying, Harmattan, and malaria ecology

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite for local development

Question arrays are stored as JSON strings for broad SQLite compatibility. The data model otherwise uses portable Prisma types so migration to PostgreSQL or Supabase is straightforward.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Database commands

```bash
npm run db:generate   # generate Prisma Client
npm run db:push       # create/update local SQLite schema
npm run db:seed       # replace local question data with the 120 original samples
npm run db:studio     # inspect and edit records visually
```

The local database is `prisma/dev.db` and is intentionally ignored by Git.

## Adding questions

Open `/admin` to:

1. Add one question with the manual form.
2. Upload a CSV or JSON array.
3. Review, quick-edit, or delete existing questions.

The example import file is at `examples/questions-import.csv`. JSON imports use the same property names as the `Question` model.

For `acceptedAnswers` and `tags`, use valid JSON arrays encoded as strings in CSV:

```csv
"[""4"",""four""]","[""algebra"",""fundamentals""]"
```

All copied or sourced material must include `sourceType`, `sourceName`, `sourceUrl` where available, `sourceYear`, `contestStage`, `videoTimestamp` where relevant, and `permissionStatus`. Keep unapproved material at `PRIVATE_REVIEW` or `NEEDS_PERMISSION`; do not publish it to students.

## Scoring

- Round 1: +3 correct; coach can add a +1 bonus manually
- Speed Race: +3 correct, -1 wrong
- Problem of the Day: 10 total; MVP supports final-answer checking plus coach marking
- True or False: +2 correct, -1 wrong
- Riddles: 5, 4, 3, or 2 points based on the clue used

## PostgreSQL or Supabase migration

1. Provision a PostgreSQL database.
2. Change the Prisma datasource provider from `sqlite` to `postgresql`.
3. Set `DATABASE_URL` to the PostgreSQL connection string.
4. Run `npx prisma migrate dev --name postgres-baseline` during development.
5. Replace the demo-user convention with Supabase Auth or another authentication provider.

For production, also add role-based route protection, transaction-backed bulk imports, pagination, richer coach marking, accessibility testing, and automated test coverage.

## Copyright note

The seed contains original practice questions only. The application supports past-question-style records, but storing content does not grant permission to publish it. Treat source and permission fields as required editorial controls.
