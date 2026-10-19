# Phase 6 — Mobile & Core Journey Verification Checklist
**Date:** 2026-10-19  
**Status:** Plan only. No device testing performed in this session.

Use this on a real phone-sized viewport (or device) after the P0 merges. Mark each item Pass / Fail / Blocked / Not Run.

## 1. First visit & locality
- [ ] App loads without error on mobile viewport
- [ ] User can select or confirm a supported locality
- [ ] Invalid / missing locality shows a clear recovery path (not a blank or wrong region)
- [ ] Default locality behaviour matches configuration (or safe fallback)

## 2. Discovery
- [ ] Search / browse returns only results that match the selected locality + explicit service area
- [ ] Empty / quiet locality shows honest messaging (no fabricated cards)
- [ ] Loading and error states are distinguishable from “zero results”

## 3. Need / offer detail
- [ ] Opening a result shows status, locality, and available evidence
- [ ] Returning to the list preserves context where intended

## 4. Create need (authenticated)
- [ ] Form validates required fields
- [ ] Invalid place or payload is rejected cleanly
- [ ] Successful creation appears in the expected locality

## 5. Authentication & private routes
- [ ] Signed-out user hitting a private route is sent to sign-in (no private data flash)
- [ ] Signed-in user can open their own private resources
- [ ] Signed-in user cannot open another user’s private resources by URL guessing

## 6. Conversations (if in scope)
- [ ] Only participants see the conversation
- [ ] Closed conversations reject new messages
- [ ] Unauthenticated access is denied

> Note: Treat full conversation isolation as **Not Proven** until disposable-DB evidence exists.

## 7. Accessibility & usability basics (mobile)
- [ ] Primary actions are tappable (adequate target size)
- [ ] Text remains readable; no critical overflow
- [ ] Focus / keyboard order is logical if tested
- [ ] Reduced-motion preference is respected where implemented

## 8. Error recovery
- [ ] Network / API failure shows a recoverable message, not a false empty state
- [ ] User can retry or navigate away cleanly

## Recording results
Post a short summary in issue #125 with:
- Device / browser / viewport
- Main SHA tested
- Pass / Fail / Blocked / Not Run for each section
- Any screenshots of failures (redact personal data)
