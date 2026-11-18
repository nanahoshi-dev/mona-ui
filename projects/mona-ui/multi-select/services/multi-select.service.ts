import { Injectable, signal, type TemplateRef } from "@angular/core";

/** @hidden The summary tag settings a multi-select or multi-select tree shares with its directives. */
@Injectable()
export class MultiSelectService {
    public readonly summaryTagTemplate = signal<TemplateRef<unknown> | null>(null);
    public readonly tagCount = signal(-1);
}
