import { Pipe, PipeTransform } from "@angular/core";
import { SortDirection } from "../../query/sort/SortDescriptor";

@Pipe({
    name: "columnAriaSort"
})
export class ColumnAriaSortPipe implements PipeTransform {
    public transform(dir: SortDirection | null): unknown {
        if (dir === "asc") {
            return "ascending";
        }
        if (dir === "desc") {
            return "descending";
        }
        return "none";
    }
}
