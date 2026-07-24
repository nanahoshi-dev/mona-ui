import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardActionDirective } from "../../directives/card-action.directive";
import { CardDescriptionDirective } from "../../directives/card-description.directive";
import { CardTitleDirective } from "../../directives/card-title.directive";
import { CardService } from "../../services/card.service";
import { CardHeaderComponent } from "./card-header.component";

@Component({
    imports: [CardHeaderComponent, CardTitleDirective, CardDescriptionDirective, CardActionDirective],
    template: `
        <mona-card-header class="header-class">
            <h3 *monaCardTitle="let id" [id]="id">Title</h3>
            <p *monaCardDescription="let id" [id]="id">Description</p>
            <button *monaCardAction type="button">One</button>
            <button *monaCardAction type="button">Two</button>
        </mona-card-header>
    `
})
class TestHostComponent {
    public readonly header = viewChild.required(CardHeaderComponent);
}

describe("CardHeaderComponent", () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let service: CardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [CardService]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        service = TestBed.inject(CardService);
        hostFixture.detectChanges();
        await hostFixture.whenStable();
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostFixture.componentInstance.header()).toBeTruthy();
    });

    it("publishes title, description, action templates and their ids to the service", () => {
        expect(service.titleTemplate()).toBeTruthy();
        expect(service.titleId()).toEqual(expect.any(String));
        expect(service.descriptionTemplate()).toBeTruthy();
        expect(service.descriptionId()).toEqual(expect.any(String));
        expect(service.actionTemplate().length).toBe(2);
        expect(service.headerTemplate()).toBeTruthy();
        expect(service.headerClass()).toBe("header-class");
    });

    it("resets every published slot on destroy", () => {
        hostFixture.destroy();

        expect(service.titleTemplate()).toBeNull();
        expect(service.titleId()).toBeNull();
        expect(service.descriptionTemplate()).toBeNull();
        expect(service.descriptionId()).toBeNull();
        expect(service.actionTemplate()).toEqual([]);
        expect(service.headerTemplate()).toBeNull();
        expect(service.headerClass()).toBeNull();
    });
});
