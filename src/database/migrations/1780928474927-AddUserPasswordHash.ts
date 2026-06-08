import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPasswordHash1780928474927 implements MigrationInterface {
  name = 'AddUserPasswordHash1780928474927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordHash" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
  }
}
