module.exports = {
    arrowParens: "avoid",
    bracketSameLine: true,
    bracketSpacing: true,
    // Keeps each file's line endings, so a CRLF checkout on Windows passes the same check as CI.
    endOfLine: "auto",
    printWidth: 120,
    singleQuote: false,
    tabWidth: 4,
    trailingComma: "none",
    overrides: [
        {
            // Workflows and qodana.yaml keep the two-space indent YAML files usually have.
            files: ["*.yml", "*.yaml"],
            options: { tabWidth: 2 }
        }
    ]
};
