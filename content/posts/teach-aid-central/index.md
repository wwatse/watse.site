---
title: building teachaid central
date: 2026-09-20
description: a deep dive into the architecture and engineering behind teachaid central, a platform bridging the gap between students and verified tutors in ghana.
---

every education platform i have ever used has a discoverability problem. not in the sense that students cannot find the platform, but in the sense that they cannot find the right help at the exact moment they need it. a student who is stuck on quadratic equations at 11 pm does not need a sprawling directory of tutors with bios and hourly rates; they need a session, right now, with someone qualified.

for my final-year project at ho technical university, i set out to solve this logistical nightmare. education in ghana is highly structured around critical transition points — the bece, wassce, and rigorous technical degree programs. yet, when students fall behind in complex stem concepts, classroom instruction often defaults to a rigid, one-size-fits-all approach. the alternative has traditionally been a highly informal supplementary tutoring market, forcing students to navigate chaotic whatsapp groups, physical noticeboards, and word-of-mouth referrals.

teachaid central was built specifically to bypass that friction. it operates as a coordination layer that skips the tedious browse-search-pick-pay loop and lands the student directly in front of a verified tutor for the subject they need, on the timeline they need it.

## the problem vs. the reality

the initial premise of the platform was simple: match students to tutors. but after speaking to students in accra, a few unexpected patterns emerged that reshaped the entire product.

first, the search itself was the actual bottleneck — not the price, and not tutor availability. second, one-off sessions that went well rarely ended there; students wanted a persistent relationship layer to keep working with the same tutor over a term. third, the "verified" badge was doing a lot of silent heavy lifting. students didn't care much about it, but parents did, and parental trust is the ultimate deciding factor in adoption.

instead of a generic marketplace, the platform evolved into three core pillars:

- a fast matchmaking path for immediate, one-off academic interventions.
- a persistent relationship layer for term-long tutoring and schedule management.
- a rigorous verification system designed as a core product feature, not just a checkbox, giving parents immediate peace of mind.

## the core ux and luna ai

designing the user experience required balancing powerful logistical tools with an interface that wouldn't overwhelm users. for educators, i built a unified tutor dashboard. instead of juggling physical diaries or disconnected chat apps, tutors get immediate visibility into their operations — total earnings, active student rosters, and pending course requests. a quick class creation module locks in time slots and syncs availability in real-time, preventing double-booking and automating confirmations for both remote and in-person sessions.

however, human tutors cannot be available around the clock. to bridge the gap during late-night study sessions, i integrated luna, a contextual ai assistant powered by the gemini api. accessible via an interactive ui drawer, luna acts as an ever-present digital companion. whether a student needs a step-by-step breakdown of a complex calculus equation or a simplified explanation of a physics concept, luna provides immediate, localized guidance outside of scheduled hours.

## architecture for the real world

building for the reality of ghanaian student life meant designing around specific constraints: intermittent internet connectivity, mobile devices with limited storage, and a strong cultural preference for whatsapp as the primary communication channel.

> designing for the tools people already use is almost always more effective than designing the tool you wish they would use.

because of this, i treated whatsapp as a first-class notification channel rather than trying to force students to constantly check the web app.

under the hood, the stack relies on node.js for the backend routing, supabase for multi-role authentication and the data layer, and a react/vite frontend styled with tailwind css for a fast, responsive client experience. managing real-time database synchronization to ensure a time slot claimed by one student instantly became unavailable to others required deep dives into state management and listener optimization.

## what building solo taught me

building teachaid central as a solo engineer taught me two lessons i likely wouldn't have learned in a larger team.

first, a clean data model is worth more than any single feature. the entire platform rests on a core `sessions` table that i mapped out in the first two weeks and have barely touched since. it handles the complex business logic for tutor earnings, scheduling, and error state resolution without buckling.

second, verification is a product. the reason parents trust the teachaid verification badge is that i made it difficult to earn. the friction and expense of getting verified is exactly the point — it filters out the noise.

managing the deployment pipeline and configuring the dns records to get the production build live on `watse.me` was a massive lesson in modern web infrastructure. the journey from a conceptual problem to a fully deployed web application proves that with the right combination of real-time data sync, contextual ai, and a deep understanding of local user habits, it is entirely possible to build highly efficient tools to support the next generation of students in ghana.

the project is still running at [teachaid-central-nine.vercel.app](https://teach-aid-central-nine.vercel.app) and the source is on [github](https://github.com/AkakpoErnest/teach-aid-central).
