import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  findHosts(search?: string) {
    const where: Record<string, unknown> = { role: UserRole.HOST, isActive: true };
    if (search) {
      return this.userRepo.find({
        where: [
          { ...where, name: Like(`%${search}%`) },
          { ...where, email: Like(`%${search}%`) },
          { ...where, department: Like(`%${search}%`) },
        ],
        relations: ['campus'],
        take: 20,
      });
    }
    return this.userRepo.find({ where, relations: ['campus'], take: 50 });
  }

  findAll() {
    return this.userRepo.find({ relations: ['campus'], order: { name: 'ASC' } });
  }
}
