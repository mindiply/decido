import type { DecisionError, Option } from "./common_types.js";
import { validateOptions } from "./shared_validations.js";

export interface DotVotingDefinition {
  question: string;
  options: Option[];
  nDotsPerParticipant: number;
}

export interface DotVoting {
  id: string;
  definition: DotVotingDefinition;
}

export interface DotVotingVote {
  id: string;
  voterId: string;
  dotsAssignment: Array<{ optionId: string; dots: number }>;
}

export type DotDecisionResults = DotOptionResult[];

export interface DotOptionResult {
  optionId: string;
  nDots: number;
  nVoters: number;
}

export function validateDotVotingDefinition(
  definition: DotVotingDefinition,
): null | DecisionError[] {
  const errors: DecisionError[] = [];
  if (definition.nDotsPerParticipant < 1) {
    errors.push({
      violationType: "definition",
      shortCode: "invalid_dots_number",
      message: "The number of dots must be at least 1",
    });
  }
  errors.push(...(validateOptions(definition.options) || []));
  return errors.length > 0 ? errors : null;
}

export function validateDotVotingVote(
  definition: DotVotingDefinition,
  vote: Omit<DotVotingVote, "id">,
): null | DecisionError[] {
  const errors: DecisionError[] = [];
  const optionsIds: Set<string> = new Set<string>(
    definition.options.map((option) => option.id),
  );
  let totalDotsInVote = 0;
  for (const optionAssignment of vote.dotsAssignment) {
    if (!optionsIds.has(optionAssignment.optionId)) {
      errors.push({
        violationType: "vote",
        shortCode: "invalid_option",
        message: `Vote for option ${optionAssignment.optionId} which is not a valid option`,
      });
    }
    if (optionAssignment.dots < 1) {
      errors.push({
        violationType: "vote",
        shortCode: "invalid_dots_number",
        message: `Vote by ${vote.voterId} has an invalid number of dots (${optionAssignment.dots}) for option ${optionAssignment.optionId}`,
      });
    } else {
      totalDotsInVote += optionAssignment.dots;
    }
  }
  if (totalDotsInVote < 1) {
    errors.push({
      violationType: "vote",
      shortCode: "no_dots_assigned",
      message: `Vote has no dots assigned`,
    });
  }
  if (totalDotsInVote > definition.nDotsPerParticipant) {
    errors.push({
      violationType: "vote",
      shortCode: "exceeds_dots_limit_in_vote",
      message: `Vote exceeds the allowed number of dots (${definition.nDotsPerParticipant})`,
    });
  }
  if (!vote.voterId || vote.voterId.trim() === "") {
    errors.push({
      violationType: "vote",
      shortCode: "invalid_voter_id",
      message: `Vote with invalid voter ID: "${vote.voterId}"`,
    });
  }
  return errors.length > 0 ? errors : null;
}

export async function calculateDotVotingResults(
  definition: DotVotingDefinition,
  votesIterable: AsyncIterable<DotVotingVote>,
): Promise<DotDecisionResults | DecisionError[]> {
  const definitionErrors = validateDotVotingDefinition(definition);
  if (definitionErrors) {
    return definitionErrors;
  }
  const votesIds: Set<string> = new Set<string>();
  const optionsIds: Set<string> = new Set<string>(
    definition.options.map((option) => option.id),
  );
  const errors: DecisionError[] = [];
  const dotsByVoterId: Map<string, number> = new Map();
  const optionDotCounts: Map<string, { nDots: number; nVoters: number }> =
    new Map();
  for await (const vote of votesIterable) {
    let hasVoteError = false;
    if (votesIds.has(vote.id)) {
      errors.push({
        violationType: "vote",
        shortCode: "duplicate_vote_id",
        message: `Vote with ID ${vote.id} is a duplicate`,
      });
      hasVoteError = true;
    }
    votesIds.add(vote.id);
    let totalDotsInVote = 0;
    for (const optionAssignment of vote.dotsAssignment) {
      if (!optionsIds.has(optionAssignment.optionId)) {
        errors.push({
          violationType: "vote",
          shortCode: "invalid_option",
          message: `Vote for option ${optionAssignment.optionId} which is not a valid option`,
        });
        hasVoteError = true;
      }
      if (optionAssignment.dots < 1) {
        errors.push({
          violationType: "vote",
          shortCode: "invalid_dots_number",
          message: `Vote by ${vote.voterId} has an invalid number of dots (${optionAssignment.dots}) for option ${optionAssignment.optionId}`,
        });
        hasVoteError = true;
      } else {
        totalDotsInVote += optionAssignment.dots;
      }
      const voteRes = optionDotCounts.get(optionAssignment.optionId) || {
        nDots: 0,
        nVoters: 0,
      };
      voteRes.nDots += optionAssignment.dots;
      voteRes.nVoters += 1;
      optionDotCounts.set(optionAssignment.optionId, voteRes);
    }
    if (totalDotsInVote < 1) {
      errors.push({
        violationType: "vote",
        shortCode: "no_dots_assigned",
        message: `Vote with ID ${vote.id} has no dots assigned`,
      });
      hasVoteError = true;
    }
    if (totalDotsInVote > definition.nDotsPerParticipant) {
      errors.push({
        violationType: "vote",
        shortCode: "exceeds_dots_limit_in_vote",
        message: `Vote with ID ${vote.id} exceeds the allowed number of dots (${definition.nDotsPerParticipant})`,
      });
      hasVoteError = true;
    }
    if (!vote.voterId || vote.voterId.trim() === "") {
      errors.push({
        violationType: "vote",
        shortCode: "invalid_voter_id",
        message: `Vote with ID ${vote.id}: Vote with invalid voter ID: "${vote.voterId}"`,
      });
      hasVoteError = true;
    }
    if (hasVoteError) {
      continue;
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  return definition.options
    .map((option) => {
      const counts = optionDotCounts.get(option.id) || {
        nDots: 0,
        nVoters: 0,
      };
      return {
        optionId: option.id,
        nDots: counts.nDots,
        nVoters: counts.nVoters,
      };
    })
    .sort((a, b) => {
      if (b.nDots === a.nDots) {
        return b.nVoters - a.nVoters;
      }
      return b.nDots - a.nDots;
    });
}
