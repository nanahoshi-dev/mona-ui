import { PreventableEvent } from "@nanahoshi/mona-ui/common";

/** The cancelable payload of the pager's `pageSizeSelect` event. */
export class PageSizeChangeEvent extends PreventableEvent {
    public readonly newPageSize: number;
    public readonly oldPageSize: number;
    public constructor(newPageSize: number, oldPageSize: number) {
        super("pageSizeSelect");
        this.newPageSize = newPageSize;
        this.oldPageSize = oldPageSize;
    }
}
