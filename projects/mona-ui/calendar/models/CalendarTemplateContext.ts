export interface DecadeCellTemplateContext {
    /**
     * @description The year interval of per decade.
     */
    $implicit: number;
}

export interface MonthCellTemplateContext {
    /**
     * @description The day of the month.
     */
    $implicit: number;

    /**
     * @description The date object representing the day.
     */
    date: Date;
}

export interface YearCellTemplateContext {
    /**
     * @description The month number (1–12) represented by this cell.
     */
    $implicit: number;

    /**
     * @description The text representation of the month.
     */
    text: string;
}
