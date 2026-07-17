import { dropdownPopupVariants } from "./dropdown-popup.mona.styles";

describe("dropdownPopupVariants", () => {
    it("uses the raised surface and quiet default border", () => {
        const classes = dropdownPopupVariants();

        expect(classes).toContain("bg-surface-raised");
        expect(classes).toContain("border-border");
        expect(classes).not.toContain("border-input-border");
    });
});
