# Agent Instructions

## Release Protocol

To create a new release (tagging, pushing, publishing to npm, and creating GitHub releases), use the automated release command.

### **Usage**

Simply run the following command in your terminal and follow the interactive prompts:

```bash
npm run release
```

### **What this does**

The `npm run release` command (powered by `np`) automatically handles the entire release lifecycle:

1.  **Prerequisite Check**: Runs `npm run lint` and `npm run build` (via the `test` script) to ensure quality and stability. If these fail, the release is aborted.
2.  **Version Bump**: Asks you for the new version (patch, minor, major).
3.  **Git Operations**: Creates a commit and a tag for the new version.
4.  **Publishing**: Pushes commits/tags to GitHub and publishes the package to `npm` (handling 2FA if enabled).
5.  **GitHub Release**: Creates a release on GitHub.

**Important:** You must be logged in to npm (`npm login`) before running this command.
