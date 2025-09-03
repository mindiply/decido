import type { DotDecision, DotVote } from "./entities.js";

export interface DotDecisionProvider {
  getDotVotingById: (id: string) => Promise<DotDecision | null>;
}

export interface DotDecisionVotesProvider {
  getVotesForDotVote: (decisionId: string) => Promise<DotVote[]>;
  getVotesForDotVoteAndVoterId: (
    decisionId: string,
    voterId: string,
  ) => Promise<DotVote[]>;
}
