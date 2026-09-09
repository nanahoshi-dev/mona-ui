export interface MonaRatingMessages {
    readonly notRated: string;
    valueText(value: number, max: number): string;
}
