import type {
  DotDecisionVotesStore,
  DotDecisionProvider,
  DotDecision,
  DotVote,
} from "@decido/use_cases";

export function createInMemoryDotDecisionDataAccess(): {
  dotDecisionProvider: DotDecisionProvider;
  dotDecisionVotesStore: DotDecisionVotesStore;
} {
  const decisionsMap: Map<string, DotDecision> = new Map();
  const votesMap: Map<string, DotVote[]> = new Map();

  let voteIdCounter = 0;
  const dotDecisionProvider: DotDecisionProvider = {
    getDotVotingById: async (id: string): Promise<DotDecision | null> => {
      const decision = decisionsMap.get(id) || createDotDecisionWithId(id);
      decisionsMap.set(decision.id, decision);
      votesMap.set(id, []);
      return decisionsMap.get(id) ?? null;
    },
  };

  const dotDecisionVotesStore: DotDecisionVotesStore = {
    getVotesForDotVote: async (decisionId) => {
      return votesMap.get(decisionId) ?? [];
    },
    getVotesForDotVoteAndVoterId: async (decisionId: string, voterId) => {
      return (votesMap.get(decisionId) ?? []).filter(
        (vote) => vote.voterId === voterId,
      );
    },
    storeNewVote: async (decisionId, voteInfo) => {
      const decision = decisionsMap.get(decisionId);
      if (!decision) {
        return new Error(`Decision with ID ${decisionId} not found`);
      }
      const newVote: DotVote = {
        id: `vote-${++voteIdCounter}`,
        voterId: voteInfo.voterId,
        dotsAssignment: voteInfo.dotsAssignment,
        when: voteInfo.when,
      };
      const votes = votesMap.get(decisionId) || [];
      votes.push(newVote);
      votesMap.set(decisionId, votes);
      return newVote;
    },
  };

  return {
    dotDecisionProvider,
    dotDecisionVotesStore,
  };
}

function createDotDecisionWithId(id: string): DotDecision {
  return {
    id,
    definition: {
      question: "Sample question",
      options: [
        {
          id: "option1",
          text: "Option 1",
        },
        {
          id: "option2",
          text: "Option 2",
        },
      ],
      nDotsPerParticipant: 2,
    },
  };
}
