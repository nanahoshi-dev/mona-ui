import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inertOutside } from "./inertOutside";

describe("inertOutside", () => {
    let root: HTMLElement;
    const el = (id: string): HTMLElement => root.querySelector(`#${id}`) as HTMLElement;

    beforeEach(() => {
        root = document.createElement("div");
        root.innerHTML = `
            <header id="header"></header>
            <div id="wrapper">
                <aside id="beside"></aside>
                <div id="layout">
                    <div id="panel"></div>
                    <div id="neighbor"></div>
                    <div id="kept"></div>
                </div>
            </div>
            <div id="live" aria-live="polite"></div>
            <div id="overlays" class="cdk-overlay-container"></div>
        `;
        document.body.appendChild(root);
    });

    afterEach(() => root.remove());

    it("makes everything outside inert, all the way up", () => {
        const release = inertOutside(el("panel"));
        expect(el("neighbor").hasAttribute("inert")).toBe(true);
        expect(el("beside").hasAttribute("inert")).toBe(true);
        expect(el("header").hasAttribute("inert")).toBe(true);
        expect(el("panel").hasAttribute("inert")).toBe(false);
        expect(el("layout").hasAttribute("inert")).toBe(false);
        release();
        expect(el("neighbor").hasAttribute("inert")).toBe(false);
        expect(el("header").hasAttribute("inert")).toBe(false);
    });

    it("leaves live regions and the overlay container alone, for an element in the page", () => {
        inertOutside(el("panel"))();
        const release = inertOutside(el("panel"));
        expect(el("live").hasAttribute("inert")).toBe(false);
        expect(el("overlays").hasAttribute("inert")).toBe(false);
        release();
    });

    it("stops at stopAt", () => {
        const release = inertOutside(el("panel"), { stopAt: el("layout") });
        expect(el("neighbor").hasAttribute("inert")).toBe(true);
        expect(el("beside").hasAttribute("inert")).toBe(false);
        expect(el("header").hasAttribute("inert")).toBe(false);
        release();
    });

    it("goes all the way up with a null stopAt", () => {
        const release = inertOutside(el("panel"), { stopAt: null });
        expect(el("header").hasAttribute("inert")).toBe(true);
        release();
    });

    it("leaves what keep asks for", () => {
        const release = inertOutside(el("panel"), { keep: element => element.id === "kept" });
        expect(el("kept").hasAttribute("inert")).toBe(false);
        expect(el("neighbor").hasAttribute("inert")).toBe(true);
        release();
        expect(el("neighbor").hasAttribute("inert")).toBe(false);
    });

    it("leaves something inert already as it was", () => {
        el("neighbor").setAttribute("inert", "");
        const release = inertOutside(el("panel"));
        release();
        expect(el("neighbor").hasAttribute("inert")).toBe(true);
    });

    it("releases only after the last of two", () => {
        const first = inertOutside(el("panel"));
        const second = inertOutside(el("panel"));
        first();
        expect(el("neighbor").hasAttribute("inert")).toBe(true);
        second();
        expect(el("neighbor").hasAttribute("inert")).toBe(false);
    });

    it("can be released twice", () => {
        const first = inertOutside(el("panel"));
        const second = inertOutside(el("panel"));
        first();
        first();
        expect(el("neighbor").hasAttribute("inert")).toBe(true);
        second();
    });
});
