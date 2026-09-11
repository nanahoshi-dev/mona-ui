import type { MonaChipMessages } from "@nanahoshi/mona-ui/i18n";

export const CHIP_DEFAULT_MESSAGES = {
    removeLabel: (label?: string) => (label ? `Remove, ${label}` : "Remove, item")
} satisfies MonaChipMessages;


