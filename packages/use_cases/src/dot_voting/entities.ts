import type { DotVotingVote, DotVoting } from "@decido/core";

// These re-exports are here to facilitate separating the use-cases humble object
// types from the entities types.
// We are trying to strike a balance between DRY and false duplication. It is possible
// that the entities in use case will be more bloated than the core entities over time.
// At the moment, if core updates, so does the use_cases package.
export interface DotVote extends DotVotingVote {
  when: Date;
}
export type DotVoteInfo = Omit<DotVote, "id">;

export type DotDecision = DotVoting;
export type DotDecisionInfo = Omit<DotDecision, "id">;
