import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campus } from '../entities/campus.entity';
import { Gate } from '../entities/gate.entity';

@Injectable()
export class CampusesService {
  constructor(
    @InjectRepository(Campus) private campusRepo: Repository<Campus>,
    @InjectRepository(Gate) private gateRepo: Repository<Gate>,
  ) {}

  findAll() {
    return this.campusRepo.find({ relations: ['gates'], where: { isActive: true } });
  }

  findGates(campusId?: string) {
    const where = campusId ? { campusId, isActive: true } : { isActive: true };
    return this.gateRepo.find({ where, relations: ['campus'] });
  }

  async createGate(campusId: string, dto: { name: string; location: string; eventModeEnabled?: boolean }) {
    const gate = this.gateRepo.create({ ...dto, campusId });
    return this.gateRepo.save(gate);
  }
}
