import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ImmutableSet } from "@mirei/ts-collections";
import { AnimationService } from "../../../../animations/services/animation.service";
import { PopupDataInjectionToken } from "../../../../popup/models/PopupInjectionToken";
import { ContextMenuInjectorData } from "../../../models/ContextMenuInjectorData";
import { MenuItem, MenuItemOptions } from "../../../models/MenuItem";
import { ContextMenuContentComponent } from "./context-menu-content.component";

const POPUP_TOKEN = [
    {
        provide: PopupDataInjectionToken,
        useValue: {
            menuItems: signal<ImmutableSet<ImmutableSet<MenuItem>>>(ImmutableSet.create()),
            rounded: "medium",
            size: "medium",
            userStyles: signal(""),
            userClasses: signal("")
        } as ContextMenuInjectorData
    }
];

describe("ContextMenuContentComponent", () => {
    let component: ContextMenuContentComponent<any>;
    let fixture: ComponentFixture<ContextMenuContentComponent<any>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ContextMenuContentComponent, BrowserAnimationsModule],
            providers: [AnimationService, POPUP_TOKEN]
        });
        fixture = TestBed.createComponent(ContextMenuContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
