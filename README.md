# Manage Turnamen

Tournament management app built with Next.js, Firebase Auth, and Cloud Firestore.

## Setup Firebase Credentials

### 1. Get Service Account Key

Go to [Firebase Console](https://console.firebase.google.com):

1. Select your project > **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the downloaded JSON file

### 2. Add to `.env` File

From the JSON file, extract and add to `.env`:

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA....\n-----END PRIVATE KEY-----\n"
```

**Important:** When copying `FIREBASE_PRIVATE_KEY`, replace all newlines with `\n` literally.

### 3. Run Setup

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

**Server-side** (in `.env`):
- `FIREBASE_PROJECT_ID` — from service account
- `FIREBASE_CLIENT_EMAIL` — from service account
- `FIREBASE_PRIVATE_KEY` — from service account (with escaped newlines)
- `AUTH_SECRET` — any random string for NextAuth
- `NEXTAUTH_URL` — `http://localhost:3000` (dev) or your production URL

**Client-side** (in `.env` or `.env.local`):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Find these in Firebase Console > Project Settings > Your Apps

`NEXT_PUBLIC_FIREBASE_API_KEY` is also required by the server runtime because the credentials login flow in Auth.js verifies email/password through Firebase Auth during `authorize()`.
