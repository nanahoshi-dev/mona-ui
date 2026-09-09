export interface MonaPagerMessages {
    readonly firstPageLabel: string;

    jumpBackwardLabel(pages: number): string;
    jumpForwardLabel(pages: number): string;

    readonly lastPageLabel: string;
    readonly nextPageLabel: string;
    readonly ofText: string;

    pageLabel(page: number): string;
    pageSizeLabel(pageSize: number): string;

    readonly pageText: string;
    readonly previousPageLabel: string;

    rangeLabel(start: number, end: number, total: number): string;
}
