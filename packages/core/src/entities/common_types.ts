export interface Option {
  id: string;
  text: string;
}

export interface DecisionError {
  readonly violationType: "definition" | "vote";
  readonly shortCode: string;
  readonly message: string;
}
