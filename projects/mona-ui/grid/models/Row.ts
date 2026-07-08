import { v4 } from "uuid";

export class Row {
    public readonly data: Record<PropertyKey, unknown>;
    public readonly uid: string;
    public constructor(data: Record<PropertyKey, unknown>, uid = v4()) {
        this.data = data;
        this.uid = uid;
    }
}
