# Notsen

![Next.js](https://img.shields.io/badge/Next.js-Web%20App-000000?logo=nextdotjs&logoColor=white) ![Kotlin](https://img.shields.io/badge/Kotlin-Android-7F52FF?logo=kotlin&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)

A productivity project for organizing boards, tasks, and quick notes across web and Android. The repository contains a **Next.js/TypeScript web app**, a **Kotlin/Jetpack Compose Android app**, and Supabase database scripts.

## Highlights

- Boards and task workflows with drag-and-drop interactions
- Quick notes, task views, a calendar, and a "My Day" area
- Account and session flows backed by Supabase
- Android feature modules for boards, notes, My Day, and profile screens

## Stack

| Layer | Technologies |
| --- | --- |
| Web | Next.js, React, TypeScript |
| Android | Kotlin, Jetpack Compose, Navigation Compose |
| Data and auth | Supabase, PostgreSQL, Supabase Auth |

## Project layout

```text
src/        Next.js pages, components, hooks, and app logic
android/    Native Android application
supabase/   Database migrations
docs/       Project notes
```

## Run the web app

1. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Backend features require a compatible Supabase project and the repository's database setup.

## Build the Android app

Open `android/` in Android Studio. The Android build reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `android/local.properties`. After setting those values, sync Gradle and build or run the app from Android Studio.

> The web and Android clients share the same product idea, but their feature coverage can differ. Explore each client separately.
