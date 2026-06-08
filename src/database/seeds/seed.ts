import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Category } from '../../categories/category.entity';
import { Post, PostStatus } from '../../posts/post.entity';
import { Tag } from '../../tags/tag.entity';
import { User, UserRole } from '../../users/user.entity';

const PASSWORD_SALT_ROUNDS = 12;

const seedCategories = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Software, tools, and engineering topics.',
  },
  {
    name: 'Backend',
    slug: 'backend',
    description: 'APIs, databases, architecture, and server-side development.',
  },
  {
    name: 'Product',
    slug: 'product',
    description: 'Product thinking, planning, and delivery.',
  },
];

const seedTags = [
  { name: 'NestJS', slug: 'nestjs' },
  { name: 'TypeORM', slug: 'typeorm' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'API', slug: 'api' },
];

const seedPosts = [
  {
    title: 'Getting Started with the Weblog API',
    slug: 'getting-started-with-the-weblog-api',
    excerpt: 'A quick overview of the seeded weblog API content.',
    content:
      'This seeded post gives you a stable record to test listing, filtering, and fetching posts by slug.',
    categorySlug: 'technology',
    tagSlugs: ['api', 'nestjs'],
  },
  {
    title: 'PostgreSQL and TypeORM Basics',
    slug: 'postgresql-and-typeorm-basics',
    excerpt: 'A short seeded article about the database layer.',
    content:
      'This seeded post is useful for testing category filters, tag filters, and published post responses.',
    categorySlug: 'backend',
    tagSlugs: ['postgresql', 'typeorm'],
  },
];

async function main() {
  await dataSource.initialize();

  try {
    const user = await seedUser();
    const categories = await seedCategoryRecords();
    const tags = await seedTagRecords();
    await seedPostRecords(user, categories, tags);

    console.log('Seed completed successfully.');
  } finally {
    await dataSource.destroy();
  }
}

async function seedUser(): Promise<User> {
  const usersRepository = dataSource.getRepository(User);
  const email = process.env.SEED_USER_EMAIL ?? 'admin@example.com';
  const existingUser = await usersRepository
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.email = :email', { email })
    .getOne();

  if (existingUser) {
    if (existingUser.role !== UserRole.Admin) {
      existingUser.role = UserRole.Admin;
      await usersRepository.save(existingUser);
    }

    return existingUser;
  }

  const passwordHash = await bcrypt.hash(
    process.env.SEED_USER_PASSWORD ?? 'password123',
    PASSWORD_SALT_ROUNDS,
  );

  return usersRepository.save(
    usersRepository.create({
      name: process.env.SEED_USER_NAME ?? 'Admin User',
      email,
      role: UserRole.Admin,
      passwordHash,
      bio: 'Seeded user for local development.',
    }),
  );
}

async function seedCategoryRecords(): Promise<Map<string, Category>> {
  const categoriesRepository = dataSource.getRepository(Category);
  const categories = new Map<string, Category>();

  for (const seedCategory of seedCategories) {
    const category =
      (await categoriesRepository.findOne({
        where: { slug: seedCategory.slug },
      })) ??
      (await categoriesRepository.save(
        categoriesRepository.create(seedCategory),
      ));

    categories.set(category.slug, category);
  }

  return categories;
}

async function seedTagRecords(): Promise<Map<string, Tag>> {
  const tagsRepository = dataSource.getRepository(Tag);
  const tags = new Map<string, Tag>();

  for (const seedTag of seedTags) {
    const tag =
      (await tagsRepository.findOne({ where: { slug: seedTag.slug } })) ??
      (await tagsRepository.save(tagsRepository.create(seedTag)));

    tags.set(tag.slug, tag);
  }

  return tags;
}

async function seedPostRecords(
  author: User,
  categories: Map<string, Category>,
  tags: Map<string, Tag>,
): Promise<void> {
  const postsRepository = dataSource.getRepository(Post);

  for (const seedPost of seedPosts) {
    const existingPost = await postsRepository.findOne({
      where: { slug: seedPost.slug },
    });

    if (existingPost) {
      continue;
    }

    const category = categories.get(seedPost.categorySlug);
    const postTags = seedPost.tagSlugs
      .map((slug) => tags.get(slug))
      .filter((tag): tag is Tag => Boolean(tag));

    if (!category) {
      throw new Error(`Missing seed category: ${seedPost.categorySlug}`);
    }

    await postsRepository.save(
      postsRepository.create({
        title: seedPost.title,
        slug: seedPost.slug,
        excerpt: seedPost.excerpt,
        content: seedPost.content,
        status: PostStatus.Published,
        publishedAt: new Date(),
        author,
        category,
        tags: postTags,
      }),
    );
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
