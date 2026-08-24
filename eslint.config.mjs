import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import angular from "angular-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: ["projects/mona-ui-tester/src/app/test-data/**"]
    },
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended").map(config => ({
        ...config,
        files: ["**/*.ts"]
    })),
    ...angular.configs.tsRecommended.map(config => ({
        ...config,
        files: ["**/*.ts"]
    })),
    {
        files: ["**/*.ts"],

        plugins: {
            "@typescript-eslint": typescriptEslint
        },

        processor: angular.processInlineTemplates,

        languageOptions: {
            ecmaVersion: 5,
            sourceType: "script",

            parserOptions: {
                project: ["tsconfig.json", "e2e/tsconfig.json"],
                createDefaultProgram: true
            }
        },

        rules: {
            "@angular-eslint/component-selector": [
                "error",
                {
                    prefix: "mona",
                    style: "kebab-case",
                    type: "element"
                }
            ],
            "@angular-eslint/directive-selector": [
                "error",
                {
                    prefix: "mona",
                    style: "camelCase",
                    type: "attribute"
                }
            ],
            "@angular-eslint/no-input-rename": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    classes: {
                        memberTypes: [
                            "signature",
                            "private-static-field",
                            "protected-static-field",
                            "public-static-field",
                            "private-instance-readonly-field",
                            "private-instance-field",
                            "protected-instance-readonly-field",
                            "protected-instance-field",
                            "public-instance-readonly-field",
                            "public-instance-field",
                            "private-decorated-field",
                            "protected-decorated-field",
                            "public-decorated-field",
                            "protected-abstract-field",
                            "public-abstract-field",
                            "public-constructor",
                            "protected-constructor",
                            "private-constructor",
                            "private-static-method",
                            "protected-static-method",
                            "public-static-method",
                            "public-instance-method",
                            "public-decorated-method",
                            "protected-instance-method",
                            "protected-decorated-method",
                            "private-instance-method",
                            "private-decorated-method",
                            "protected-abstract-method",
                            "public-abstract-method"
                        ],

                        order: "alphabetically"
                    },

                    interfaces: {
                        order: "alphabetically"
                    }
                }
            ],
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "default",
                    leadingUnderscore: "forbid",
                    trailingUnderscore: "forbid",
                    format: null
                },
                {
                    selector: "accessor",
                    format: ["camelCase"]
                },
                {
                    selector: ["typeLike"],
                    format: ["PascalCase"]
                },
                {
                    selector: ["classMethod", "function"],
                    format: ["camelCase"]
                },
                {
                    selector: "classProperty",
                    modifiers: ["static", "readonly"],
                    leadingUnderscore: "allow",
                    format: ["camelCase", "UPPER_CASE"]
                },
                {
                    selector: "classProperty",
                    leadingUnderscore: "allow",
                    format: ["camelCase"]
                },
                {
                    selector: ["objectLiteralProperty", "typeProperty"],
                    format: ["camelCase"],
                    filter: {
                        regex: "^([\\[(].*[\\])]|--.*|[A-Za-z]+-[A-Za-z-]*|[A-Z][A-Za-z]*)$",
                        match: false
                    }
                },
                {
                    selector: "parameter",
                    leadingUnderscore: "allow",
                    format: ["camelCase"]
                },
                {
                    selector: "typeParameter",
                    format: ["PascalCase"]
                },
                {
                    selector: "variable",
                    modifiers: ["const"],
                    leadingUnderscore: "allow",
                    format: ["camelCase", "UPPER_CASE"]
                },
                {
                    selector: "variable",
                    leadingUnderscore: "allow",
                    format: ["camelCase"]
                }
            ],
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "after-used",
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_"
                }
            ]
        }
    },
    ...angular.configs.templateRecommended.map(config => ({
        ...config,
        files: ["**/*.html"]
    })),
    {
        files: ["**/*.html"],
        rules: {}
    }
];
