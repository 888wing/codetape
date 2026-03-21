# Component Detection Patterns

Language-specific patterns for detecting components during trace analysis.

---

## TypeScript / JavaScript

**React components**:
- `export default function` or `export default class` in files under `components/`, `pages/`, `app/`
- Named exports: `export function ComponentName` or `export const ComponentName`
- Files with `.tsx` / `.jsx` extensions that return JSX
- Type: `component`

**Next.js conventions**:
- `app/**/page.tsx` -- page components
- `app/**/layout.tsx` -- layout components
- `app/**/route.ts` -- route handlers (type: `route`)
- `app/**/loading.tsx`, `app/**/error.tsx` -- special files
- `pages/**/*.tsx` -- pages router pages
- Type: `page` or `route`

**API routes**:
- Files in `api/`, `routes/`, `controllers/` that export HTTP method handlers
- Express/Fastify: `router.get()`, `router.post()`, `app.get()`, `app.post()`
- Next.js: `export async function GET`, `export async function POST`
- Type: `route`

**Services**:
- `export class *Service` pattern
- Files in `services/`, `lib/` with class or function exports
- Singleton patterns: `export const service = new Service()`
- Type: `service`

**Hooks**:
- Files named `use*.ts` or `use*.tsx`
- Exports functions starting with `use` (React hooks convention)
- Type: `hook`

**Models / Types**:
- Files in `models/`, `types/`, `schemas/`
- `export interface`, `export type`, `export enum` declarations
- Zod schemas: `export const *Schema = z.object()`
- Type: `model`

**Utils**:
- Files in `utils/`, `helpers/`, `lib/` exporting pure functions
- No class declarations, no state, no side effects
- Type: `util`

---

## Python

**FastAPI / Flask routes**:
- Files containing `@app.get`, `@app.post`, `@app.put`, `@app.delete` decorators
- Files containing `@router.get`, `@router.post`, etc.
- Flask blueprints: `@blueprint.route()`
- Type: `route`

**Django**:
- `views.py` -- view functions or class-based views (type: `view`)
- `models.py` -- Django model classes (type: `model`)
- `serializers.py` -- DRF serializer classes (type: `serializer`)
- `urls.py` -- URL configuration (type: `config`)
- `admin.py` -- admin registration (type: `config`)
- `forms.py` -- form classes (type: `model`)

**Classes**:
- `class ClassName:` with 2+ methods (excluding `__init__` alone)
- Type: infer from directory or class name suffix (`*Service` -> `service`, `*Manager` -> `service`)

**Services**:
- Files in `services/`, `core/`
- Classes or functions handling business logic
- Type: `service`

---

## Rust

**Public structs**: `pub struct Name` -- type: `model`
**Public functions**: `pub fn name` -- type: `util` (or `route` if in a handler module)
**Public traits**: `pub trait Name` -- type: `interface`
**Impl blocks**: `impl Name` or `impl Trait for Name` -- associate with the struct
**Module declarations**: `pub mod name` in `lib.rs` or `main.rs` -- type: `module`
**Files in `src/`** with public exports are candidates

---

## Go

**Exported functions**: Capitalized function names (`func HandleRequest`) -- type: `route` or `util`
**Struct declarations**: `type Name struct` -- type: `model`
**Interface definitions**: `type Name interface` -- type: `interface`
**Package organization**:
- `pkg/` -- public library code
- `internal/` -- private application code
- `cmd/` -- entry points (type: `entrypoint`)
- `handlers/` or `api/` -- route handlers (type: `route`)

---

## Swift

**Classes**: `class ClassName` -- type inferred from suffix or directory
**Structs**: `struct StructName` -- type: `model` or `component`
**Protocols**: `protocol ProtocolName` -- type: `interface`
**Enums**: `enum EnumName` -- type: `model`
**SwiftUI views**: structs conforming to `View` protocol (`: View`) -- type: `component`
**Directory conventions**:
- `Views/` -- type: `component`
- `Models/` -- type: `model`
- `Services/` -- type: `service`
- `Components/` -- type: `component`

---

## GDScript (Godot)

**class_name declarations**: `class_name ClassName` -- use as component name
**Node extensions**: `extends Node2D`, `extends Control`, etc. -- type from base class
**Autoloads**: files in `autoload/` -- type: `service`
**Scenes**: `.gd` files in `scenes/` paired with `.tscn` files -- type: `component`
**Scripts**: standalone `.gd` files in `scripts/` or `src/` -- type: `util` or `service`

---

## Generic fallback

When the language is not specifically handled above, apply these rules:

1. Scan files in directories listed in `component_roots` (from `.codetape/config.json`)
2. A file is a component candidate if it:
   - Exports or defines at least one class, function, struct, or type
   - Is NOT a test file (`*test*`, `*spec*`, `__tests__/`)
   - Is NOT a config file (`*.config.*`, `*.json`, `*.yaml`, `*.toml`, `*.env*`)
   - Is NOT a generated file (in `dist/`, `build/`, `node_modules/`, `.next/`)
3. Assign type by directory name:
   - `models/`, `types/`, `schemas/` -> `model`
   - `services/`, `core/`, `lib/` -> `service`
   - `routes/`, `api/`, `controllers/`, `handlers/` -> `route`
   - `views/`, `components/`, `pages/`, `screens/` -> `component`
   - `utils/`, `helpers/` -> `util`
   - Everything else -> `module`
4. If directory name is ambiguous, infer from file content (class with methods -> `service`, pure functions -> `util`, data structures -> `model`)
