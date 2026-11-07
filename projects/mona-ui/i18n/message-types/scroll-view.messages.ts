export interface MonaScrollViewMessages {
    readonly carousel: string;
    readonly nextPage: string;
    readonly page: (current: number) => string;
    readonly pageOf: (current: number, total: number) => string;
    readonly pages: string;
    readonly previousPage: string;
    readonly scrollPagerNext: string;
    readonly scrollPagerPrevious: string;
    readonly slide: string;
}
