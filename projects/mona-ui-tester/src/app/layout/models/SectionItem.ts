import type { Signal } from "@angular/core";

export interface SectionItem {
    depth: Signal<number>;
    header: Signal<string>;
    id: Signal<string>;
    parentId: Signal<string | null>;
}
