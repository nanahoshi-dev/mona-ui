import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    switchVariants as monaSwitchVariants,
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants
} from "./switch.mona.styles";

export const reinaSwitchVariants = createInheritedVariants(monaSwitchVariants, {
    add: "transition-colors duration-150 ease-out focus-within:ring-primary/35 data-[disabled='true']:opacity-40 data-[active='true']:border-primary data-[invalid='true']:ring-error/35",
    remove: "transition-[background] focus-within:ring-primary/40 data-[disabled='true']:opacity-50 [&.ng-touched.ng-invalid]:border-error data-[invalid='true']:ring-error/40",
    variants: {
        rounded: {
            large: {
                remove: "rounded-lg"
            },
            medium: {
                remove: "rounded-md"
            },
            small: {
                remove: "rounded-sm"
            }
        }
    },
    defaultVariants: {
        size: "medium"
    },
    compoundVariants: [
        {
            when: {
                rounded: "small",
                size: "small"
            },
            add: "rounded-sm"
        },
        {
            when: {
                rounded: "medium",
                size: "small"
            },
            add: "rounded"
        },
        {
            when: {
                rounded: "large",
                size: "small"
            },
            add: "rounded-md"
        },
        {
            when: {
                rounded: "small",
                size: "medium"
            },
            add: "rounded"
        },
        {
            when: {
                rounded: "medium",
                size: "medium"
            },
            add: "rounded-md"
        },
        {
            when: {
                rounded: "large",
                size: "medium"
            },
            add: "rounded-lg"
        },
        {
            when: {
                rounded: "small",
                size: "large"
            },
            add: "rounded-md"
        },
        {
            when: {
                rounded: "medium",
                size: "large"
            },
            add: "rounded-lg"
        },
        {
            when: {
                rounded: "large",
                size: "large"
            },
            add: "rounded-xl"
        }
    ]
});

export const reinaSwitchHandleVariants = createInheritedVariants(monaSwitchHandleVariants, {
    add: "transition-[left,box-shadow] ease-out bg-background shadow-sm data-[active='true']:shadow-md",
    remove: "transition-[left,background] ease-in-out border border-border bg-secondary data-[active='true']:bg-background",
    variants: {
        rounded: {
            large: {
                remove: "rounded-lg"
            },
            medium: {
                remove: "rounded-md"
            },
            small: {
                remove: "rounded-sm"
            }
        }
    },
    defaultVariants: {
        size: "medium"
    },
    compoundVariants: [
        {
            when: {
                rounded: "small",
                size: "small"
            },
            add: "rounded-sm"
        },
        {
            when: {
                rounded: "medium",
                size: "small"
            },
            add: "rounded"
        },
        {
            when: {
                rounded: "large",
                size: "small"
            },
            add: "rounded-md"
        },
        {
            when: {
                rounded: "small",
                size: "medium"
            },
            add: "rounded"
        },
        {
            when: {
                rounded: "medium",
                size: "medium"
            },
            add: "rounded-md"
        },
        {
            when: {
                rounded: "large",
                size: "medium"
            },
            add: "rounded-lg"
        },
        {
            when: {
                rounded: "small",
                size: "large"
            },
            add: "rounded-md"
        },
        {
            when: {
                rounded: "medium",
                size: "large"
            },
            add: "rounded-lg"
        },
        {
            when: {
                rounded: "large",
                size: "large"
            },
            add: "rounded-[0.625rem]"
        }
    ]
});

export const reinaSwitchLabelVariants = createInheritedVariants(monaSwitchLabelVariants, {
    add: "font-medium tracking-tight"
});
