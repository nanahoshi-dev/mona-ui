import { type MonaTextDirection } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import { sidebarLayoutBaseThemeVariants } from "../styles/sidebar.styles";

export function resolveSidebarLayoutReverse(options: {
    semanticDirection: MonaTextDirection;
    browserCssDirection?: "ltr" | "rtl" | null;
}): boolean {
    const effectiveDirection = options.browserCssDirection ?? options.semanticDirection;
    return effectiveDirection === "rtl";
}

export function resolveSidebarLayoutBaseClass(options: {
    semanticDirection: MonaTextDirection;
    browserCssDirection?: "ltr" | "rtl" | null;
    userClass?: string;
}): string {
    const reverse = resolveSidebarLayoutReverse(options);
    return twMerge(sidebarLayoutBaseThemeVariants({ reverse }), options.userClass ?? "");
}
