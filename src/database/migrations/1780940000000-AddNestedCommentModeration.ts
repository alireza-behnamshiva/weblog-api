import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNestedCommentModeration1780940000000 implements MigrationInterface {
  name = 'AddNestedCommentModeration1780940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."comments_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD "status" "public"."comments_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "comments" ADD "parentId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_comments_post_status_parent_created" ON "comments" ("postId", "status", "parentId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_parent"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comments_post_status_parent_created"`,
    );
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "parentId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."comments_status_enum"`);
  }
}
