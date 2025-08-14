# Repository Guidelines

This repository houses the DMI Engine Antech V6 Integration, a NestJS + TypeScript module distributed as an npm package.

## Project Structure & Module Organization
- `src/`: Integration code
  - `antechV6.module.ts` (main module), `index.ts` (exports), `services/`, `providers/`, `processors/`, `controllers/`, `constants/`, `filters/`, `interfaces/`, `antechV6-api/`
  - `main.ts` enables local microservice run (MQTT).
- `test/`: E2E tests (e.g., `test/**/**/*.e2e-spec.ts`).
- `lib/`: TypeScript build output.
- Config: `.eslintrc.js`, `.prettierrc`, `tsconfig*.json`, `nest-cli.json`. CI: `.github/workflows/publish-package.yml`.

## Build, Test, and Development Commands
- `npm run build`: Compile TypeScript to `lib/`.
- `npm run dev`: Watch-compile and `yalc publish --push` for local linking.
- `npm run start` / `start:dev`: Run the Nest app (useful for manual/local testing).
- `npm run lint` / `npm run format`: Lint and format code.
- `npm test` | `test:watch` | `test:cov` | `test:e2e`: Unit, watch, coverage, and E2E.

## Coding Style & Naming Conventions
- Language: TypeScript. Prettier: single quotes, no semicolons, width 100, trailing commas.
- ESLint: `@typescript-eslint` with Prettier integration; fixable issues auto-fixed in CI hooks.
- Filenames: Nest patterns (`*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.processor.ts`). Keep existing `antechV6-*` naming.

## Testing Guidelines
- Unit tests: colocate in `src/**` as `*.spec.ts` (Jest + ts-jest).
- E2E: place in `test/**` as `*.e2e-spec.ts` (see `test/jest-e2e.json`).
- Run `npm run test:cov`; maintain meaningful coverage for new/changed code.

## Commit & Pull Request Guidelines
- Commits: imperative mood, reference issues (e.g., `[ #26 ] Fix …`), optional Conventional Commit prefixes (`chore:`, `fix:`) are welcome.
- PRs: include description, linked issues, steps to validate, and logs/screenshots if behavior changes. Ensure `npm run lint && npm test` pass.

## Agent Final Notes
- When finishing a task, include a "Commit message" section in your final notes with a single-line commit message summarizing all current uncommitted changes (from `git diff`), not just the last change.

## Security & Configuration Tips
- Do not commit secrets. Use environment config; the host app must provide `mqtt` and `redis` via `ConfigModule` (`ConfigService.get('mqtt'|'redis')`). See `src/.env` example for Redis.
- Publishing: tags `v*` trigger GitHub Packages; `GHP_TOKEN` is required (see `.npmrc` and workflow).
- Avoid committing large logs (e.g., `engine.log`).
