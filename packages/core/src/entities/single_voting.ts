import type { DecisionError, Option } from "./common_types.js";
import { validateOptions } from "./shared_validations.js";

export interface SingleVotingDefinition {
  question: string;
  options: Option[];
}

export interface SingleVoting {
  id: string;
  definition: SingleVotingDefinition;
}

export interface SingleVote {
  optionId: string;
  voterId: string;
}

export interface SingleVotingOptionResult {
  optionId: string;
  nVotes: number;
}

export type SingleVotingResults = SingleVotingOptionResult[];

export function validateSingleVotingDefinition(
  definition: SingleVotingDefinition,
): null | DecisionError[] {
  const errors: DecisionError[] = [];
  if (!definition.question || definition.question.trim() === "") {
    errors.push({
      violationType: "definition",
      shortCode: "empty_question",
      message: "The question must not be empty",
    });
  }
  errors.push(...(validateOptions(definition.options) || []));
  return errors.length > 0 ? errors : null;
}

export async function calculateSingleVotingResults(
  definition: SingleVotingDefinition,
  votesIterable: AsyncIterable<SingleVote>,
): Promise<SingleVotingResults | DecisionError[]> {
  const definitionErrors = validateSingleVotingDefinition(definition);
  if (definitionErrors) {
    return definitionErrors;
  }
  const votesIds: Set<string> = new Set<string>();
  const optionsIds: Set<string> = new Set<string>(
    definition.options.map((option) => option.id),
  );
  const errors: DecisionError[] = [];
  const votesByOptionId: Map<string, number> = new Map(
    definition.options.map((option) => [option.id, 0]),
  );
  for await (const vote of votesIterable) {
    let hasVoteError = false;
    if (votesIds.has(vote.voterId)) {
      errors.push({
        violationType: "vote",
        shortCode: "duplicate_vote",
        message: `Voter ${vote.voterId} has already voted`,
      });
      hasVoteError = true;
    }
    votesIds.add(vote.voterId);
    if (!optionsIds.has(vote.optionId)) {
      errors.push({
        violationType: "vote",
        shortCode: "invalid_option",
        message: `Vote by voter ${vote.voterId} has an invalid option ID ${vote.optionId}`,
      });
      hasVoteError = true;
    }
    if (!hasVoteError) {
      votesByOptionId.set(
        vote.optionId,
        (votesByOptionId.get(vote.optionId) || 0) + 1,
      );
    }
  }
  if (errors.length > 0) {
    return errors;
  }
  return Array.from(votesByOptionId.entries())
    .map(([optionId, nVotes]) => ({ optionId, nVotes }))
    .sort(
      (a, b) => b.nVotes - a.nVotes || a.optionId.localeCompare(b.optionId),
    );
}
