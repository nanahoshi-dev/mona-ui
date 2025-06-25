import * as fs from "fs";
import * as path from "path";
import { CallExpression, Node, Project } from "ts-morph";

interface ComponentInputMetadata {
    name: string;
    type: string;
    description: string;
    kind: "input" | "model" | "output";
}

interface ComponentMetadata {
    name: string;
    selector: string;
    inputs: ComponentInputMetadata[];
}

const outputPath = path.resolve(__dirname, "../src/assets/component-metadata.json");
const projectPath = path.resolve(__dirname, "../../mona-ui"); // Path to your Angular project root

/**
 * Simplifies a TypeScript type string by removing import paths and extracting generic arguments.
 * Examples:
 * - "import(\"...\").InputSignal<boolean>" becomes "boolean"
 * - "import(\"...\").InputSignalWithTransform<string, boolean>" becomes "boolean"
 * - "boolean | undefined" remains "boolean | undefined"
 * - "SomeNamespace.MyType" becomes "MyType"
 * @param fullType The full type string from ts-morph.
 * @returns A simplified type string.
 */
function simplifyType(fullType: string): string {
    let simplified = fullType;

    // 1. Remove "import(...)."-like prefixes
    // This handles cases like: import("L:/Codes/.../index").InputSignal<boolean>
    const importMatch = simplified.match(/import\(.+\)\.(.+)/);
    if (importMatch && importMatch[1]) {
        simplified = importMatch[1];
    }

    // 2. Handle InputSignalWithTransform specifically: extract the second generic parameter
    // Regex to match "InputSignalWithTransform<T1, T2>" and capture T2
    const inputSignalWithTransformMatch = simplified.match(/InputSignalWithTransform<[^,]+,\s*(.+?)>$/);
    if (inputSignalWithTransformMatch && inputSignalWithTransformMatch[1]) {
        return inputSignalWithTransformMatch[1].trim();
    }

    // 3. Extract generic type argument if present (e.g., InputSignal<boolean> -> boolean)
    // This should run AFTER InputSignalWithTransform specific handling
    const genericMatch = simplified.match(/^[^<]+<(.+)>$/);
    if (genericMatch && genericMatch[1]) {
        // This captures the content inside the outermost angle brackets
        simplified = genericMatch[1];
    }

    // 4. Remove any remaining namespace prefixes (e.g., Core.InputSignal -> InputSignal)
    const lastDotIndex = simplified.lastIndexOf(".");
    if (lastDotIndex > -1) {
        simplified = simplified.substring(lastDotIndex + 1);
    }

    return simplified.trim();
}

async function extractComponentMetadata() {
    const project = new Project({
        tsConfigFilePath: path.join(projectPath, "tsconfig.lib.json"), // Or tsconfig.json if applicable
        skipFileDependencyResolution: true // Speeds up parsing if you don't need full type resolution for this
    });

    const allComponentMetadata: { [componentName: string]: ComponentMetadata } = {};

    // Get all TypeScript source files in the project's src directory
    const pattern = `${path.resolve(__dirname, "../../mona-ui").replaceAll("\\", "/")}/src/lib/**/*.ts`;
    const sourceFiles = project.getSourceFiles(pattern);

    for (const sourceFile of sourceFiles) {
        // Find classes that have an @Component decorator
        for (const classDeclaration of sourceFile.getClasses()) {
            const componentDecorator = classDeclaration.getDecorator("Component");
            const directiveDecorator = classDeclaration.getDecorator("Directive");
            const resultDecorator = componentDecorator || directiveDecorator;

            if (resultDecorator) {
                const componentName = classDeclaration.getName();
                if (!componentName) continue; // Skip if class has no name

                let selector = "";
                const decoratorArguments = resultDecorator.getArguments();
                if (decoratorArguments.length > 0 && Node.isObjectLiteralExpression(decoratorArguments[0])) {
                    const properties = decoratorArguments[0].getProperties();
                    const selectorProperty = properties.find(
                        prop => Node.isPropertyAssignment(prop) && prop.getName() === "selector"
                    );
                    if (
                        selectorProperty &&
                        Node.isPropertyAssignment(selectorProperty) &&
                        Node.isStringLiteral(selectorProperty.getInitializer())
                    ) {
                        selector = selectorProperty.getInitializer()?.getText() || "";
                    }
                }

                const componentInputs: ComponentInputMetadata[] = [];

                // Find properties that use input(), model(), or output() functions
                for (const property of classDeclaration.getProperties()) {
                    const initializer = property.getInitializer();

                    if (initializer && Node.isCallExpression(initializer)) {
                        const callExpression = initializer as CallExpression;
                        const functionName = callExpression.getExpression().getText();

                        let kind: "input" | "model" | "output" | null = null;

                        if (functionName === "input") {
                            kind = "input";
                        } else if (functionName === "model") {
                            kind = "model";
                        } else if (functionName === "output") {
                            kind = "output";
                        }

                        if (kind) {
                            const inputName = property.getName();
                            let inputType = "any"; // Default to any if type cannot be determined

                            // Try to get type from generic argument (e.g., input<string>())
                            const typeArguments = callExpression.getTypeArguments();
                            if (typeArguments.length > 0) {
                                // If there's a generic type argument, use its text representation
                                inputType = typeArguments[0].getText();
                            } else {
                                // Fallback: If no generic, try to infer from the property's declared type
                                const declaredType = property.getTypeNode();
                                if (declaredType) {
                                    inputType = declaredType.getText();
                                } else {
                                    // Fallback to the full resolved type text from ts-morph
                                    inputType = property.getType().getText();
                                }
                            }

                            // Apply simplification to the extracted type
                            inputType = simplifyType(inputType);

                            let jsDocDescription = "";
                            const jsDocs = property.getJsDocs();
                            if (jsDocs.length > 0) {
                                // Concatenate all JSDoc texts for simplicity, or parse structured tags
                                jsDocDescription = jsDocs
                                    .map(doc => doc.getFullText())
                                    .join("\n")
                                    .trim();
                                // Remove the JSDoc block delimiters (/** ... */) and leading asterisks/spaces
                                jsDocDescription = jsDocDescription
                                    .replace(/^\/\*\*\s*|\s*\*\/$/g, "")
                                    .replace(/^\s*\*\s?/gm, "");
                            }

                            componentInputs.push({
                                name: inputName,
                                type: inputType,
                                description: jsDocDescription,
                                kind: kind
                            });
                        }
                    }
                }

                // Also include properties with @Input decorator for backward compatibility
                for (const property of classDeclaration.getProperties()) {
                    const inputDecorator = property.getDecorator("Input");
                    if (inputDecorator) {
                        const inputName = property.getName();
                        let inputType = property.getType().getText(); // Get the full type text

                        // Apply simplification to the extracted type
                        inputType = simplifyType(inputType);

                        let jsDocDescription = "";
                        const jsDocs = property.getJsDocs();
                        if (jsDocs.length > 0) {
                            jsDocDescription = jsDocs
                                .map(doc => doc.getFullText())
                                .join("\n")
                                .trim();
                            jsDocDescription = jsDocDescription
                                .replace(/^\/\*\*\s*|\s*\*\/$/g, "")
                                .replace(/^\s*\*\s?/gm, "");
                        }

                        componentInputs.push({
                            name: inputName,
                            type: inputType,
                            description: jsDocDescription,
                            kind: "input" // Explicitly mark as @Input decorator type
                        });
                    }
                }

                if (componentInputs.length > 0) {
                    allComponentMetadata[componentName] = {
                        name: componentName,
                        selector: selector,
                        inputs: componentInputs
                    };
                }
            }
        }
    }

    // Write the extracted metadata to a JSON file
    fs.writeFileSync(outputPath, JSON.stringify(allComponentMetadata, null, 2));
    console.log(`Successfully extracted component metadata to: ${outputPath}`);
}

extractComponentMetadata().catch(console.error);
