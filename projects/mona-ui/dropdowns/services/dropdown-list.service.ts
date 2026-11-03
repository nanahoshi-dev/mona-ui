import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import type { ListItem } from "@nanahoshi/mona-ui/internal/list";

@Injectable()
export class DropdownListService<TData = unknown> {
    public readonly navigate$ = new Subject<{ item: ListItem<TData> }>();
}
