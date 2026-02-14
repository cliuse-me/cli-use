# Agent Instructions

## Release Protocol

Before creating a new release (tagging or publishing), you **MUST** perform the following checks to ensure quality and stability:

1.  **Run Linting**
    Ensure code style and quality standards are met.

    ```bash
    npm run lint
    ```

2.  **Run Build**
    Verify the project compiles successfully.
    ```bash
    npm run build
    ```

**Do not** create a release or push tags if either of these steps fails.
