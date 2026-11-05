---
title: "3 architecture decisions AI tools will never make for you"
slug: "three-architecture-decisions-ai-wont-make"
order: 12
category: "saas"
techs: ["stripe-connect","openai-api","token-and-cost-controls"]
project: ""
excerpt: "There are 3 architecture decisions that AI tools will never make for you. They’ll generate code. They’ll build features. They’ll even structure your database schema in a way that looks reasonable."
linkedin: true
carousel: ""
date: ""
draft: false
---
There are 3 architecture decisions that AI tools will never make for you.

They’ll generate code. They’ll build features. They’ll even structure your database schema in a way that looks reasonable.

But they won’t make system-level decisions that require understanding your business, your users, and your scale requirements.

- Decision 1: Where does payment state live?

When a customer pays you through Stripe, the transaction data lives in Stripe’s system. Most AI-generated code treats Stripe as the source of truth and queries Stripe’s API every time you need payout status.

The problem: Stripe’s API has latency. It has rate limits. And if Stripe goes down for 20 minutes, your entire payment dashboard goes blank.

The better approach: store payment state in your own database. Use Stripe as the processor, not the record keeper. Sync events through webhooks. Now your system works even when Stripe hiccups.

- Decision 2: How do you limit costs per customer in a multi-tenant app?

If you’re building AI features, every API call to OpenAI costs money. Without controls, one customer running 10,000 prompts burns through your budget while other customers get slow responses.

AI tools don’t add per-tenant rate limiting because they don’t think at the system level. They build features for one user at a time.

You need architecture that thinks about all your users simultaneously.

- Decision 3: What happens when the AI API goes down?

Your product calls OpenAI. OpenAI has an outage. What does your user see?

Most AI-generated code shows a crash or a loading spinner that never resolves.

Production-ready code shows a graceful fallback. Maybe a cached response. Maybe a message that says “this feature is temporarily unavailable.”

Something that doesn’t destroy the user’s trust.

These decisions require judgment.

AI tools generate code.
Developers make decisions.

If you’re building with AI tools, which of these 3 have you thought about?
