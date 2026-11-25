import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, input, type Signal, type TemplateRef } from "@angular/core";
import { LucideArrowRight, LucideBan, LucideLink, LucidePlus } from "@lucide/angular";
import type { DragPreviewContext } from "../../models/DragPreviewContext";
import {
    DRAG_PREVIEW_COUNT_CLASSES,
    DRAG_PREVIEW_DEFAULT_CLASSES,
    DRAG_PREVIEW_HOST_CLASSES
} from "../../styles/drag-drop.styles";

/**
 * @hidden
 * What follows the pointer while something is dragged: the source's `monaDragPreview` template, or what a drop would
 * do and how many items are dragged. The drag places it, and gives it the context to show.
 */
@Component({
    selector: "mona-drag-preview",
    imports: [LucideArrowRight, LucideBan, LucideLink, LucidePlus, NgTemplateOutlet],
    template: `
        @if (template(); as template) {
            <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="state()"></ng-container>
        } @else {
            <div [class]="defaultClasses">
                @switch (state().effect) {
                    @case ("copy") {
                        <svg lucidePlus [size]="16"></svg>
                    }
                    @case ("link") {
                        <svg lucideLink [size]="16"></svg>
                    }
                    @case ("move") {
                        <svg lucideArrowRight [size]="16" class="rtl:rotate-180"></svg>
                    }
                    @default {
                        <svg lucideBan [size]="16"></svg>
                    }
                }
                @if (count() > 1) {
                    <span [class]="countClasses">{{ count() }}</span>
                }
            </div>
        }
    `,
    host: {
        "aria-hidden": "true",
        class: DRAG_PREVIEW_HOST_CLASSES
    }
})
export class DragPreviewComponent {
    /** How many items are dragged: an array's length, or one. */
    protected readonly count = computed(() => {
        const data = this.state().data;
        return Array.isArray(data) ? data.length : 1;
    });
    protected readonly countClasses = DRAG_PREVIEW_COUNT_CLASSES;
    protected readonly defaultClasses = DRAG_PREVIEW_DEFAULT_CLASSES;
    protected readonly state = computed(() => this.context()());

    /** The drag as the preview shows it, which changes as the pointer moves and keys are pressed. */
    public readonly context = input.required<Signal<DragPreviewContext>>();
    public readonly template = input<TemplateRef<DragPreviewContext> | null>(null);
}
