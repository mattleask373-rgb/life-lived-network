# AI draft assistance — operational safety controls

**Status:** implementation support; does not authorize AI activation or production changes.

## Emergency feature stop

The paid draft-generation path checks the server-side environment variable `DRAFT_ASSIST_DISABLED` before it constructs the AI provider client or sends a model request.

To stop this feature:

1. Set `DRAFT_ASSIST_DISABLED=true` in the backend environment serving the app.
2. Apply the environment change using the hosting platform's normal controlled rollout/restart procedure.
3. Verify a draft request returns the calm paused message and confirm provider usage stops. Do not send real user prompts during the check; use a harmless test string.
4. Record the change and the observed rollout/verification. Restore normal operation only after the incident owner explicitly approves it; unset the flag or set it to `false` and use the same controlled rollout.

The comparison is case-insensitive and trims whitespace. Only the literal value `true` enables the stop. If the host requires a rebuild/redeploy to load environment variables, the change is not instantaneous; use an already-approved provider-level kill/budget control when a faster emergency stop is required.

## Per-attempt bounds in source

The current draft provider call sets these limits in code:

- **800 maximum output tokens** per generation attempt.
- **Zero SDK retries**, preventing automatic retry amplification for a single quota-approved attempt.
- **30-second total request timeout**.

The constants and their use are covered by a source-contract regression test. A timeout or token ceiling can still result in a failed/incomplete draft, which must remain an ordinary recoverable error rather than being saved or published automatically.

These are per-call safeguards only. They are not a provider-side billing cap, usage alert, distributed concurrency lease, or guarantee of a particular currency cost. The durable account quota is a separate control; provider-side budget/alert settings still require owner configuration and independent verification.

## What this control does — and does not — prove

- It prevents this app's draft endpoint from making a paid AI call when the flag is set and loaded by the running server.
- It is **not** an IP-abuse control or an instantly mutable hosted flag.
- It is not a provider-level spend cap or usage alert. Set those separately in the provider/hosting account after an authorized owner verifies the correct project and billing boundary.
- It does not gate any other AI feature or provider integration unless that path independently checks its own flag.
- It does not activate public “Ask this place” AI. That feature remains off until its record-backed context, citations, same-place isolation, prompt-injection test, rights/review attestations, retention/provider review, spend limits and approval requirements are met.

## Required follow-on for issue #290

The launch blocker remains open until a reviewed, durable rate-limit/usage boundary can atomically enforce the chosen per-account and concurrency quotas across instances, survive restarts, handle parallel/replayed requests, retain only minimal redacted telemetry, return safe retry semantics, and be tested against a confirmed disposable database or approved distributed limiter. Add provider spend alerts/budget caps and test the emergency stop separately. Do not substitute process-local counters for durable enforcement.

## Release safety

This change does not alter secrets, provider configuration, hosted data/schema/RLS/grants, or production hosting. No real prompts, account IDs or tokens belong in logs or test fixtures. Keep public AI and unattended production agents disabled until independent security review and the explicit human release gates are complete.
