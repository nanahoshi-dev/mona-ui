import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ApiInputListItemComponent } from "./api-input-list-item.component";

describe("ApiListItemComponent", () => {
    let component: ApiInputListItemComponent;
    let fixture: ComponentFixture<ApiInputListItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ApiInputListItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ApiInputListItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
