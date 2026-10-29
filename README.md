# UW-Social

UW Social helps UW students, including transfer students, international students, and freshmen, expand their social circle. Users can discover people with shared interests, courses, career plans, clubs, or dorms; join organization events; and publish events of their own.

The application is a Vue 3 + TypeScript single-page app backed by Firebase. It supports event discovery and publishing, clubs, forums, profiles, Google Calendar integration, and authenticated AI features.

## Documentation

- [Technical README](README_technical.md): architecture, local development, validation, and deployment.
- [Cloudflare Worker README](Cloudflare/README.md): Workers AI deployment, configuration, authentication, and free-tier limits.
- [Event evaluation rules](shared/EVENT_EVALUATION.md): scoring criteria used by event review.

## AI service

The AI Consultant, event text extraction, and event scoring run through the Cloudflare Worker in `Cloudflare/`, using Workers AI. The browser sends requests to `/chat`, `/extract-event`, and `/score-event` through the public `VITE_AI_API_BASE_URL`; each request requires a non-anonymous Firebase login. No Gemini key is required in the frontend.
