export interface ComponentMetadata {
    name: string;
    selector: string;
    inputs: ComponentInputMetadata[];
}

export interface ComponentInputMetadata {
    description: string;
    kind: string;
    name: string;
    type: string;
}
