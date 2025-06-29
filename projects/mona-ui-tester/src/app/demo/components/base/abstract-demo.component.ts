import { Component, inject, Injector, linkedSignal, Signal, signal, WritableSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import { ComponentConfig, extractConfigValues } from "../../utils/componentConfig";

@Component({ template: "" })
export abstract class AbstractDemoComponent<TComponent> {
    readonly #injector = inject(Injector);
    protected readonly demoService = inject(DemoService);
    public readonly inputs = linkedSignal({
        source: signal({}),
        computation: () => extractConfigValues(this.config())
    });

    protected onInputValueChange(value: any) {
        this.inputs.update(currentValues => {
            return { ...currentValues, ...value };
        });
    }

    protected getMetadata(name: string): Signal<ComponentMetadata> {
        return toSignal(
            this.demoService.metadata$.pipe(
                map(metadata => metadata?.[name] ?? ({} as ComponentMetadata)),
                filter(metadata => !!metadata)
            ),
            { injector: this.#injector, initialValue: {} as ComponentMetadata }
        );
    }

    protected getSubComponentsMetadata(names: string[]): Signal<Record<string, ComponentMetadata>> {
        if (names.length === 0) {
            return signal({} as Record<string, ComponentMetadata>);
        }
        return toSignal(
            this.demoService.metadata$.pipe(
                map(metadata => {
                    const result: Record<string, ComponentMetadata> = {};
                    names.forEach(name => {
                        result[name] = metadata?.[name] ?? ({} as ComponentMetadata);
                    });
                    return result;
                }),
                filter(metadata => Object.keys(metadata).length > 0)
            ),
            { injector: this.#injector, initialValue: {} as Record<string, ComponentMetadata> }
        );
    }

    protected abstract config: WritableSignal<ComponentConfig<TComponent>>;
    protected abstract metadata: Signal<ComponentMetadata>;
    protected abstract subComponentsMetadata: Signal<Record<string, ComponentMetadata>>;
}
