---
title: building TeachAid Central
date: 2026-09-20
description: a deep dive into the architecture and engineering behind TeachAid Central, a platform bridging the gap between students and verified tutors in Ghana.
---

education in Ghana is highly structured around critical transition points, specifically the BECE for junior high, WASSCE for senior high, and rigorous technical degree programs at the university level. despite these standardized frameworks, classroom instruction often defaults to a rigid, one-size-fits-all approach. when students fall behind or need personalized help with complex STEM concepts, they are typically forced to rely on a highly informal supplementary tutoring market. finding a verified tutor usually involves navigating chaotic WhatsApp groups, physical noticeboards, or word-of-mouth referrals, leading to scheduling conflicts, safety concerns, and zero accountability.

for my final-year project at Ho Technical University, I set out to solve this logistical nightmare. the result is **TeachAid Central**, an integrated web platform designed to digitize, streamline, and personalize the supplementary education ecosystem in Ghana.

## the core solution

at its core, TeachAid Central acts as a real-time bridge between learners and educators, replacing fragmented physical networks with a structured digital environment. the platform is built around two primary, distinct user flows:

**the student experience:** learners can filter and request verified tutors based on specific subject domains, preferred learning styles (visual, auditory, kinesthetic), and availability.

**the tutor experience:** educators are equipped with professional tools to manage their academic business, allowing them to accept requests, schedule sessions, and track their engagements without the administrative overhead.

by centralizing these interactions, the platform eliminates the friction of manual matchmaking and creates a transparent, accountable environment for supplementary learning.

## key features & UX

Designing the user experience required balancing powerful logistical tools with an intuitive interface that wouldn't overwhelm users.

### the unified tutor dashboard

Tutors need immediate visibility into their operations. The dashboard serves as a command center, surfacing critical metrics like total earnings, active student rosters, and pending course requests. Instead of juggling physical diaries or disconnected chat apps, tutors can evaluate their workload and financial progress at a single glance.

### quick class creation

scheduling is historically the most painful part of private tutoring. the quick class creation module allows tutors to seamlessly generate and modify class schedules. by locking in time slots and syncing availability in real-time, the system prevents double-booking and automates the confirmation process, facilitating both remote and in-person learning sessions.

### luna: the 24/7 AI study companion

human tutors cannot be available around the clock. To bridge the gap during late-night study sessions, I integrated **luna**, a contextual AI assistant powered by the gemini API. accessible via an interactive UI drawer, luna acts as an ever-present study companion. whether a student needs a step-by-step breakdown of a complex calculus equation or a simplified explanation of a physics concept, Luna provides immediate, localized academic guidance outside of scheduled tutoring hours.

## technical architecture & engineering

to handle real-time scheduling, multi-role authentication, and seamless AI integration, TeachAid Central required a robust, reactive architecture. The backend logic and API orchestration are powered by **node.js**, which handles the complex routing and asynchronous data flow necessary for a live educational platform. this pairs with a modern frontend stack utilizing react, vite, and tailwind CSS to deliver a fast, responsive client experience.

### automating social previews with open graph tooling

one of the most interesting engineering challenges wasn't just building the core application, but optimizing how the project is documented and shared. To maintain high-quality social previews for the platform's repository and associated content, I built a custom open graph image generation pipeline.

instead of manually designing preview images for every new markdown documentation file or post, i wrote a node.js utility that parses the YAML frontmatter of our content files. By running a simple CLI command—`npm run generate-og`—the script dynamically generates perfectly formatted, branded open graph images based on the file's metadata. This automation ensures that whenever links to TeachAid Central are shared on social platforms or developer networks, they unfurl with rich, professional visual context without any manual design overhead.

## challenges & learnings

building a full-stack application of this scale as a final-year student came with a steep learning curve. managing the real-time database synchronization to ensure that a time slot claimed by one student instantly became unavailable to others required deep dives into state management and listener optimization.

handling the business logic for tutor earnings and scheduling also demanded rigorous error handling to prevent state conflicts. furthermore, managing the deployment pipeline and configuring DNS records to get the production build live on `watse.me` was a massive lesson in modern web infrastructure and continuous delivery.

the journey from a conceptual problem to a fully deployed web application has been incredibly rewarding. TeachAid Central proves that with the right combination of modern web technologies, real-time data sync, and localized AI, we can build accessible, highly efficient tools to support the next generation of students in Ghana.