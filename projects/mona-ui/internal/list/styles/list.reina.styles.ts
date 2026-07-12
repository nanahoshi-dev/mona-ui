import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    listVariants as monaListVariants,
    listInnerListVariants as monaListInnerListVariants,
    listGroupHeaderVariants as monaListGroupHeaderVariants,
    listGroupHeaderTextVariants as monaListGroupHeaderTextVariants,
    listItemBaseVariants as monaListItemBaseVariants,
    listItemContentVariants as monaListItemContentVariants
} from "./list.mona.styles";

export const reinaListVariants = createInheritedVariants(monaListVariants, {});

export const reinaListInnerListVariants = createInheritedVariants(monaListInnerListVariants, {});

export const reinaListGroupHeaderVariants = createInheritedVariants(monaListGroupHeaderVariants, {
    variants: {
        hasTemplate: {
            false: {
                add: "font-semibold",
                remove: "font-bold"
            }
        }
    }
});

export const reinaListGroupHeaderTextVariants = createInheritedVariants(monaListGroupHeaderTextVariants, {
    variants: {
        hasTemplate: {
            false: {
                add: "font-semibold tracking-tight text-foreground/60",
                remove: "font-bold"
            }
        }
    }
});

export const reinaListItemBaseVariants = createInheritedVariants(monaListItemBaseVariants, {});

export const reinaListItemContentVariants = createInheritedVariants(monaListItemContentVariants, {
    add: "rounded-md transition-colors ease-out duration-150",
    variants: {
        highlighted: {
            true: {
                add: "inset-ring-primary/40",
                remove: "rounded-none inset-ring-border-control-hover"
            }
        },
        selected: {
            true: {
                add: "inset-ring-primary-foreground/35",
                remove: "inset-ring-primary-foreground/40"
            }
        },
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    },
    compoundVariants: [
        {
            when: {
                selected: true,
                checkboxes: false
            },
            add: "inset-ring-primary-foreground/35",
            remove: "rounded-none inset-ring-primary-foreground/40"
        },
        {
            when: {
                highlighted: true,
                selected: true,
                checkboxes: false
            },
            add: "inset-ring-primary-foreground/35",
            remove: "rounded-none inset-ring-primary-foreground/40"
        }
    ]
});
