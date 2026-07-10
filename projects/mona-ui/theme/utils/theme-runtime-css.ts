import type { ThemeVariables } from "../models/ThemeDefinition";

export function toRuntimeVariableName(variableName: string): string {
    return variableName.startsWith("--mona-") ? variableName : `--mona-${variableName.slice(2)}`;
}

export function createRuntimeThemeCss(themeVariables: ThemeVariables): string {
    const declarations = Object.entries(themeVariables)
        .map(([variableName, value]) => `    ${toRuntimeVariableName(variableName)}: ${value};`)
        .join("\n");

    return `/* This file is generated from the Mona UI theme registry. Do not edit it directly. */
:root {
${declarations}
}
`;
}
