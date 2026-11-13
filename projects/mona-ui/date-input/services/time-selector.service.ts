import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
@Injectable()
export class TimeSelectorService {
    public readonly keydown$ = new Subject<PreventableEvent<KeyboardEvent>>();
}
