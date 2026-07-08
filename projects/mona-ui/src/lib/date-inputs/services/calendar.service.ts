import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { PreventableEvent } from "@mirei/mona-ui/common";

@Injectable()
export class CalendarService {
    public readonly keydown$ = new Subject<PreventableEvent<KeyboardEvent>>();
}
