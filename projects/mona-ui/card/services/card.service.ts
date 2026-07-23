import { Service, signal, type TemplateRef } from "@angular/core";
import type { ClassInputType } from "@nanahoshi/mona-ui/common";

@Service({ autoProvided: false })
export class CardService {
    public readonly footerClass = signal<ClassInputType>(undefined);
    public readonly footerTemplate = signal<TemplateRef<unknown> | null>(null);
    public readonly headerClass = signal<ClassInputType>(undefined);
    public readonly headerTemplate = signal<TemplateRef<unknown> | null>(null);
}
