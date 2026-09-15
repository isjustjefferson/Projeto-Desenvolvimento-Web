import { Module } from '@nestjs/common';
import { StoreService } from './store.service.js';

@Module({
  providers: [StoreService],
  exports: [StoreService],
})
export class DadosModule {}