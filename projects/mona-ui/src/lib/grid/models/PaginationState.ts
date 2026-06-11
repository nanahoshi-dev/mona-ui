import type { Signal } from "@angular/core";

export interface PaginationState {
    readonly page: number;
    readonly skip: number;
    readonly take: number;
}
