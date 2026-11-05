---
title: "Five questions an enterprise security review will ask"
slug: "security-questionnaire-ai-built-saas"
order: 20
category: "security"
techs: ["auth","token-and-cost-controls"]
project: ""
excerpt: "You built a working SaaS product with AI tools. Login works. Dashboard loads. Users can sign up and pay."
linkedin: true
carousel: ""
date: ""
draft: false
---
You built a working SaaS product with AI tools.

Login works. Dashboard loads. Users can sign up and pay.

Now an enterprise prospect wants to buy. Their procurement team sends over a security questionnaire.

- Question 1: Is user data encrypted at rest?

You check. It isn’t.

The database stores everything in plaintext because AI-generated code doesn’t add encryption unless you specifically ask for it.

- Question 2: Do you have audit logs for data access?

You check. You don’t.

There’s no record of who accessed what data, when, or from where. The AI tool didn’t generate logging because it wasn’t part of the feature request.

- Question 3: How do you handle data deletion requests?

You check. There’s no mechanism.

A user asks to delete their account, and you’d have to manually dig through the database. No GDPR-compliant deletion flow exists.

- Question 4: Do you have rate limiting to prevent abuse?

You check. You don’t.

A single user could hit your API 10,000 times per minute and you’d have no throttling. Your OpenAI bill would spike before you noticed.

- Question 5: What’s your incident response process?

There isn’t one.

Because the AI tool built features, not operational processes.

This is the gap between “it works” and “it’s ready for real customers.”

AI tools are extraordinary for building quickly. But they build features, not infrastructure.

Security, compliance, and operational readiness are the foundation that separates a prototype from a product.

The fix isn’t to stop using AI tools.

The fix is to know what they skip and have someone fill those gaps before your first enterprise customer asks.

Non-technical founders,

Does your developer talk to you about security?

Or do you just assume it’s handled?
