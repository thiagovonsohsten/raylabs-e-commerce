import { Role } from '../enums.js';
import { Document } from '../value-objects/document.js';
import { Email } from '../value-objects/email.js';

/**
 * Entidade Customer.
 * Não armazena senha em claro — sempre o hash (bcrypt).
 */
export interface CustomerProps {
  id: string;
  name: string;
  email: Email;
  document: Document;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export class Customer {
  constructor(private readonly props: CustomerProps) {}

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): Email {
    return this.props.email;
  }
  get document(): Document {
    return this.props.document;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): Role {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  isAdmin(): boolean {
    return this.props.role === Role.ADMIN;
  }
}
