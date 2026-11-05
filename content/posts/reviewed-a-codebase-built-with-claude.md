---
title: "I reviewed a codebase built entirely with Claude"
slug: "reviewed-a-codebase-built-with-claude"
order: 18
category: "security"
techs: ["auth"]
project: ""
excerpt: "I reviewed a codebase built entirely with Claude last month. The founder was proud of it. And honestly, he should be. He’s not a developer. He used AI to build a working SaaS product in 3 weeks. That’s impressive."
linkedin: true
carousel: ""
date: ""
draft: false
---
I reviewed a codebase built entirely with Claude last month.

The founder was proud of it. And honestly, he should be. He’s not a developer. He used AI to build a working SaaS product in 3 weeks. That’s impressive.

But he asked me to look under the hood before he launched to paying customers. Here’s what I found.

What worked well:

- The UI was clean.
- Routing was solid.
- CRUD operations were well-structured.
- The database schema made sense for the core use case.

For a non-developer using AI tools, the output quality was genuinely good.

What would have broken in production:

- Authentication had no token refresh logic. A user’s session would expire after 60 minutes and the app would just show a blank screen. No redirect to login. No error message. Just white.

- There were zero error boundaries around API calls. If the external API went down (and they all do eventually), the entire page would crash instead of showing a fallback state.

- The app had no concept of concurrent users. Two people editing the same record would silently overwrite each other’s changes. Whoever saved last won. The other person’s work disappeared without warning.

- Environment variables were hardcoded in three different files. API keys sitting in plain text inside the codebase. One public GitHub push away from a security incident.

None of these problems were the founder’s fault. He asked the AI to build features. The AI built features. It just didn’t build the infrastructure that keeps those features working when real people use them.

The product went from “not ready” to “production ready” in about two weeks of focused work.

Not a rebuild. Just filling the gaps AI tools leave behind.

If you’ve built with AI tools, did you have someone review the output before launch?
