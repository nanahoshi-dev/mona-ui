export interface PagerSettings {
    enabled: boolean;
    firstLast: boolean;
    pageSizeValues: number[] | boolean;
    previousNext: boolean;
    showInfo: boolean;
    type: "numeric" | "input";
    visiblePages: number;
}
