export interface ColorInput {
    key: string;
    label: string;
    value: number | null;
    min: number;
    max: number;
    change: (value: number | null) => void;
}
