import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export interface VariantClassDelta {
    readonly add?: ClassValue;
    readonly remove?: ClassValue;
}

export interface CompoundVariantClassDelta<TProps extends object> extends VariantClassDelta {
    readonly when: Partial<TProps>;
}

export interface InheritedVariantsConfig<TProps extends object> extends VariantClassDelta {
    readonly compoundVariants?: readonly CompoundVariantClassDelta<TProps>[];
    readonly defaultVariants?: Partial<TProps>;
    readonly variants?: {
        readonly [TKey in keyof TProps]?: Readonly<Record<string, VariantClassDelta>>;
    };
}

/**
 * Derives a themed variant function from a canonical recipe. Deltas can add
 * classes and explicitly remove inherited classes, which is required when a
 * derived theme intentionally drops a structural or state utility.
 */
export function createInheritedVariants<TProps extends object>(
    base: (props?: TProps) => string,
    config: InheritedVariantsConfig<TProps> = {}
): (props?: TProps) => string {
    return (props?: TProps) => {
        const resolvedProps = { ...config.defaultVariants, ...props } as TProps;
        const deltas: VariantClassDelta[] = [config];

        const variants = Object.entries(config.variants ?? {}) as [
            string,
            Readonly<Record<string, VariantClassDelta>>
        ][];
        for (const [key, values] of variants) {
            const value = Reflect.get(resolvedProps, key) as unknown;
            if (value !== null && value !== undefined) {
                const delta = values[String(value)];
                if (delta !== undefined) {
                    deltas.push(delta);
                }
            }
        }

        for (const compoundVariant of config.compoundVariants ?? []) {
            if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                deltas.push(compoundVariant);
            }
        }

        const removedClasses = new Set(deltas.flatMap(delta => classTokens(delta.remove)));
        const inheritedClasses = classTokens(base(resolvedProps)).filter(className => !removedClasses.has(className));
        return twMerge(
            cx(
                inheritedClasses,
                deltas.map(delta => delta.add)
            )
        );
    };
}

function classTokens(value: ClassValue): string[] {
    return cx(value).split(/\s+/u).filter(Boolean);
}

function matchesCompoundVariant<TProps extends object>(expected: Partial<TProps>, actual: TProps): boolean {
    return Object.entries(expected).every(([key, expectedValue]) => Reflect.get(actual, key) === expectedValue);
}
