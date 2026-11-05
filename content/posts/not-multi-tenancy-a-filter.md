---
title: "That’s not multi-tenancy. That’s a filter."
slug: "not-multi-tenancy-a-filter"
order: 6
category: "saas"
techs: ["postgresql","row-level-security"]
project: ""
excerpt: "I asked an AI tool to build a multi-tenant SaaS. It built a single-tenant app with a tenant ID column."
linkedin: true
carousel: ""
date: ""
draft: false
---
I asked an AI tool to build a multi-tenant SaaS.

It built a single-tenant app with a tenant ID column.

That’s not multi-tenancy.

That’s a filter.

Here’s why this matters if you’re building a SaaS product.

Multi-tenant means multiple customers share the same infrastructure while their data remains completely isolated.

- Customer A can never see Customer B’s data.
- Customer A’s usage can never affect Customer B’s performance.
- Customer A’s billing is independent of Customer B’s billing.

What the AI tool built was a single application where every database table had a `tenant_id` column.

In theory, queries filter by tenant ID so each customer only sees their own data.

In practice, this creates three serious problems.

- Problem 1: One missed WHERE clause leaks data.

Every database query needs a tenant ID filter. Forget it on one query, one endpoint, or one admin panel, and Customer A suddenly sees Customer B’s data.

In healthcare, that's a HIPAA violation.

In finance, that's a lawsuit.

- Problem 2: No resource isolation.

One customer running a heavy report slows down the database for everyone else.

One customer uploading 10 GB of files fills the shared storage.

One customer hitting the API 50,000 times per hour degrades performance for everyone.

- Problem 3: Billing becomes a nightmare.

Without proper tenant isolation, tracking usage per customer means aggregating data across shared tables by tenant ID.

At scale, those queries become slow and expensive.

And if the numbers are wrong, you're either undercharging or overcharging customers.

Real multi-tenancy requires architectural decisions.

- Separate schemas or row-level security policies.
- Per-tenant rate limiting.
- Isolated storage buckets.
- Tenant-aware caching.

AI tools don't make these decisions because they build features one at a time.

Multi-tenancy is a system-level concern that touches every part of the application.

If you've used AI to build a SaaS, did you check whether it's actually multi-tenant or just faking it?

```sql
alter table invoices enable row level security;
create policy tenant_isolation on invoices
  using (tenant_id = current_setting('app.tenant_id')::uuid);
```
