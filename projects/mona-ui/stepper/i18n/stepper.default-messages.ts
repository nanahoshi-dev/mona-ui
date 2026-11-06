// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaStepperMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const STEPPER_DEFAULT_MESSAGES: MonaStepperMessages = {
    stepCompleted: "Completed",
    stepInvalid: "Has errors",
    stepPosition: (current: number, total: number) => `Step ${localizeNumber(current)} of ${localizeNumber(total)}`,
    stepProgress: "Step progress",
    stepper: "Progress"
};
