import bcrypt from 'bcryptjs';
import type { HashService } from '@application/ports/hash-service.js';

export class BcryptHashService implements HashService {
  constructor(private readonly rounds = 10) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
