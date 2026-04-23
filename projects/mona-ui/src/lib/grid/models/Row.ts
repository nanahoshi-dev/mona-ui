import { v4 } from "uuid";

export class Row {
    public readonly data: Record<PropertyKey, unknown>;
    public readonly uid = v4();
    public constructor(data: Record<PropertyKey, unknown>) {
        this.data = data;
    }
}
