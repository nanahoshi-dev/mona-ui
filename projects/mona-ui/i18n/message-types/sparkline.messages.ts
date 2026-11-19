export interface MonaSparklineMessages {
    /** Read in place of a summary when a sparkline has no values. */
    readonly noData: string;

    /**
     * Summarizes a sparkline's values, formatted already: how many there are, the first, the last, the lowest and the
     * highest ("12 values, first 6, last 15, lowest 4, highest 18").
     */
    summary(count: number, first: string, last: string, min: string, max: string): string;

    /** Summarizes a win-loss sparkline: how many wins, losses and draws it shows ("7 wins, 3 losses, 1 draw"). */
    winLossSummary(wins: number, losses: number, draws: number): string;
}
