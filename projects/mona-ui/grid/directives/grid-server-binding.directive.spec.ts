import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "../components/grid/grid.component";
import type { GridDataState } from "../models/GridDataState";
import { GridService } from "../services/grid.service";
import { GridServerBindingDirective } from "./grid-server-binding.directive";

@Component({
    imports: [GridComponent, GridServerBindingDirective],
    template: `<mona-grid
        monaGridServerBinding
        [total]="total()"
        [skip]="skip()"
        [loading]="loading()"
        (dataStateChange)="events.push($event)" />`
})
class HostComponent {
    public readonly total = signal(137);
    public readonly skip = signal(40);
    public readonly loading = signal(false);
    public readonly events: GridDataState[] = [];
}

describe("GridServerBindingDirective", () => {
    async function setup() {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const service = fixture.debugElement.query(By.directive(GridComponent)).injector.get(GridService);
        return { fixture, service, host: fixture.componentInstance };
    }

    it("synchronizes server inputs without requesting data", async () => {
        const { fixture, service, host } = await setup();
        expect(service.serverBindingEnabled()).toBe(true);
        expect(service.serverTotal()).toBe(137);
        expect(service.paginationState()).toEqual({ page: 5, skip: 40, take: 10 });
        host.total.set(200);
        host.skip.set(70);
        host.loading.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(service.serverTotal()).toBe(200);
        expect(service.paginationState().skip).toBe(70);
        expect(service.serverLoading()).toBe(true);
        expect(host.events).toEqual([]);
    });

    it("forwards request states and unsubscribes on destruction", async () => {
        const { fixture, service, host } = await setup();
        const state: GridDataState = { skip: 50, take: 10, sort: [], filter: [] };
        service.dataStateChange$.next(state);
        expect(host.events).toEqual([state]);
        fixture.destroy();
        service.dataStateChange$.next(state);
        expect(host.events).toEqual([state]);
        expect(service.serverBindingEnabled()).toBe(false);
    });

    it.each([-1, NaN, Infinity, 1.5])("rejects invalid server metadata %s", async value => {
        const { service } = await setup();
        expect(() => service.setServerTotal(value)).toThrow("total must be");
        expect(() => service.setServerSkip(value)).toThrow("skip must be");
    });
});
