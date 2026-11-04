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
    required?: boolean;
    type: string;
}
