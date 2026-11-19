import { describe, expect, it } from "vitest";
import { TemplateChecker } from "./template-check.js";
import { fixtureSymbols } from "./test-fixture.js";

const checker = new TemplateChecker(fixtureSymbols());

function problems(template: string): string[] {
    return checker
        .check(template)
        .problems.map(problem => `${problem.line}:${problem.column} ${problem.severity}: ${problem.message}`);
}

describe("TemplateChecker", () => {
    it("accepts correct usage, and lists the imports it needs by entry point", () => {
        const result = checker.check(`
<mona-grid [data]="rows" [pageSize]="20" (pageChange)="page($event)" monaGridEditable="row" id="orders" aria-label="Orders">
    <mona-grid-column field="name" [title]="'Name'">
        <ng-template monaGridCellTemplate let-row>{{ row.name }}</ng-template>
    </mona-grid-column>
</mona-grid>
<button monaButton look="primary" class="w-full" disabled (click)="save()" [attr.aria-busy]="busy" [class.active]="on">Save</button>
<mona-text-box [(value)]="name" [invalid]="false" [maxLength]="20" (inputBlur)="touch()" [formField]="form.name" />
@if (items | monaSlice: 0 : 2; as first) { <span [monaTooltip]="first.length">{{ first | json }}</span> }
<mona-popover #popover="monaPopover"></mona-popover>`);

        expect(result.problems).toEqual([]);
        expect([...result.imports]).toEqual([
            ["button", ["ButtonDirective"]],
            ["common", ["SlicePipe"]],
            ["grid", ["GridCellTemplateDirective", "GridColumnComponent", "GridComponent", "GridEditableDirective"]],
            ["popover", ["PopoverComponent", "TooltipDirective"]],
            ["text-box", ["TextBoxComponent"]]
        ]);
    });

    it("ignores templates without Mona UI", () => {
        expect(
            problems(`<app-orders [rows]="rows" (save)="save()"></app-orders><div *ngIf="x" [foo]="y"></div>`)
        ).toEqual([]);
    });

    it("reports unknown elements, with close names", () => {
        expect(problems(`<mona-grd [data]="rows"></mona-grd>`)).toEqual([
            "1:1 error: Unknown element <mona-grd>. Did you mean <mona-grid>?"
        ]);
    });

    it("reports a made-up input, output or attribute, with close names", () => {
        expect(problems(`<mona-grid [data]="rows" [pageSzie]="5" (pageChnage)="x()"></mona-grid>`)).toEqual([
            "1:27 error: `[pageSzie]` isn't an input of GridComponent (`mona-grid`). Did you mean [pageSize]?",
            "1:42 error: `(pageChnage)` isn't an output of GridComponent (`mona-grid`), so the handler never runs. Did you mean (pageChange)?"
        ]);
        expect(problems(`<mona-grid [data]="rows" pagesize="5"></mona-grid>`)).toEqual([
            "1:26 warning: `pagesize` isn't an input of GridComponent (`mona-grid`), so it only sets an HTML attribute. Did you mean `pageSize`? That's fine if it's another directive's selector."
        ]);
    });

    it("leaves attributes on a plain element alone, since HTML has too many to know", () => {
        expect(problems(`<button monaButton variant="primary" iconOnly>Go</button>`)).toEqual([]);
    });

    it("only warns about a binding it can't place when another directive may declare it", () => {
        expect(problems(`<mona-grid [data]="rows" appSticky [stickyTop]="4"></mona-grid>`)).toEqual([
            "1:26 warning: `appSticky` isn't an input of GridComponent (`mona-grid`), so it only sets an HTML attribute. That's fine if it's another directive's selector.",
            "1:37 warning: `[stickyTop]` isn't an input of GridComponent (`mona-grid`). That's fine only if another directive on this element declares it."
        ]);
    });

    it("leaves a plain element's bindings to another directive it may carry, and names SVG elements plainly", () => {
        expect(problems(`<svg appIcon monaTooltip="Drag" [size]="16"></svg>`)).toEqual([]);
        expect(problems(`<svg monaTooltip="Drag" [size]="16"></svg>`)).toEqual([
            "1:26 error: `[size]` isn't an input of TooltipDirective (`[monaTooltip]`) or a property of <svg>."
        ]);
    });

    it("reports a Mona UI directive on the wrong element, and one that doesn't exist", () => {
        expect(problems(`<div monaButton></div><button monaButon></button>`)).toEqual([
            "1:6 error: `monaButton` applies to `button[monaButton]`, not <div>.",
            "1:31 error: No Mona UI directive or input is called `monaButon`. Did you mean `monaButton`?"
        ]);
    });

    it("reports missing required inputs", () => {
        expect(problems(`<mona-grid><mona-grid-column title="Name" /></mona-grid><span monaTooltip></span>`)).toEqual([
            "1:1 error: <mona-grid> needs `[data]`: it's a required input of GridComponent.",
            "1:12 error: <mona-grid-column> needs `[field]`: it's a required input of GridColumnComponent."
        ]);
    });

    it("reports a two-way binding on a one-way input", () => {
        expect(problems(`<mona-grid [data]="rows" [(pageSize)]="size"></mona-grid>`)).toEqual([
            "1:28 error: `[(pageSize)]` needs a model, but GridComponent's `pageSize` is a one-way input. Bind `[pageSize]` and update it from an output."
        ]);
    });

    it("warns when a static attribute passes a string to a number input", () => {
        expect(problems(`<mona-grid [data]="rows" pageSize="20"></mona-grid>`)).toEqual([
            '1:26 warning: `pageSize="20"` passes a string, but the input takes `number`. Bind `[pageSize]="20"` instead.'
        ]);
    });

    it("reports unknown Mona UI pipes and exportAs names", () => {
        expect(problems(`{{ items | monaSlcie }}<mona-grid [data]="rows" #grid="monaPopover"></mona-grid>`)).toEqual([
            "1:12 error: No Mona UI pipe is called `monaSlcie`. Did you mean `monaSlice`?",
            '1:50 error: `#grid="monaPopover"` needs PopoverComponent (`mona-popover`) on this element.'
        ]);
    });

    it("reports parse errors", () => {
        expect(problems(`<mona-grid [data]="rows"></div>`)[0]).toMatch(/^1:\d+ error: Unexpected closing tag "div"/);
    });
});
