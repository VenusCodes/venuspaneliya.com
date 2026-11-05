---
title: "Fix the foundation before you add AI"
slug: "fix-the-foundation-before-ai"
order: 10
category: "ai-engineering"
techs: ["postgresql"]
project: ""
excerpt: "A founder asked me to add AI features to her EdTech platform. I said not yet."
linkedin: true
carousel: ""
date: ""
draft: false
---
A founder asked me to add AI features to her EdTech platform.

I said not yet.

She had a working product. Users were growing. Revenue was coming in. She wanted to add an AI-powered recommendation engine to personalize learning paths for students.

The feature made sense. The timing didn’t.

Here’s why.

The platform’s database schema was designed for the original 3 features. Adding an AI recommendation engine meant the system needed to track user behavior across sessions, store interaction patterns, and serve personalized results in real time.

The existing architecture couldn’t handle any of that. Not because it was bad. It was built for what the product needed at launch. But it wasn’t built for what the product needed next.

If we’d bolted AI features onto the existing foundation, two things would have happened.

- The AI features would have been slow and unreliable.
- The existing features would have started breaking under the added load.

So we spent 6 weeks restructuring the data layer first. Normalized the schema. Added proper indexing. Built a caching layer for frequently accessed data. Set up event tracking for user behavior.

Then we added the AI features.

They shipped in 2 weeks. Not 2 months. Because the foundation was ready.

The recommendation engine worked on day one. No performance issues. No data inconsistencies. No emergency patches.

Here’s the lesson.

When a founder says, “I want AI features,” and a developer says, “Let’s fix the foundation first,” that developer is saving you time, not wasting it.

The fastest path to AI features is rarely “add AI features.”

It’s usually “make the system ready for AI features, then add them.”

Have you ever been told “not yet” by a developer?

In hindsight, were they right?
