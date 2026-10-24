# ChatGPT Day 2.5 — Reality Delta Adversarial Note

Issue #89 tracks an adversarial audit of Reality Delta composition semantics.

Key finding: compareRealitySnapshots currently emits UNKNOWN for an unchanged non-UNKNOWN snapshot. Downstream composition must distinguish current reality epistemic state from the absence of new delta evidence.

Second finding: comparison currently emits low risk, reversible true, and no human gate. This is safe only if those fields are explicitly treated as non-authoritative observation metadata; otherwise downstream composition could inherit an understated risk signal.

Third finding: evidence identity uses source + id for comparison while snapshot validation requires ids to be unique. This needs clarification before provenance becomes a shared composition invariant.

Fourth finding: observedAt/freshness are represented but not interpreted by comparison. Epistemic class must not be treated as freshness.

Next experiment: add these cases to the cross-kernel compatibility test matrix before changing production contracts.
