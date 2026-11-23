import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { provideRipple } from "../providers/ripple.providers";
import { RippleDirective } from "./ripple.directive";

@Component({
    template: `<div monaRipple [monaRippleDisabled]="disabled()" [attr.aria-disabled]="ariaDisabled()">
        <span id="label">Press</span><button type="button" id="inner">Inner</button><a id="bare-anchor">Anchor</a>
    </div>`,
    imports: [RippleDirective]
})
class RippleHostComponent {
    public readonly ariaDisabled = signal<string | null>(null);
    public readonly disabled = signal(false);
}

@Component({
    template: `<div monaRipple id="halo-host"><span id="box">Box</span><span>Label</span></div>
        <label monaRipple id="option"><input type="radio" id="own" /></label>`,
    imports: [RippleDirective]
})
class RippleHaloHostComponent {}

interface AnimateCall {
    readonly keyframes: Keyframe[];
    readonly options: KeyframeAnimationOptions;
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");

let animateCalls: AnimateCall[] = [];

function installAnimate(): void {
    animateCalls = [];
    Object.defineProperty(Element.prototype, "animate", {
        configurable: true,
        writable: true,
        value: (keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation => {
            animateCalls.push({ keyframes, options });
            return { finished: Promise.resolve() } as unknown as Animation;
        }
    });
}

function installMatchMedia(matching: string): void {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: (query: string): MediaQueryList => ({ matches: query === matching }) as MediaQueryList
    });
}

function restoreProperty(target: object, key: string, descriptor: PropertyDescriptor | undefined): void {
    if (descriptor) {
        Object.defineProperty(target, key, descriptor);
    } else {
        Reflect.deleteProperty(target, key);
    }
}

function press(element: HTMLElement, init: PointerEventInit = {}): void {
    element.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 30, clientY: 10, ...init })
    );
}

function container(element: HTMLElement): HTMLSpanElement | null {
    return element.querySelector<HTMLSpanElement>(":scope > span[aria-hidden='true']");
}

function waves(element: HTMLElement): HTMLSpanElement[] {
    return [...(container(element)?.children ?? [])] as HTMLSpanElement[];
}

async function settle(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve));
}

async function createHost(enabled: boolean): Promise<ComponentFixture<RippleHostComponent>> {
    TestBed.configureTestingModule({
        imports: [RippleHostComponent],
        providers: enabled ? [provideRipple()] : []
    });
    const fixture = TestBed.createComponent(RippleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
}

function hostElement(fixture: ComponentFixture<RippleHostComponent>): HTMLDivElement {
    return fixture.nativeElement.querySelector("[monaRipple]");
}

describe("RippleDirective", () => {
    beforeEach(() => {
        installAnimate();
        // The layer is 100 by 40 and starts 10px from the viewport's left edge.
        vi.spyOn(HTMLSpanElement.prototype, "getBoundingClientRect").mockReturnValue(
            DOMRect.fromRect({ x: 10, y: 0, width: 100, height: 40 })
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        restoreProperty(Element.prototype, "animate", animateDescriptor);
        restoreProperty(window, "matchMedia", matchMediaDescriptor);
    });

    it("draws nothing until ripples are turned on", async () => {
        const fixture = await createHost(false);
        press(hostElement(fixture));
        expect(container(hostElement(fixture))).toBeNull();
        expect(animateCalls).toEqual([]);
    });

    it("draws a wave from the pointer that reaches the farthest corner", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        press(host);

        const layer = container(host);
        expect(layer).not.toBeNull();
        expect(layer?.dir).toBe("ltr");
        expect(layer?.classList).toContain("-z-1");
        expect(layer?.classList).toContain("forced-colors:hidden");
        expect(layer?.classList).toContain("in-[.cdk-drag-preview]:hidden");
        expect(layer?.classList).toContain("in-[.cdk-drag-placeholder]:hidden");

        const [wave] = waves(host);
        // The pointer is at (20, 10) in the layer, so the farthest corner is (100, 40), 85.44px away.
        const radius = Math.hypot(80, 30);
        expect(parseFloat(wave.style.width)).toBeCloseTo(radius * 2);
        expect(parseFloat(wave.style.height)).toBeCloseTo(radius * 2);
        const [translateX, translateY] = wave.style.translate.split(" ").map(part => parseFloat(part));
        expect(translateX).toBeCloseTo(20 - radius);
        expect(translateY).toBeCloseTo(10 - radius);
        expect(animateCalls).toHaveLength(1);
        expect(animateCalls[0].keyframes).toEqual([{ scale: 0 }, { scale: 1 }]);
        expect(animateCalls[0].options.duration).toBe(450);
        expect(animateCalls[0].options.easing).toBe("cubic-bezier(0, 0, 0.2, 1)");
    });

    it("keeps the wave while held, then fades it once and removes it", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        press(host);
        await settle();
        expect(waves(host)).toHaveLength(1);

        host.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
        host.dispatchEvent(new PointerEvent("pointerleave"));
        await settle();

        expect(waves(host)).toHaveLength(0);
        expect(animateCalls).toHaveLength(2);
        expect(animateCalls[1].keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
        expect(animateCalls[1].options.duration).toBe(300);
    });

    it("takes its durations from the ripple's tokens, not the theme's motion", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        host.style.setProperty("--mona-ripple-duration", "0.6s");
        host.style.setProperty("--mona-ripple-fade-duration", "120ms");
        host.style.setProperty("--mona-motion-standard", "200ms");
        host.style.setProperty("--mona-motion-fast", "150ms");
        press(host);
        host.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
        await settle();

        expect(animateCalls.map(call => call.options.duration)).toEqual([600, 120]);
    });

    it("keeps its own pace when only the theme's motion is set", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        host.style.setProperty("--mona-motion-standard", "200ms");
        host.style.setProperty("--mona-motion-fast", "150ms");
        press(host);
        host.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
        await settle();

        expect(animateCalls.map(call => call.options.duration)).toEqual([450, 300]);
    });

    it("draws a press on the element's content, but not one on a control inside it", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        press(host.querySelector<HTMLElement>("#inner") as HTMLElement);
        expect(container(host)).toBeNull();

        press(host.querySelector<HTMLElement>("#label") as HTMLElement);
        press(host.querySelector<HTMLElement>("#bare-anchor") as HTMLElement);
        expect(waves(host)).toHaveLength(2);
    });

    it("draws every press in one layer", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        press(host);
        press(host, { clientX: 90 });

        expect(host.querySelectorAll(":scope > span[aria-hidden='true']")).toHaveLength(1);
        expect(waves(host)).toHaveLength(2);
    });

    it("makes a static host relative and isolates it", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        press(host);

        expect(host.style.position).toBe("relative");
        expect(host.style.isolation).toBe("isolate");
    });

    it("leaves a positioned host's position alone", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        host.style.position = "absolute";
        press(host);

        expect(host.style.position).toBe("absolute");
    });

    it("draws nothing for a press of another button", async () => {
        const fixture = await createHost(true);
        press(hostElement(fixture), { button: 2 });
        expect(container(hostElement(fixture))).toBeNull();
    });

    it("draws nothing when turned off on the element", async () => {
        const fixture = await createHost(true);
        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();
        press(hostElement(fixture));
        expect(container(hostElement(fixture))).toBeNull();
    });

    it("draws nothing on an aria-disabled element", async () => {
        const fixture = await createHost(true);
        fixture.componentInstance.ariaDisabled.set("true");
        fixture.detectChanges();
        press(hostElement(fixture));
        expect(container(hostElement(fixture))).toBeNull();
    });

    it("draws nothing with reduced motion", async () => {
        installMatchMedia("(prefers-reduced-motion: reduce)");
        const fixture = await createHost(true);
        press(hostElement(fixture));
        expect(container(hostElement(fixture))).toBeNull();
    });

    it("draws nothing in forced colors", async () => {
        installMatchMedia("(forced-colors: active)");
        const fixture = await createHost(true);
        press(hostElement(fixture));
        expect(container(hostElement(fixture))).toBeNull();
    });

    it("draws nothing without the Web Animations API", async () => {
        restoreProperty(Element.prototype, "animate", animateDescriptor);
        const fixture = await createHost(true);
        press(hostElement(fixture));
        expect(container(hostElement(fixture))).toBeNull();
    });

    it("draws a press on the control a label is for as a press on the label", async () => {
        TestBed.configureTestingModule({ imports: [RippleHaloHostComponent], providers: [provideRipple()] });
        const fixture = TestBed.createComponent(RippleHaloHostComponent);
        fixture.detectChanges();
        const label = fixture.nativeElement.querySelector("#option") as HTMLLabelElement;
        press(label.querySelector("#own") as HTMLElement);

        expect(waves(label)).toHaveLength(1);
    });

    describe("as a halo", () => {
        let fixture: ComponentFixture<RippleHaloHostComponent>;
        let box: HTMLSpanElement;
        let host: HTMLDivElement;

        beforeEach(() => {
            TestBed.configureTestingModule({ imports: [RippleHaloHostComponent], providers: [provideRipple()] });
            fixture = TestBed.createComponent(RippleHaloHostComponent);
            fixture.detectChanges();
            host = fixture.nativeElement.querySelector("#halo-host");
            box = host.querySelector("#box") as HTMLSpanElement;
            const directive = fixture.debugElement.query(By.css("#halo-host")).injector.get(RippleDirective);
            directive.setHalo(() => box);
        });

        it("draws it in the control, centred on it, reaching past its edges", () => {
            press(host.querySelector("span:last-child") as HTMLElement);

            const layer = container(box);
            expect(layer?.classList).toContain("start-1/2");
            expect(layer?.classList).toContain("top-1/2");
            expect(layer?.classList).toContain("text-foreground");
            expect(layer?.classList).not.toContain("overflow-hidden");
            expect(container(host)).toBeNull();

            // The box is 100 by 40, so the halo reaches 10px past its longer side.
            const [wave] = waves(box);
            expect(wave.style.width).toBe("120px");
            expect(wave.style.height).toBe("120px");
            expect(wave.style.translate).toBe("-60px -60px");
            expect(animateCalls[0].keyframes).toEqual([{ scale: 0 }, { scale: 1 }]);
        });

        it("positions the control rather than the host, and isolates the host", () => {
            press(host);

            expect(box.style.position).toBe("relative");
            expect(host.style.position).toBe("");
            expect(host.style.isolation).toBe("isolate");
        });

        it("fades it when the host is let go", async () => {
            press(host);
            host.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
            await settle();

            expect(waves(box)).toHaveLength(0);
            expect(animateCalls[1].keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
        });
    });

    it("stops listening once destroyed", async () => {
        const fixture = await createHost(true);
        const host = hostElement(fixture);
        fixture.destroy();
        press(host);
        expect(container(host)).toBeNull();
    });
});
