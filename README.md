# Agile Executives - Shared Packages

Monorepo containing shared packages used across Agile Executives products.

## Packages

- **@agile-exec/core-frontend** - Core Vue 3 frontend framework with auth, routing, layouts
- **@agile-exec/api-client** - TypeScript API client for backend services  
- **@agile-exec/ui-components** - Reusable UI component library (Calendar, Forms, Charts)
- **@agile-exec/go-modules** - Shared Go modules for backend services

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all packages in dev mode
npm run dev

# Type check all packages
npm run type-check

# Lint all packages
npm run lint
```

### Development Servers

When running `npm run dev`, the following servers will start:

- **unburdy-app**: http://localhost:3000/ (Main application)
- **core-frontend**: http://localhost:3003/ (Component library dev server)
- **api-client**: Watch mode (no server, rebuilds on changes)
- **ui-components**: No server needed (static components)

## Publishing

Packages are published to npm registry (or private registry):

```bash
cd packages/core-frontend
npm version patch
npm publish
```

## Using in Products

### Local Development (npm link)

```bash
# In shared repo
cd packages/core-frontend
npm link

# In product repo
npm link @agile-exec/core-frontend
```

### Production (Published Packages)

```json
{
  "dependencies": {
    "@agile-exec/core-frontend": "^1.0.0",
    "@agile-exec/api-client": "^1.0.0"
  }
}
```

## Structure

```
agile-exec-shared/
├── packages/
│   ├── core-frontend/       # Vue 3 core app framework
│   ├── api-client/          # TypeScript API client
│   ├── ui-components/       # Reusable components
│   └── go-modules/          # Shared Go code
├── package.json             # Workspace root
└── turbo.json              # Build configuration
```
