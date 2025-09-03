import type {
  DotDecisionProvider,
  DotDecisionVotesProvider,
} from "./data_providers.js";
import type { DotDecision, DotVote, DotVoteInfo } from "./entities.js";

export interface DotDecisionStore extends DotDecisionProvider {
  storeNewDotVoting: (
    info: Omit<DotDecisionProvider, "id">,
  ) => Promise<DotDecision | Error>;
}

export interface DotDecisionVotesStore extends DotDecisionVotesProvider {
  storeNewVote: (
    decisionId: string,
    voteInfo: DotVoteInfo,
  ) => Promise<DotVote | Error>;
}
