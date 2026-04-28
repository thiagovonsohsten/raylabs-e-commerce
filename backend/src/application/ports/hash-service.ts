/**
 * Porta para hashing de senha (abstrai bcrypt).
 */
export interface HashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
