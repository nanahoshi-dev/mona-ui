import type { ComponentPropertyMetadata } from "../models/ComponentMetadata";
import { InputPropertyPipe } from "./input-type.pipe";

describe("InputTypePipe", () => {
    it("create an instance", () => {
        const pipe = new InputPropertyPipe();
        expect(pipe).toBeTruthy();
    });

    it("treats a Windows line ending as one break", () => {
        const inputs = [
            { name: "value", description: "First line\r\nsecond line.\r\n\r\nNew paragraph.\rLast line." }
        ] as ComponentPropertyMetadata[];

        expect(new InputPropertyPipe().transform(inputs, "value", "description")).toBe(
            "First line\nsecond line.\n\nNew paragraph.\nLast line."
        );
    });
});
