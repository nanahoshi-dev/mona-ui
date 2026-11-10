export interface ComponentMetadata {
    inputs: ComponentPropertyMetadata[];
    name: string;
    selector: string;
}

export interface ComponentPropertyMetadata {
    /** The name consumers bind, when the property is aliased. */
    alias?: string;
    defaultValue?: string;
    description: string;
    kind: string;
    name: string;
    /** The values of an input whose type is a union of string literals once its aliases are resolved. */
    options?: string[];
    required?: boolean;
    type: string;
}
