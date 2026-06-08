import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { User, UserRole } from '../src/users/user.entity';

type SluggedResourceResponse = {
  id: string;
  name: string;
  slug: string;
};

type PostResponse = {
  id: string;
  slug: string;
};

type CommentResponse = {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  parentId?: string | null;
  children?: CommentResponse[];
};

type PaginatedCommentResponse = {
  items: CommentResponse[];
};

const formatValidationErrors = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...formatValidationErrors(error.children ?? []),
  ]);

describe('Weblog API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let httpServer: Parameters<typeof request>[0];
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) =>
          new BadRequestException(formatValidationErrors(errors)),
      }),
    );

    await app.init();

    dataSource = app.get(DataSource);
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const register = async (email: string) => {
    const response = await request(httpServer)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'password123',
      })
      .expect(201);

    return response.body as {
      accessToken: string;
      tokenType: string;
      user: { id: string; email: string; role: UserRole };
    };
  };

  const login = async (email: string) => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        email,
        password: 'password123',
      })
      .expect(201);

    return response.body as {
      accessToken: string;
      user: { id: string; email: string; role: UserRole };
    };
  };

  const promoteToAdmin = async (email: string) => {
    await dataSource
      .getRepository(User)
      .update({ email }, { role: UserRole.Admin });
  };

  it('returns health status', async () => {
    await request(httpServer).get('/').expect(200).expect({
      name: 'weblog-api',
      status: 'ok',
    });
  });

  it('registers, logs in, and returns the authenticated profile', async () => {
    const email = `auth-${suffix}@example.com`;
    const registered = await register(email);

    expect(registered.tokenType).toBe('Bearer');
    expect(registered.user.email).toBe(email);
    expect(registered.user.role).toBe(UserRole.User);

    const loggedIn = await login(email);
    expect(loggedIn.accessToken).toEqual(expect.any(String));

    const profile = await request(httpServer)
      .get('/auth/me')
      .set('Authorization', `Bearer ${loggedIn.accessToken}`)
      .expect(200);

    expect(profile.body).toMatchObject({
      id: registered.user.id,
      email,
      role: UserRole.User,
    });
  });

  it('allows admin-only category creation and rejects regular users', async () => {
    const user = await register(`category-user-${suffix}@example.com`);
    const adminEmail = `category-admin-${suffix}@example.com`;

    await register(adminEmail);
    await promoteToAdmin(adminEmail);
    const admin = await login(adminEmail);

    await request(httpServer)
      .post('/categories')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: `Forbidden Category ${suffix}` })
      .expect(403);

    const response = await request(httpServer)
      .post('/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: `Allowed Category ${suffix}` })
      .expect(201);
    const category = response.body as SluggedResourceResponse;

    expect(category).toMatchObject({
      name: `Allowed Category ${suffix}`,
      slug: `allowed-category-${suffix}`,
    });

    const bySlug = await request(httpServer)
      .get(`/categories/slug/Allowed%20Category%20${suffix}`)
      .expect(200);
    const categoryBySlug = bySlug.body as SluggedResourceResponse;

    expect(categoryBySlug.id).toBe(category.id);
  });

  it('keeps posts owner-only even when requester is admin', async () => {
    const user = await register(`post-owner-${suffix}@example.com`);
    const adminEmail = `post-admin-${suffix}@example.com`;

    await register(adminEmail);
    await promoteToAdmin(adminEmail);
    const admin = await login(adminEmail);

    const category = await request(httpServer)
      .post('/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: `Post Category ${suffix}` })
      .expect(201);
    const categoryBody = category.body as SluggedResourceResponse;

    const post = await request(httpServer)
      .post('/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: `Slug Normalized Post ${suffix}`,
        slug: ` Slug Normalized Post !!! ${suffix} `,
        excerpt: 'This excerpt is long enough.',
        content: 'This content is long enough for validation.',
        categoryId: categoryBody.id,
      })
      .expect(201);
    const postBody = post.body as PostResponse;

    expect(postBody.slug).toBe(`slug-normalized-post-${suffix}`);

    await request(httpServer)
      .patch(`/posts/${postBody.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Admin cannot edit this post' })
      .expect(403);

    const bySlug = await request(httpServer)
      .get(`/posts/slug/Slug%20Normalized%20Post%20${suffix}`)
      .expect(200);
    const postBySlug = bySlug.body as PostResponse;

    expect(postBySlug.id).toBe(postBody.id);
  });

  it('supports tag lookup by slug', async () => {
    const adminEmail = `tag-admin-${suffix}@example.com`;

    await register(adminEmail);
    await promoteToAdmin(adminEmail);
    const admin = await login(adminEmail);

    const tag = await request(httpServer)
      .post('/tags')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: `E2E Tag ${suffix}` })
      .expect(201);
    const tagBody = tag.body as SluggedResourceResponse;

    const bySlug = await request(httpServer)
      .get(`/tags/slug/E2E%20Tag%20${suffix}`)
      .expect(200);
    const tagBySlug = bySlug.body as SluggedResourceResponse;

    expect(tagBySlug.id).toBe(tagBody.id);
  });

  it('supports nested comment moderation', async () => {
    const user = await register(`comment-user-${suffix}@example.com`);
    const adminEmail = `comment-admin-${suffix}@example.com`;

    await register(adminEmail);
    await promoteToAdmin(adminEmail);
    const admin = await login(adminEmail);

    const category = await request(httpServer)
      .post('/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: `Comment Category ${suffix}` })
      .expect(201);
    const categoryBody = category.body as SluggedResourceResponse;

    const post = await request(httpServer)
      .post('/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: `Commented Post ${suffix}`,
        excerpt: 'This excerpt is long enough.',
        content: 'This content is long enough for validation.',
        categoryId: categoryBody.id,
        status: 'published',
      })
      .expect(201);
    const postBody = post.body as PostResponse;

    const rootCommentResponse = await request(httpServer)
      .post('/comments')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        authorName: 'Comment User',
        content: 'Root comment waiting for approval.',
        postId: postBody.id,
      })
      .expect(201);
    const rootComment = rootCommentResponse.body as CommentResponse;

    expect(rootComment.status).toBe('pending');

    const moderationList = await request(httpServer)
      .get('/comments/moderation?status=pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const moderationBody = moderationList.body as PaginatedCommentResponse;

    expect(
      moderationBody.items.some((comment) => comment.id === rootComment.id),
    ).toBe(true);

    await request(httpServer)
      .patch(`/comments/${rootComment.id}/moderate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'approved' })
      .expect(200);

    const replyResponse = await request(httpServer)
      .post('/comments')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        authorName: 'Comment User',
        content: 'Approved nested reply.',
        postId: postBody.id,
        parentId: rootComment.id,
      })
      .expect(201);
    const reply = replyResponse.body as CommentResponse;

    await request(httpServer)
      .patch(`/comments/${reply.id}/moderate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'approved' })
      .expect(200);

    const publicComments = await request(httpServer)
      .get(`/comments?postId=${postBody.id}`)
      .expect(200);
    const publicCommentsBody = publicComments.body as PaginatedCommentResponse;
    const comments = publicCommentsBody.items;
    const publicRoot = comments.find(
      (comment) => comment.id === rootComment.id,
    );

    expect(publicRoot?.children?.[0]).toMatchObject({
      id: reply.id,
      parentId: rootComment.id,
      status: 'approved',
    });
  });

  it('restores soft-deleted owner posts', async () => {
    const user = await register(`restore-user-${suffix}@example.com`);
    const adminEmail = `restore-admin-${suffix}@example.com`;

    await register(adminEmail);
    await promoteToAdmin(adminEmail);
    const admin = await login(adminEmail);

    const category = await request(httpServer)
      .post('/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: `Restore Category ${suffix}` })
      .expect(201);
    const categoryBody = category.body as SluggedResourceResponse;

    const post = await request(httpServer)
      .post('/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: `Restorable Post ${suffix}`,
        excerpt: 'This excerpt is long enough.',
        content: 'This content is long enough for validation.',
        categoryId: categoryBody.id,
      })
      .expect(201);
    const postBody = post.body as PostResponse;

    await request(httpServer)
      .delete(`/posts/${postBody.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    await request(httpServer).get(`/posts/${postBody.id}`).expect(404);

    const restored = await request(httpServer)
      .patch(`/posts/${postBody.id}/restore`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect((restored.body as PostResponse).id).toBe(postBody.id);
  });
});
