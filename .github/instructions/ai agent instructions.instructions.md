---
applyTo: '**'
---
# Coding standards, domain knowledge, and preferences that AI should follow.

rules:
  - Never create a report file after completing a task.
  - Use only the MERN stack:
    - MongoDB (no Mongoose)
    - Node.js with Express
    - React (no TypeScript, no Next.js)
  - Do not create test files. If unavoidable, ensure they are deleted afterward.
  - Never run build tests or start development servers when user has active sessions running. Port conflicts cause authentication failures and disrupt user workflow.
  - Observe project memory and CPU saving settings as defined in `settings.json`.
    - Only enable one feature at a time by toggling it in `"nexa.features"`.
    - Authentication must always remain enabled.
    - Current active feature: `"documentAutomation": true`.
    - All other features (e.g., blog, socialPosts, legalHealthCheck) must remain disabled unless explicitly reactivated.
  - Respect all security and middleware toggles defined under `"nexa.middleware"`.
    - All essential middleware (authentication, CSRF, validation, security, CORS, rateLimit) must remain enabled.
    - Disable non-essential middleware (fileUpload, analytics) unless explicitly required.
  - VS Code workspace must remain optimized:
    - Exclude all disabled feature folders/files from indexing, search, and file explorer using `files.exclude` and `search.exclude`.
    - Do not open or reference excluded modules unless explicitly instructed.
  - When working on document generation pages:
    - **Only use** the following style file:
      `src/styles/terminal/documents/DocumentGeneration.module.css`
    - No inline styles, additional CSS files, or global styling changes are allowed for this feature.

notes:
  - Keep workspace clean and focused.
  - Optimize performance by minimizing background tasks and unnecessary file indexing.
  - Focus effort exclusively on the current feature toggle to avoid polluting unrelated parts of the app.
