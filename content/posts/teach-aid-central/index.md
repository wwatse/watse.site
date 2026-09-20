---
title: Building TeachAid Central
date: 2026-09-20
description: A deep dive into the architecture and engineering behind TeachAid Central, a platform bridging the gap between students and verified tutors in Ghana.
---

Education in Ghana is highly structured around critical transition points, specifically the BECE for Junior High, WASSCE for Senior High, and rigorous technical degree programs at the university level. Despite these standardized frameworks, classroom instruction often defaults to a rigid, one-size-fits-all approach. When students fall behind or need personalized help with complex STEM concepts, they are typically forced to rely on a highly informal supplementary tutoring market. Finding a verified tutor usually involves navigating chaotic WhatsApp groups, physical noticeboards, or word-of-mouth referrals, leading to scheduling conflicts, safety concerns, and zero accountability.

For my final-year project at Ho Technical University, I set out to solve this logistical nightmare. The result is **TeachAid Central**, an integrated web platform designed to digitize, streamline, and personalize the supplementary education ecosystem in Ghana.

## The Core Solution

At its core, TeachAid Central acts as a real-time bridge between learners and educators, replacing fragmented physical networks with a structured digital environment. The platform is built around two primary, distinct user flows:

**The Student Experience:** Learners can filter and request verified tutors based on specific subject domains, preferred learning styles (visual, auditory, kinesthetic), and availability.

**The Tutor Experience:** Educators are equipped with professional tools to manage their academic business, allowing them to accept requests, schedule sessions, and track their engagements without the administrative overhead.

By centralizing these interactions, the platform eliminates the friction of manual matchmaking and creates a transparent, accountable environment for supplementary learning.

## Key Features & UX

Designing the user experience required balancing powerful logistical tools with an intuitive interface that wouldn't overwhelm users.

### The Unified Tutor Dashboard

Tutors need immediate visibility into their operations. The dashboard serves as a command center, surfacing critical metrics like total earnings, active student rosters, and pending course requests. Instead of juggling physical diaries or disconnected chat apps, tutors can evaluate their workload and financial progress at a single glance.

### Quick Class Creation

Scheduling is historically the most painful part of private tutoring. The Quick Class Creation module allows tutors to seamlessly generate and modify class schedules. By locking in time slots and syncing availability in real-time, the system prevents double-booking and automates the confirmation process, facilitating both remote and in-person learning sessions.

### Luna: The 24/7 AI Study Companion

Human tutors cannot be available around the clock. To bridge the gap during late-night study sessions, I integrated **Luna**, a contextual AI assistant powered by the Gemini API. Accessible via an interactive UI drawer, Luna acts as an ever-present study companion. Whether a student needs a step-by-step breakdown of a complex calculus equation or a simplified explanation of a physics concept, Luna provides immediate, localized academic guidance outside of scheduled tutoring hours.

## Technical Architecture & Engineering

To handle real-time scheduling, multi-role authentication, and seamless AI integration, TeachAid Central required a robust, reactive architecture. The backend logic and API orchestration are powered by **Node.js**, which handles the complex routing and asynchronous data flow necessary for a live educational platform. This pairs with a modern frontend stack utilizing React, Vite, and Tailwind CSS to deliver a fast, responsive client experience.

### Automating Social Previews with Open Graph Tooling

One of the most interesting engineering challenges wasn't just building the core application, but optimizing how the project is documented and shared. To maintain high-quality social previews for the platform's repository and associated content, I built a custom Open Graph image generation pipeline.

Instead of manually designing preview images for every new markdown documentation file or post, I wrote a Node.js utility that parses the YAML frontmatter of our content files. By running a simple CLI command—`npm run generate-og`—the script dynamically generates perfectly formatted, branded Open Graph images based on the file's metadata. This automation ensures that whenever links to TeachAid Central are shared on social platforms or developer networks, they unfurl with rich, professional visual context without any manual design overhead.

## Challenges & Learnings

Building a full-stack application of this scale as a final-year student came with a steep learning curve. Managing the real-time database synchronization to ensure that a time slot claimed by one student instantly became unavailable to others required deep dives into state management and listener optimization.

Handling the business logic for tutor earnings and scheduling also demanded rigorous error handling to prevent state conflicts. Furthermore, managing the deployment pipeline and configuring DNS records to get the production build live on `watse.me` was a massive lesson in modern web infrastructure and continuous delivery.

The journey from a conceptual problem to a fully deployed web application has been incredibly rewarding. TeachAid Central proves that with the right combination of modern web technologies, real-time data sync, and localized AI, we can build accessible, highly efficient tools to support the next generation of students in Ghana.