# Weblog API

NestJS weblog REST API built with TypeScript, TypeORM, and PostgreSQL.

## Features

- Authentication with JWT
- Password hashing with bcrypt
- Admin and user roles
- Owner-only post updates/deletes
- Admin-only user/category/tag management
- Comment ownership with admin moderation access
- Posts, categories, tags, users, and comments CRUD
- Slug generation and normalization
- TypeORM migrations
- Idempotent database seeding
- Swagger/OpenAPI documentation
- Global validation and normalized error responses

## Requirements

- Node.js
- npm
- PostgreSQL

The local database used by default is:

```text
database: weblog_api
username: postgres
password: postgres
```

## Setup

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Default `.env` values:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=weblog_api

JWT_SECRET=change-me-in-development
JWT_EXPIRES_IN=1d

SEED_USER_NAME=Admin User
SEED_USER_EMAIL=admin@example.com
SEED_USER_PASSWORD=password123
```

Run migrations:

```bash
npm run migration:run
```

Seed local data:

```bash
npm run seed
```

Start the app:

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3000
```

## Default Admin

After running `npm run seed`, you can log in with:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

## Documentation

Swagger UI:

```text
http://localhost:3000/api-docs
```

OpenAPI JSON:

```text
http://localhost:3000/api-docs-json
```

You can import the OpenAPI JSON URL into Apidog.

## Main Endpoints

Auth:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Users:

```text
POST   /users
GET    /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

Categories:

```text
POST   /categories
GET    /categories
GET    /categories/:id
GET    /categories/slug/:slug
PATCH  /categories/:id
DELETE /categories/:id
```

Tags:

```text
POST   /tags
GET    /tags
GET    /tags/:id
GET    /tags/slug/:slug
PATCH  /tags/:id
DELETE /tags/:id
```

Posts:

```text
POST   /posts
GET    /posts
GET    /posts/:id
GET    /posts/slug/:slug
PATCH  /posts/:id
DELETE /posts/:id
```

Comments:

```text
POST   /comments
GET    /comments
GET    /comments/:id
PATCH  /comments/:id
DELETE /comments/:id
```

## Authorization Rules

- Public users can read posts, categories, and tags.
- A regular user can create posts and comments.
- A regular user can update/delete only their own posts.
- A regular user can update/delete only their own comments.
- Admins can manage users, categories, tags, and comments.
- Admins cannot update/delete posts owned by other users or admins.

Use this header for protected endpoints:

```text
Authorization: Bearer <accessToken>
```

## Scripts

```bash
npm run start:dev
npm run build
npm run lint
npm test
npm run test:e2e
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert
npm run seed
```

## Testing

Run unit tests:

```bash
npm test
```

Run e2e tests:

```bash
npm run test:e2e
```

E2E tests require PostgreSQL and the migrations to be applied.
