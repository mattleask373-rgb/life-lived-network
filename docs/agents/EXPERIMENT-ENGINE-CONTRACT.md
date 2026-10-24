# Experiment Engine Contract

**Status:** bounded provider-neutral contract for AI-NATIVE-03.

The Experiment Engine represents hypotheses, bounded experiment plans, results and learning records. It does **not** execute experiments.

## Lifecycle

UNKNOWN / UNCERTAINTY -> HYPOTHESIS -> EXPERIMENT PLAN -> BOUNDED TASK -> RESULT -> EVALUATION -> LEARNING -> PROGRAMME STATE UPDATE.

## Epistemic rules

- a hypothesis is a proposition, not a fact;
- REAL cannot be used to silently promote a hypothesis into truth;
- evidence and epistemic classification are explicit;
- UNKNOWN remains unknown until evidence justifies a different class;
- inconclusive and falsified outcomes preserve uncertainty;
- REAL results require evidence;
- a supported result must contain observations, evidence and a non-UNKNOWN epistemic class;
- learning with UNKNOWN cannot carry positive confidence.

## Safety

- irreversible, high-risk and critical experiments require human gates;
- high/critical work cannot be silently assigned to autonomous AI;
- the module has no provider, agent, persistence, schema, RLS, auth, merge or deployment authority;
- no matcher, ranker, recommender or discovery authority is introduced;
- a state update is a returned record, not a mutation.

## Integration boundary

ProgrammeState remains the state authority. The existing control plane remains the execution authority. A later bounded adapter may convert accepted experiments into ordinary tasks; this module does not do so.
