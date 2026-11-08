# Putting the Training Hub online (Vercel + Neon)

This gets the site running at a web address you can send to coaches. It takes about 15 minutes, needs no coding, and uses free plans. The first deploy loads all 4,226 training questions and 1,387 element drills automatically.

## What you need

- Your GitHub account (where this repository lives).
- A Vercel account. Sign up at vercel.com with **Continue with GitHub**.

Neon (the database) is created from inside Vercel, so you don't need a separate account.

## 1. Create the Vercel project

1. In Vercel, click **Add New… → Project**.
2. Find `nsmq-training-hub-v2` and click **Import**. If it isn't listed, click **Adjust GitHub App Permissions** and allow access to that repository.
3. Leave the framework as **Next.js**. Don't change the build command; the project's `vercel-build` script runs automatically.
4. Open **Environment Variables** and add one variable:
   - `SETUP_SECRET`: a long random phrase only you know, at least 24 characters, e.g. `ghanata-quiz-setup-7g4k2p9x-2026`. It's used once to create your admin account.
5. Click **Deploy**. This first deployment builds `main` without a database, so it will fail or show the old site. Ignore it; the next steps replace it.
6. Point the site at the review branch: open **Settings → Git → Production Branch**, enter `claude/v3-phase1-fixes`, and save. Switch it back to `main` after you merge.

   This step matters. On the free plan, Vercel puts non-production ("preview") links behind a Vercel login, so coaches couldn't open them. The production branch gets the public address.

## 2. Add the database

1. In your new Vercel project, open the **Storage** tab.
2. Click **Create Database**, choose **Neon** (Serverless Postgres), accept the free plan, and choose the region closest to Ghana that's offered (a European region such as Frankfurt or London).
3. When asked which environments to connect, keep **Production** and **Preview** ticked and connect it to this project.

Vercel adds the database connection settings to the project for you. You don't need to copy any passwords.

## 3. Deploy again

1. Open **Deployments** and click **Create Deployment** (or **⋯ → Redeploy** on the latest one). Choose the branch `claude/v3-phase1-fixes`.
2. The build log shows these steps:
   - Generating database client
   - Updating database tables
   - Preparing roles
   - Loading the training bank: `inserted: 4226`
   - Loading element drills: `inserted: 1387`
   - Building the website
3. When it says **Ready**, click **Visit**. That's your site's address (something like `nsmq-training-hub-v2.vercel.app`).

Later deploys skip questions that are already loaded, so they're quicker and never duplicate anything.

## 4. Create your admin account

1. Go to `https://<your-site>/setup`.
2. Enter the `SETUP_SECRET` from step 1.5 and your own email.
3. Open the link it gives you within 30 minutes. Enter your name, the same email, and a password of at least 10 characters.
4. Sign in. You'll see **Coach Tools** in the menu.

Then go back to Vercel → **Settings → Environment Variables** and **delete `SETUP_SECRET`**. The setup page also stops working once an admin exists, but removing the secret closes it completely.

## 5. Invite coaches and students

In **Coach Tools → Members**:

1. Enter a person's email, pick a role, and click **Create invitation link**.
2. Copy the link, or press **Send on WhatsApp**, and send it **only to that person**. It works once and expires after 3 days.
3. They open it, choose a password, and sign in.

Roles:

| Role | Can do |
| --- | --- |
| Student | Train, see their own dashboard and the weekly leaderboard |
| Coach | Everything a student can, plus write and review questions, invite and manage students, see every student's progress, save team-contest results |
| Quizmaster | Train, see student progress, run and save team contests |
| Admin | Everything, including inviting coaches and admins and changing roles |

**Forgotten password:** Coach Tools → Members → **Reset password** next to the person's name. Send them the link (valid 24 hours). Choosing a new password signs them out on other devices.

## 6. Bring over existing student records (optional)

If your old local database (`prisma/dev.db`) has real student accounts and attempt history you want to keep, run this once on the computer that has that file:

1. In Vercel → **Storage → Neon → .env.local tab**, copy the line starting with `POSTGRES_PRISMA_URL=`.
2. In a terminal inside the project folder:

   ```
   npm install
   POSTGRES_PRISMA_URL="<paste the value here>" npm run db:copy-local -- prisma/dev.db
   ```

The script only adds records. Questions already online are matched (not duplicated), and attempts are linked to them. Old accounts without a password show as "not activated"; send them an **Activation link** from Members.

## 7. What to ask the reviewers to check

Send coaches the site address plus their invitation link, and ask them to try:

1. **Element Drills**, a few rounds at 10 seconds.
2. **Speed Race** and **Riddles**: do the timer and clue reveals feel right?
3. **Problem of the Day**: do the marking scheme and solution help?
4. **Coach Tools → Review queue**: approve or reject the sample questions they write.
5. **Coach Tools → Students**: is this the information they want about each student?

Coaches can write feedback in a shared document or WhatsApp group. A comment form inside the site could be added in Phase 2.

## Costs and limits

- **Vercel Hobby** is free for personal and non-commercial use. If the hub becomes an official school or commercial service, Vercel's terms require the **Pro** plan (about US$20 per month).
- **Neon Free** includes 1 GB of storage per project, far more than this bank needs. The database pauses after 5 minutes without activity, so the first visit after a quiet period can take a second or two longer.
- Check the current plan details on vercel.com/pricing and neon.com/pricing before relying on them.

## If something goes wrong

| Message | What to do |
| --- | --- |
| Build: "No PostgreSQL database is connected" | Do step 2, then redeploy. |
| Coaches see a Vercel login page | They opened a preview link. Set the Production Branch (step 1.6) and share the main project address instead. |
| `/setup`: "Setup is not enabled" | `SETUP_SECRET` is missing or shorter than 24 characters. Add it in Settings → Environment Variables and redeploy. |
| `/setup`: "An administrator already exists" | Sign in at `/login` instead, or ask the existing admin for an invitation. |
| Sign-in: "Too many incorrect attempts" | Wait 15 minutes, or have a coach send a reset link. |
| Build: `db push` warns about data loss | A future change tried to remove data. The build stops on purpose and nothing is lost. Ask the developer to review it. |
