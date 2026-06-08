import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeblogSchema1780920683482 implements MigrationInterface {
  name = 'CreateWeblogSchema1780920683482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "email" character varying(180) NOT NULL, "bio" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authorName" character varying(120) NOT NULL, "authorEmail" character varying(180), "content" text NOT NULL, "postId" uuid NOT NULL, "authorId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(80) NOT NULL, "slug" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE ("slug"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."posts_status_enum" AS ENUM('draft', 'published')`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(180) NOT NULL, "slug" character varying(220) NOT NULL, "excerpt" character varying(300) NOT NULL, "content" text NOT NULL, "status" "public"."posts_status_enum" NOT NULL DEFAULT 'draft', "authorId" uuid NOT NULL, "categoryId" uuid NOT NULL, "publishedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_tags" ("postId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "PK_ba869415ada9d211d8af980499f" PRIMARY KEY ("postId", "tagId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76e701b89d9bba541e1543adfa" ON "post_tags"  ("postId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86fabcae8483f7cc4fbd36cf6a" ON "post_tags"  ("tagId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_4548cc4a409b8651ec75f70e280" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_168bf21b341e2ae340748e2541d" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_tags" ADD CONSTRAINT "FK_76e701b89d9bba541e1543adfac" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_tags" ADD CONSTRAINT "FK_86fabcae8483f7cc4fbd36cf6a2" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_tags" DROP CONSTRAINT "FK_86fabcae8483f7cc4fbd36cf6a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_tags" DROP CONSTRAINT "FK_76e701b89d9bba541e1543adfac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_168bf21b341e2ae340748e2541d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_4548cc4a409b8651ec75f70e280"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86fabcae8483f7cc4fbd36cf6a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76e701b89d9bba541e1543adfa"`,
    );
    await queryRunner.query(`DROP TABLE "post_tags"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
