export interface PagerSettings {
    enabled: boolean;
    firstLast: boolean;
    pageSize: number;
    pageSizeValues: number[] | boolean;
    previousNext: boolean;
    showInfo: boolean;
    type: "numeric" | "input";
    visiblePages: number;
}
