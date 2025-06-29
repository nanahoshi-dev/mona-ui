export interface ComponentMetadata {
    name: string;
    inputs: ComponentPropertyMetadata[];
    selector: string;
}

export interface ComponentPropertyMetadata {
    description: string;
    kind: string;
    name: string;
    type: string;
}
