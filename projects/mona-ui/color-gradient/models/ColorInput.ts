export interface ColorInput {
    change: (value: number | null) => void;
    key: string;
    label: string;
    max: number;
    min: number;
    value: number | null;
}
