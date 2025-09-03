export type { Option, DecisionError } from "./entities/common_types.js";

// Dot voting exports
export {
  validateDotVotingDefinition,
  validateDotVotingVote,
  calculateDotVotingResults,
} from "./entities/dot_voting.js";
export type {
  DotVoting,
  DotVotingDefinition,
  DotVotingVote,
  DotDecisionResults,
  DotOptionResult,
} from "./entities/dot_voting.js";


// Rank voting exports
export {
  validateRankVotingDefinition,
  calculateRankVotingResults,
} from "./entities/rank_voting.js";
export type {
  RankVoting,
  RankVotingDefinition,
  RankVotingVote,
  RankDecisionResults,
  RankOptionResult,
} from "./entities/rank_voting.js";

export {
  calculateSingleVotingResults,
  validateSingleVotingDefinition
} from './entities/single_voting.js';
export type {
  SingleVotingDefinition,
  SingleVote,
  SingleVoting,
  SingleVotingResults,
  SingleVotingOptionResult,
} from './entities/single_voting.js';
