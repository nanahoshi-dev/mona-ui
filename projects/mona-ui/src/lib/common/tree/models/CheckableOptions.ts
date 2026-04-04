export interface CheckableOptions {
    /**
     * @description Determines whether checking a node should also check its children.
     * Only applicable when `mode` is set to `multiple`.
     */
    checkChildren?: boolean;

    /**
     * @description Determines whether checking a node should also check its disabled children.
     * Only applicable when `mode` is set to `multiple`.
     */
    checkDisabledChildren?: boolean;

    /**
     * @description Determines whether checking a node should also check its parents.
     * Only applicable when `mode` is set to `multiple`.
     */
    checkParents?: boolean;

    /**
     * @description Determines whether only the children of the node should be checkable.
     */
    childrenOnly?: boolean;

    /**
     * @description Determines if the checkboxes are enabled.
     */
    enabled?: boolean;

    /**
     * @description Specifies the check mode.
     */
    mode?: "multiple" | "single";
}
