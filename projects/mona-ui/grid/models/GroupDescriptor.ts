import type { SortDirection } from "@nanahoshi/mona-ui/query";

export interface GroupDescriptor {
    dir?: SortDirection;
    field: string;
}
