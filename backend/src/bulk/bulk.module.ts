import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { VisitsModule } from '../visits/visits.module';

@Module({
  imports: [VisitsModule],
  controllers: [BulkController],
})
export class BulkModule {}
