---
title: "The support problem that was really an architecture problem"
slug: "support-problem-was-architecture"
order: 27
category: "saas"
techs: ["react","auth"]
project: "immigration-case-portal"
excerpt: "A client came to me with a problem that looked like a customer service problem but wasn’t. He was running an immigration case management platform."
linkedin: true
carousel: ""
date: ""
draft: false
---
A client came to me with a problem that looked like a customer service problem but wasn’t.

He was running an immigration case management platform.

Applicants, attorneys, case managers, support staff.

Four different user types, all interacting with the same cases, all needing different views of the same information.

The support team was drowning.

Not because they were bad at their jobs.

Because the system forced every question through them.

- An applicant wanted to check the status of their case? Email to support.

- An attorney needed to see which documents were still pending? Email to support.

- A case manager wanted to know which applications were stuck in review?

They had a dashboard, but it hadn’t been updated since the last developer left.

Every question, no matter how simple, ended up in the support inbox.

The team was spending 70% of their day answering questions that the system should have answered automatically.

The founder tried hiring more support staff.

That helped for a month.

Then volume grew and they were underwater again.

Adding people to a broken process just gives you more people working on a broken process.

**The fix wasn’t more staff**.

**It was architecture**.

I built a multi-role portal.

- Each user type, applicant, attorney, case manager, admin, gets a view designed specifically for their needs.

- Applicants see their case status, pending documents, and next steps without contacting anyone.

- Attorneys see their full caseload with filters for urgency and status.

- Case managers get a real-time dashboard with bottleneck identification.

The information was already in the database.

It just wasn’t being surfaced to the people who needed it.

After launch, inbound support queries dropped by approximately 40%.

The founder didn’t hire those extra support staff.

The existing team went from spending most of their day on repetitive status questions to handling only the cases that genuinely needed human judgment.

**This is what I mean when I say I try to understand the business flow before writing code**.

The technical build wasn’t complicated.

- React frontend.
- Role-based access control.
- Real-time data sync.

Standard tools.

The insight that made it work wasn’t technical.

It was recognizing that the support problem was actually an information architecture problem.

A different developer might have built a better ticketing system.

**I built a system that made most tickets unnecessary**.
