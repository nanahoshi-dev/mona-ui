import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotificationContainerComponent } from "./notification-container.component";

describe("NotificationContainerComponent", () => {
    let component: NotificationContainerComponent;
    let fixture: ComponentFixture<NotificationContainerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NotificationContainerComponent]
        });
        fixture = TestBed.createComponent(NotificationContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should default to the topright position and fixed position type", () => {
        const host: HTMLElement = fixture.nativeElement;

        expect(host.className).toContain("top-0");
        expect(host.className).toContain("right-0");
        expect(host.className).toContain("fixed");
    });

    it("should reflect position changes in the host class", () => {
        component.position.set("bottomleft");
        fixture.detectChanges();

        const host: HTMLElement = fixture.nativeElement;

        expect(host.className).toContain("bottom-0");
        expect(host.className).toContain("left-0");
    });

    it("should reflect positionType changes in the host class", () => {
        component.positionType.set("absolute");
        fixture.detectChanges();

        const host: HTMLElement = fixture.nativeElement;

        expect(host.className).toContain("absolute");
        expect(host.className).not.toContain("fixed");
    });
});
