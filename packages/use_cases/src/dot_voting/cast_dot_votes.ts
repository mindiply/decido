import { validateDotVotingVote } from "@decido/core";
import type { DotVote, DotVoteInfo } from "./entities.js";
import type { DotDecisionProvider } from "./data_providers.js";
import type { DotDecisionVotesStore } from "./data_stores.js";

export interface CastDotVoteService {
  (decisionId: string, dotVoteInfo: DotVoteInfo): Promise<DotVote | Error>;
}

export function createCastDotVoteService(deps: {
  dotDecisionProvider: DotDecisionProvider;
  dotDecisionVotesStore: DotDecisionVotesStore;
}): CastDotVoteService {
  return async function (decisionId, dotVoteInfo) {
    const decision =
      await deps.dotDecisionProvider.getDotVotingById(decisionId);
    if (!decision) {
      return new Error(`Decision id not found: ${decisionId}`);
    }
    const voteErrors = validateDotVotingVote(decision.definition, dotVoteInfo);
    if (voteErrors) {
      return new Error(
        `Could not validate voting voter: ${voteErrors.map((e) => `- ${e.message}`).join("\n")}`,
      );
    }
    const voterVotes =
      await deps.dotDecisionVotesStore.getVotesForDotVoteAndVoterId(
        decisionId,
        dotVoteInfo.voterId,
      );
    if (voterVotes && voterVotes.length > 0) {
      return new Error("Voter has already voted");
    }
    const newVote = await deps.dotDecisionVotesStore.storeNewVote(
      decisionId,
      dotVoteInfo,
    );
    if (newVote instanceof Error) {
      return new Error(`Unable to store the new vote: ${newVote.message}`);
    }
    return newVote;
  };
}
