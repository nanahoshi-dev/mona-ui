import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { PopupDataInjectionToken } from "../../../popup/models/PopupInjectionToken";
import { DialogReference } from "../../models/DialogReference";
import { createDialogInjectorData } from "../../utils/createDialogInjectorData";

import { DialogContentComponent } from "./dialog-content.component";

describe("DialogContentComponent", () => {
    let component: DialogContentComponent;
    let fixture: ComponentFixture<DialogContentComponent>;

    beforeEach(() => {
        const dialogData = createDialogInjectorData({ title: "Test" });
        const dialogReference = new DialogReference({}, dialogData);
        dialogData.dialogReference = dialogReference;

        TestBed.configureTestingModule({
            imports: [DialogContentComponent],
            providers: [provideAnimations(), { provide: PopupDataInjectionToken, useValue: dialogData }]
        });
        fixture = TestBed.createComponent(DialogContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
