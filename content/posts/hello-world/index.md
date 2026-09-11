---
title: Hello World
date: 2026-07-12
description: A first post for the new content engine.
---

Hello world.

This is my first Markdown post for the new content engine.

## Introduction

This section exists so the Table of Contents has something concrete to render
against. It is a test fixture for the post-page enrichment milestone.

## Core Concepts

The content engine pipeline has six stages: loader, parser, markdown renderer,
transform, templates, and router. Each one does a single job.

### Loading

The loader fetches raw markdown text from disk over HTTP.

### Parsing

The parser splits frontmatter from the body and returns a structured document.

## Conclusion

The engine now renders this post end-to-end, including a generated TOC,
reading time, and prev/next navigation.

