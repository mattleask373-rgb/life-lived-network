<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Agent Operating System

See **`docs/agents/`** for the durable Phase 4/5 control plane:

- Task lifecycle & state machine
- Claim / lease / heartbeat protocol
- Required handoff format
- Specialist lanes
- Hard invariants (automatic failure conditions)
- Observability & status

Architecture Decision Records live in **`docs/adr/`**.

**Canonical possibility engine:** `src/lib/supply-engine.ts` — do not create a second one.

**No autonomous merge to main. No force-push. Independent review required.**
