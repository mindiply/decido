import type { DecisionError, Option } from "./common_types.js";

export function validateOptions(options: Option[]): null | DecisionError[] {
  const errors: DecisionError[] = [];
  const optionsTexts = new Set<string>();
  const optionIds = new Set<string>();

  if (options.length < 2) {
    errors.push({
      violationType: "definition",
      shortCode: "not_enough_options",
      message: "There must be at least 2 options to vote on",
    });
  }

  for (const [index, option] of options.entries()) {
    if (optionIds.has(option.id)) {
      errors.push({
        violationType: "definition",
        shortCode: "duplicate_option_ids",
        message: `Option # ${index + 1} Option IDs must be unique`,
      });
    }
    optionIds.add(option.id);
    if (!option.text || option.text.trim() === "") {
      errors.push({
        violationType: "definition",
        shortCode: "empty_option_text",
        message: `Option # ${index + 1}: text must not be empty`,
      });
    }
    if (optionsTexts.has(option.text.toLowerCase())) {
      errors.push({
        violationType: "definition",
        shortCode: "definition:duplicate_option",
        message: `Option # ${index + 1}: option text is the same as a previous one`,
      });
    }
    optionsTexts.add(option.text.toLowerCase());
  }
  return errors.length > 0 ? errors : null;
}
