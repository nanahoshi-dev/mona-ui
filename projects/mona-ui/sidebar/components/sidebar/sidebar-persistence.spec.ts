import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import type { SidebarStorage } from "../../models/SidebarStorage";
import { provideSidebarStorage } from "../../providers/sidebar.providers";
import { SidebarLayoutService } from "../../services/sidebar-layout.service";
import { SidebarService } from "../../services/sidebar.service";
import { LocalStorageSidebarStorage } from "../../strategies/local-storage-sidebar.strategy";
import { SidebarLayoutComponent } from "../sidebar-layout/sidebar-layout.component";
import { SidebarComponent } from "./sidebar.component";

/** A storage that records what it was asked to do, so the wiring can be checked without a browser. */
class FakeSidebarStorage implements SidebarStorage {
    public readonly entries = new Map<string, boolean>();
    public readonly writes: Array<{ expanded: boolean; key: string }> = [];

    public read(key: string): boolean | null {
        return this.entries.get(key) ?? null;
    }

    public write(key: string, expanded: boolean): void {
        this.entries.set(key, expanded);
        this.writes.push({ expanded, key });
    }
}

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [(expanded)]="expanded" [persistKey]="persistKey()">
                <a class="link" href="/introduction">Introduction</a>
            </mona-sidebar>
            <main>
                <button monaSidebarTrigger class="trigger">Toggle</button>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarTriggerDirective]
})
class PersistenceHostComponent {
    public readonly expanded = signal(true);
    public readonly persistKey = signal("");
}

describe("Sidebar persistence", () => {
    let fixture: ComponentFixture<PersistenceHostComponent>;
    let component: PersistenceHostComponent;
    let storage: FakeSidebarStorage;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const sidebar = (): HTMLElement => query("mona-sidebar");

    const create = (persistKey: string): void => {
        fixture = TestBed.createComponent(PersistenceHostComponent);
        component = fixture.componentInstance;
        component.persistKey.set(persistKey);
        fixture.detectChanges();
    };

    const serviceOf = (): SidebarService =>
        fixture.debugElement.query(node => node.name === "mona-sidebar").injector.get(SidebarService);

    const layoutServiceOf = (): SidebarLayoutService =>
        fixture.debugElement.query(node => node.name === "mona-sidebar-layout").injector.get(SidebarLayoutService);

    beforeEach(() => {
        storage = new FakeSidebarStorage();
        TestBed.configureTestingModule({
            imports: [PersistenceHostComponent],
            providers: [provideSidebarStorage(storage)]
        });
    });

    describe("without a key", () => {
        it("should not touch storage at all", () => {
            create("");

            query(".trigger").click();
            fixture.detectChanges();

            expect(storage.writes).toEqual([]);
            expect(storage.entries.size).toBe(0);
        });
    });

    describe("restoring", () => {
        it("should open collapsed when that is what was stored", () => {
            storage.entries.set("nav", false);

            create("nav");

            expect(sidebar().getAttribute("data-state")).toBe("collapsed");
            expect(sidebar().style.width).toBe("0px");
        });

        it("should push the restored state back out through the two-way binding", () => {
            storage.entries.set("nav", false);

            create("nav");

            expect(component.expanded()).toBe(false);
        });

        it("should leave the input's state alone when nothing was stored", () => {
            create("nav");

            expect(sidebar().getAttribute("data-state")).toBe("expanded");
            expect(component.expanded()).toBe(true);
        });

        it("should not write the default over a stored value on the first pass", () => {
            storage.entries.set("nav", false);

            create("nav");

            // Restoring has to land before persisting, or a stored `false` is gone by first paint.
            expect(storage.entries.get("nav")).toBe(false);
            expect(storage.writes.every(write => !write.expanded)).toBe(true);
        });
    });

    describe("recording", () => {
        it("should record the state as it changes", () => {
            create("nav");

            query(".trigger").click();
            fixture.detectChanges();
            expect(storage.entries.get("nav")).toBe(false);

            query(".trigger").click();
            fixture.detectChanges();
            expect(storage.entries.get("nav")).toBe(true);
        });

        it("should record under the key it was given", () => {
            create("inspector");

            query(".trigger").click();
            fixture.detectChanges();

            expect(storage.entries.has("inspector")).toBe(true);
            expect(storage.entries.has("nav")).toBe(false);
        });

        it("should restore from the new key when the key changes", () => {
            storage.entries.set("other", false);
            create("nav");
            expect(sidebar().getAttribute("data-state")).toBe("expanded");

            component.persistKey.set("other");
            fixture.detectChanges();

            expect(sidebar().getAttribute("data-state")).toBe("collapsed");
        });
    });

    describe("the drawer", () => {
        it("should never record the drawer over the docked state", () => {
            create("nav");
            expect(storage.entries.get("nav")).toBe(true);

            layoutServiceOf().setCompact(true);
            fixture.detectChanges();
            query(".trigger").click();
            fixture.detectChanges();
            expect(serviceOf().mobileOpen()).toBe(true);

            // The desktop is meant to come back expanded. A drawer opened on a phone is not a
            // statement about that, and must not be written down as one.
            expect(storage.entries.get("nav")).toBe(true);
        });

        it("should never restore a drawer open", () => {
            storage.entries.set("nav", true);
            create("nav");

            layoutServiceOf().setCompact(true);
            fixture.detectChanges();

            // A restored drawer would cover the page on load, in front of the content asked for.
            expect(serviceOf().mobileOpen()).toBe(false);
        });
    });
});

describe("LocalStorageSidebarStorage", () => {
    const key = "mona-sidebar-spec";
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

    /** This environment has no `localStorage` of its own, so each test says what one should do. */
    const install = (stub: Partial<Storage>): void => {
        Object.defineProperty(globalThis, "localStorage", { configurable: true, value: stub });
    };

    const installWorkingStorage = (): Map<string, string> => {
        const entries = new Map<string, string>();
        install({
            getItem: (name: string) => entries.get(name) ?? null,
            setItem: (name: string, value: string) => void entries.set(name, value)
        });
        return entries;
    };

    afterEach(() => {
        if (descriptor) {
            Object.defineProperty(globalThis, "localStorage", descriptor);
            return;
        }
        Reflect.deleteProperty(globalThis, "localStorage");
    });

    it("should round-trip through localStorage in a browser", () => {
        const entries = installWorkingStorage();
        const storage = new LocalStorageSidebarStorage("browser");

        expect(storage.read(key)).toBeNull();

        storage.write(key, false);
        expect(entries.get(key)).toBe("false");
        expect(storage.read(key)).toBe(false);

        storage.write(key, true);
        expect(storage.read(key)).toBe(true);
    });

    it("should stand down on the server rather than reach for localStorage", () => {
        const entries = installWorkingStorage();
        const storage = new LocalStorageSidebarStorage("server");

        storage.write(key, false);

        expect(storage.read(key)).toBeNull();
        expect(entries.size).toBe(0);
    });

    it("should report null rather than throw when storage refuses", () => {
        // Private browsing throws on access and a full quota throws on write. Neither is worth taking
        // the application down for.
        install({
            getItem: () => {
                throw new Error("SecurityError");
            },
            setItem: () => {
                throw new Error("QuotaExceededError");
            }
        });
        const storage = new LocalStorageSidebarStorage("browser");

        expect(() => storage.write(key, true)).not.toThrow();
        expect(storage.read(key)).toBeNull();
    });

    it("should report null rather than throw where there is no localStorage at all", () => {
        Reflect.deleteProperty(globalThis, "localStorage");
        const storage = new LocalStorageSidebarStorage("browser");

        expect(() => storage.write(key, true)).not.toThrow();
        expect(storage.read(key)).toBeNull();
    });
});
