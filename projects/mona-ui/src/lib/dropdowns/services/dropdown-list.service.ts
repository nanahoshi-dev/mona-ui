import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ListItem } from "../../common/list/models/ListItem";

@Injectable()
export class DropdownListService {
    public readonly navigate$ = new Subject<{ item: ListItem<any> }>();
}
