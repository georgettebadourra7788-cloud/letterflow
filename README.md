# LetterFlow

Recommendation / reference letter writing & tracking tool for university lecturers. Faculty keep a roster of students, generate a first-draft recommendation letter from template/mail-merge logic (no AI, $0 cost), edit it, track its status, and export it as a `.docx` or PDF.

Stack: React + Vite, Firebase (Auth + Firestore + Hosting), Tailwind CSS.

## Data model

- `users/{uid}` — faculty profile: `name`, `email`, `institution`, `title`, `letterheadText`, `signatureName`, `plan` (`free` | `paid`, defaults to `free`)
- `users/{uid}/students/{studentId}` — `name`, `program`, `grade`, `relationship`, `achievements[]`, `notes`, `createdAt`
- `users/{uid}/letters/{letterId}` — `studentId`, `purpose` (`gradSchool` | `job` | `scholarship` | `visa`), `tone` (`formal` | `warm` | `concise`), `deadline`, `status` (`draft` | `sent` | `submitted`), `draftText`, `createdAt`, `updatedAt`

Every subcollection is scoped under the faculty member's own `uid`; Firestore rules (`firestore.rules`) only allow a signed-in user to read/write their own documents.

Template assembly logic (no AI) lives in `src/lib/templates.js`: each purpose maps to an ordered list of paragraph blocks, and tone swaps the opening/closing phrasing.

## Freemium plan

New users default to `plan: 'free'`, capped at 3 students and 3 letters created per calendar month (`src/lib/limits.js`). Hitting either cap replaces the New Student / New Letter Request form with an upgrade notice pointing to a manual-upgrade email (`src/lib/config.js`, `UPGRADE_EMAIL`). There's no payment integration — flip `plan` to `'paid'` by hand in the Firestore console to lift the limits for a user.

## Local setup

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Enable Authentication** → Sign-in method → Email/Password.
3. **Create a Firestore database** (production mode is fine — rules are provided in `firestore.rules`).
4. **Register a Web App** in Project Settings → General → Your apps, and copy the config values.
5. Copy `.env.example` to `.env` and fill in the Firebase config values:

   ```sh
   cp .env.example .env
   ```

6. Install dependencies and start the dev server:

   ```sh
   npm install
   npm run dev
   ```

## Deploying Firestore rules

```sh
npm install -g firebase-tools   # if you don't have it
firebase login
firebase use --add              # select your Firebase project
firebase deploy --only firestore:rules
```

## Deploying to Firebase Hosting

```sh
npm run build
firebase deploy --only hosting
```

## Screens

1. Login / Signup (Firebase Auth, email + password)
2. Dashboard — letters list with purpose/status badges, sorted by deadline
3. Students — roster with add/edit dossier (name, program, grade, relationship, achievements, notes)
4. New Letter Request — pick student, purpose, tone, deadline → auto-assembles a draft
5. Letter Editor — edit the assembled draft, save, change status
6. Export — letterhead preview, download as `.docx` or print to PDF
7. Settings — letterhead text and signature name, used in exports
