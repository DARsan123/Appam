import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { BlacklistService } from './blacklist.service';
import { BlacklistController } from './blacklist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlacklistEntry])],
  providers: [BlacklistService],
  controllers: [BlacklistController],
  exports: [BlacklistService],
})
export class BlacklistModule {}
