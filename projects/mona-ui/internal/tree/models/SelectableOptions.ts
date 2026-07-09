export type SelectableOptions = {
    /**
     * @description Determines if the selection functionality is active.
     */
    enabled: boolean;

    /**
     * @description Determines whether only the children of the node should be selectable.
     */
    childrenOnly: boolean;
} & (SingleSelectionConfig | MultipleSelectionConfig);

interface SingleSelectionConfig {
    /**
     * @description Allows only one item to be selected at a time.
     */
    mode: "single";

    /**
     * @description Determines if clicking an already selected item will deselect it.
     */
    toggleable?: boolean;
}

interface MultipleSelectionConfig {
    /**
     * @description Allows multiple items to be selected simultaneously.
     */
    mode: "multiple";
}
