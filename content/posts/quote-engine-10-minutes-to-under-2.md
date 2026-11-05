---
title: "How a 10-minute quote engine got under 2 minutes"
slug: "quote-engine-10-minutes-to-under-2"
order: 16
category: "fintech"
techs: ["redis","rest-apis"]
project: "insurance-quote-engine"
excerpt: "A quote engine was taking over 10 minutes to return results. Users were leaving the page before their quotes loaded. The client’s support team was getting calls: “Is your site broken?”"
linkedin: true
carousel: ""
date: ""
draft: false
---
A quote engine was taking over 10 minutes to return results.

Users were leaving the page before their quotes loaded. The client’s support team was getting calls: “Is your site broken?”

It wasn’t broken. It was just slow.
Here’s what was happening underneath.

Every time a user requested a quote, the system called 4 different insurer APIs sequentially. One after another.

Each API took 1 to 3 minutes to respond depending on load. The system waited for all 4 to finish before showing anything.

On a good day, that was 5 minutes. On a bad day, 12.

The fix was not about writing faster code.

- We added a caching layer. When an insurer API returned a result, we stored it. If another user with similar parameters requested a quote within a reasonable window, we served the cached result instead of hitting the API again.

- We also switched the API calls from sequential to parallel. Instead of waiting for API 1 to finish before calling API 2, we called all 4 simultaneously.

Combined result: quote delivery dropped from over 10 minutes to under 2 minutes. Sometimes under 30 seconds for cached results.

Support calls about speed dropped to near zero. Completion rates went up because users actually stuck around to see their quotes.

Here’s what this taught me.

When a product feels slow, the instinct is to optimize code or upgrade the server. But most of the time, the problem is architectural.

The system is doing things in the wrong order, or doing the same work repeatedly when it doesn’t need to.

Before you add more features, fix the foundation.

What’s the slowest part of your product right now? The one where you know users are dropping off?
