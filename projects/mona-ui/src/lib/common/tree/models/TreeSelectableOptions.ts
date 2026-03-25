export type TreeSelectableOptions = {
    childrenOnly: boolean;
    enabled: boolean;
} & ({ mode: "single"; toggleable?: boolean } | { mode: "multiple" });
