import { Component, linkedSignal, signal, WritableSignal } from "@angular/core";
import { ComponentConfig, extractConfigValues } from "../../utils/componentConfig";

@Component({ template: "" })
export abstract class AbstractDemoComponent<TComponent> {
    protected abstract config: WritableSignal<ComponentConfig<TComponent>>;
    public inputs = linkedSignal({
        source: signal({}),
        computation: () => extractConfigValues(this.config())
    });

    protected onInputValueChange(value: any) {
        this.inputs.update(currentValues => {
            return { ...currentValues, ...value };
        });
    }
}
