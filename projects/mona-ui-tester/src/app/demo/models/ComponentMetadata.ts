export interface ComponentMetadata {
    name: string;
    inputs: ComponentPropertyMetadata[];
    selector: string;
}

export interface ComponentPropertyMetadata {
    defaultValue?: string;
    description: string;
    kind: string;
    name: string;
    required?: boolean;
    type: string;
}
