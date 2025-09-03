import type { DecisionError, Option } from "./common_types.js";
import { validateOptions } from "./shared_validations.js";

export interface RankVotingDefinition {
  question: string;
  options: Option[];
}

export interface RankVoting {
  id: string;
  definition: RankVotingDefinition;
}

export interface RankVotingVote {
  id: string;
  voterId: string;
  optionsIdsRanked: string[]; // First is highest rank
}

export interface RankOptionResult {
  optionId: string;
  totalRankScore: number; // Lower is better
}

export type RankDecisionResults = RankOptionResult[];

/**
 * Validates a RankVoting definition.
 * Ensures the question is non-empty and options are valid.
 * Returns null if valid, or an array of DecisionErrors if invalid.
 */

export function validateRankVotingDefinition(
  definition: RankVotingDefinition): null | DecisionError[] {
  const errors: DecisionError[] = [];
  if (!definition.question || definition.question.trim() === "") {
    errors.push({
      violationType: "definition",
      shortCode: "empty_question",
      message: "The question must not be empty",
    })
  }
  errors.push(...(validateOptions(definition.options) || []));
  return errors.length > 0 ? errors : null;
}

export async function calculateRankVotingResults(
  definition: RankVotingDefinition,
  votesIterable: AsyncIterable<RankVotingVote>,
): Promise<RankDecisionResults | DecisionError[]> {
  const definitionErrors = validateRankVotingDefinition(definition);
  if (definitionErrors) {
    return definitionErrors;
  }
  const votesIds: Set<string> = new Set<string>();
  const optionsIds: Set<string> = new Set<string>(
    definition.options.map((option) => option.id),
  );
  const errors: DecisionError[] = [];
  const rankScoresByOptionId: Map<string, number> = new Map(
    definition.options.map((option) => [option.id, 0]),
  );
  for await (const vote of votesIterable) {
    let hasVoteError = false;
    if (votesIds.has(vote.id)) {
      errors.push({
        violationType: "vote",
        shortCode: "duplicate_vote_id",
        message: `Duplicate vote ID: ${vote.id}`,
      });
      hasVoteError = true;
    }
    votesIds.add(vote.id);
    const seenOptionIdsInVote: Set<string> = new Set<string>();
    for (const [rankIndex, optionId] of vote.optionsIdsRanked.entries()) {
      if (!optionsIds.has(optionId)) {
        errors.push({
          violationType: "vote",
          shortCode: "invalid_option_id",
          message: `Vote ${vote.id} contains invalid option ID: ${optionId}`,
        });
        hasVoteError = true;
        continue;
      }
      if (seenOptionIdsInVote.has(optionId)) {
        errors.push({
          violationType: "vote",
          shortCode: "duplicate_option_in_vote",
          message: `Vote ${vote.id} contains duplicate option ID: ${optionId}`,
        });
        hasVoteError = true;
        continue;
      }
      seenOptionIdsInVote.add(optionId);
      const currentScore = rankScoresByOptionId.get(optionId) || 0;
      rankScoresByOptionId.set(optionId, currentScore + rankIndex + 1);
    }
    // Check for missing options in the vote
    if (seenOptionIdsInVote.size < optionsIds.size) {
      const missingOptions = Array.from(optionsIds).filter(
        (id) => !seenOptionIdsInVote.has(id),
      );
      errors.push({
        violationType: "vote",
        shortCode: "missing_options_in_vote",
        message: `Vote ${vote.id} is missing options: ${missingOptions.join(", ")}`,
      });
      hasVoteError = true;
    }
    if (!vote.voterId || vote.voterId.trim() === "") {
      errors.push({
        violationType: "vote",
        shortCode: "invalid_voter_id",
        message: `Vote with ID ${vote.id} has an invalid voter ID: "${vote.voterId}"`,
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
  const results: RankDecisionResults = Array.from(
    rankScoresByOptionId.entries(),
  ).map(([optionId, totalRankScore]) => ({
    optionId,
    totalRankScore,
  }));
  results.sort((a, b) => a.totalRankScore - b.totalRankScore);
  return results;
}
