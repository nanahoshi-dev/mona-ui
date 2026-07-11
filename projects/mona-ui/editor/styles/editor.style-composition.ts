import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { EditorStyleOverrides } from "./editor.types";

export function createEditorVariants(
    base: () => string,
    overrides: readonly EditorStyleOverrides[],
    theme: ThemeStyle,
    select: (override: EditorStyleOverrides) => ClassValue | undefined
): () => string {
    const activeOverrideClasses = overrides
        .filter(override => override.theme === undefined || override.theme === theme)
        .map(select)
        .filter((override): override is ClassValue => override !== undefined);

    return () => twMerge(cx(base(), ...activeOverrideClasses));
}
