import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { Subject } from "rxjs";
import { PopupDataInjectionToken } from "../../../../popup/models/PopupInjectionToken";
import { PopupMenuListComponent } from "./popup-menu-list.component";

describe("PopupMenuListComponent", () => {
    let component: PopupMenuListComponent;
    let fixture: ComponentFixture<PopupMenuListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopupMenuListComponent],
            providers: [
                {
                    provide: PopupDataInjectionToken,
                    useValue: {
                        parentClose$: new Subject(),
                        rounded: signal("medium")
                    }
                },
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PopupMenuListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
