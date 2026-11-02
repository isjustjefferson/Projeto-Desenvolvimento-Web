import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeormConfig } from './typeorm.config.js';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

@Module({
  imports: isTest ? [] : [TypeOrmModule.forRoot(typeormConfig)],
})
export class DatabaseModule {}
