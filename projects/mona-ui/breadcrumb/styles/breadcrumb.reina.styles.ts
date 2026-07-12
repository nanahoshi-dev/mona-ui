import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    breadcrumbListVariants as monaBreadcrumbListVariants,
    breadcrumbListItemVariants as monaBreadcrumbListItemVariants,
    breadcrumbCurrentItemVariants as monaBreadcrumbCurrentItemVariants
} from "./breadcrumb.mona.styles";

export const reinaBreadcrumbListVariants = createInheritedVariants(monaBreadcrumbListVariants, {
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    }
});

export const reinaBreadcrumbListItemVariants = createInheritedVariants(monaBreadcrumbListItemVariants, {
    add: "text-foreground/50 font-medium rounded-md px-1.5 duration-150 ease-out hover:bg-primary/10 focus-visible:ring-primary/35",
    remove: "text-primary/70 rounded-sm px-1 focus-visible:ring-primary/40 duration-100 ease-in-out",
    compoundVariants: [
        {
            when: {
                disabled: true,
                listDisabled: false
            },
            add: "opacity-40",
            remove: "opacity-50"
        }
    ]
});

export const reinaBreadcrumbCurrentItemVariants = createInheritedVariants(monaBreadcrumbCurrentItemVariants, {
    add: "font-semibold",
    remove: "font-medium"
});
