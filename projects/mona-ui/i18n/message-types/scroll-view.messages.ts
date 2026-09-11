export interface MonaScrollViewMessages {
    readonly carousel: string;
    readonly nextPage: string;
    readonly page: (current: number) => string;
    readonly pageOf: (current: number, total: number) => string;
    readonly previousPage: string;
    readonly scrollPagerPrevious: string;
    readonly scrollPagerNext: string;
    readonly slide: string;
}
