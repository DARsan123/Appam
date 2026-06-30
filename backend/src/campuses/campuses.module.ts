import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from '../entities/campus.entity';
import { Gate } from '../entities/gate.entity';
import { CampusesService } from './campuses.service';
import { CampusesController } from './campuses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campus, Gate])],
  providers: [CampusesService],
  controllers: [CampusesController],
  exports: [CampusesService],
})
export class CampusesModule {}
