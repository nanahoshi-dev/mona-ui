import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ListItem } from "@nanahoshi/mona-ui/internal/list";

@Injectable()
export class DropdownListService {
    public readonly navigate$ = new Subject<{ item: ListItem<any> }>();
}
