# Skill-Exchange Agent Guide

## Purpose
This repository is a full-stack Sri Lankan services marketplace (LankaFIX / WedaLK) with:
- **Backend:** Spring Boot 3.2 (Java 17), JWT auth, Spring Security, JPA, PostgreSQL
- **Frontend:** React 19 (CRA), React Router 7, Axios, Tailwind CSS
- **Roles:** `SEEKER`, `WORKER`, `ADMIN`

## Repository Structure
- `backend\WedaLK\demo\` - Spring Boot API
- `frontend\` - React web app
- `docs\` - API and sprint implementation docs
- `uploads\` - runtime-uploaded files
- `docker-compose.yml` - currently empty placeholder
- `GIT_WORKFLOW.md` - branch/PR workflow used by the team

## Architecture and Contracts
- Backend is organized by feature modules (`auth`, `users`, `requests`, `quotes`, `reviews`, `disputes`, `verification`, `admin`), each with controller/service/repository/model/dto pattern.
- Security is JWT stateless (`SecurityConfig`, `JwtAuthenticationFilter`), with role-based endpoint protection.
- Frontend routes are role-guarded in `frontend\src\App.js` using `ProtectedRoute` and `RequireWorkerProfile`.
- Frontend API calls are centralized under `frontend\src\services\*` and use `apiClient.js` with auth header interceptor.
- Backend responses commonly use `common\ApiResponse` wrapper; frontend services usually consume `response.data.data`.
- AI-assisted request drafting is exposed through `POST /api/requests/ai-description` and the frontend request form shows the `AI Assist` action plus `ErrorBanner` feedback.

## Run, Build, and Test
Use these commands from repo root:

### Backend (`backend\WedaLK\demo`)
- Install/build: `.\mvnw.cmd clean package`
- Run dev server: `.\mvnw.cmd spring-boot:run`
- Run tests: `.\mvnw.cmd test`

### Frontend (`frontend`)
- Install deps: `npm install`
- Run dev server: `npm start`
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm test -- --watchAll=false`

## Environment and Configuration
- Backend settings: `backend\WedaLK\demo\src\main\resources\application.properties`
- Default backend port: `8081`
- Frontend API URL env: `REACT_APP_API_URL` (defaults to `http://localhost:8081/api`)
- Backend expects PostgreSQL (`spring.datasource.*`) and JWT env values (`JWT_SECRET`, `JWT_EXPIRATION_MS`).
- AI assist backend config uses Gemini environment values: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL`, and `AI_TIMEOUT_MS`. Do not commit API keys into `application.properties`.

## Coding Conventions

### Backend (Spring Boot)
- Keep feature boundaries: place new code in the existing module structure (controller/service/repository/dto/model).
- Use constructor injection and existing exception handling patterns (`common\GlobalExceptionHandler`, custom exceptions).
- Preserve RBAC rules and ownership checks in services when adding/changing endpoints.
- Reuse enums from `common\enums` for statuses/categories.

### Frontend (React)
- Add route changes in `src\App.js` and keep role-based guards consistent.
- Keep API logic in `src\services\` (avoid direct axios calls inside page components).
- Reuse shared UI/components in `src\components\common` and `src\components\ui`.
- Keep auth/token behavior consistent with `src\utils\storage.js` and `src\services\apiClient.js`.
- For SCRUM-98, keep the request creation AI assist flow aligned with the backend contract: the frontend should block generation without a job title and category, disable the description field while generating, and show `ErrorBanner` on provider failure.

## Project-Specific Guardrails
- Do not replace or bypass JWT + role checks to “simplify” flows.
- Do not break the existing `ApiResponse` payload shape expected by frontend services.
- Do not hardcode secrets; keep credential values in environment/config.
- Do not assume Docker is configured; local dev setup is the current baseline.
- Keep changes scoped; avoid cross-module refactors unless required by the task.

## Git and Delivery Workflow
- Follow `GIT_WORKFLOW.md`:
  - branch from latest `main`
  - commit in feature branch
  - run backend/frontend checks before merge
  - prefer PR-based merge

## Source References
- `backend\WedaLK\demo\pom.xml`
- `backend\WedaLK\demo\src\main\java\lk\wedalk\WedaLkApplication.java`
- `backend\WedaLK\demo\src\main\java\lk\wedalk\config\SecurityConfig.java`
- `backend\WedaLK\demo\src\main\resources\application.properties`
- `frontend\package.json`
- `frontend\src\App.js`
- `frontend\src\services\apiClient.js`
- `GIT_WORKFLOW.md`
