import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
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
        fixture.componentRef.setInput("entry", { key: "test", property: "test", value: "val" });
        fixture.componentRef.setInput("metadata", { inputs: {}, methods: {}, outputs: {} });
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
