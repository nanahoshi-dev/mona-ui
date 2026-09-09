export interface MonaScrollViewMessages {
    readonly nextPage: string;
    readonly page: (current: number) => string;
    readonly pageOf: (current: number, total: number) => string;
    readonly previousPage: string;
    readonly scrollPagerLeft: string;
    readonly scrollPagerRight: string;
}
