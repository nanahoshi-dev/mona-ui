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

    it("renders a description's code, links, formatting and lists instead of dropping the elements they name", () => {
        fixture.componentRef.setInput("entry", { configType: "string", name: "inputId", valueType: "string" });
        fixture.componentRef.setInput("metadata", {
            inputs: [
                {
                    description:
                        "Id of the inner `<input>` element, see {@link placeholder}.\nOnly every n<sup>th</sup> one.\n\n- `true`: yes\n- `false`: no",
                    kind: "input",
                    name: "inputId",
                    type: "string"
                }
            ],
            name: "TextBoxComponent",
            selector: "mona-text-box"
        });
        fixture.detectChanges();

        const prose = (fixture.nativeElement as HTMLElement).querySelector(".api-prose");
        const codes = Array.from(prose?.querySelectorAll("code") ?? [], code => code.textContent);
        expect(codes).toEqual(["<input>", "placeholder", "true", "false"]);
        expect(prose?.querySelector("input")).toBeNull();
        expect(prose?.querySelector("sup")?.textContent).toBe("th");
        expect(prose?.querySelectorAll("li")).toHaveLength(2);
        expect(prose?.textContent).not.toContain("{@link");
    });
});
