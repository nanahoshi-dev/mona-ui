import { InputPropertyPipe } from "./input-type.pipe";

describe("InputTypePipe", () => {
    it("create an instance", () => {
        const pipe = new InputPropertyPipe();
        expect(pipe).toBeTruthy();
    });
});
