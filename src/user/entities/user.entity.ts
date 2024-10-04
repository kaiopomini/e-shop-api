import { Role } from '@prisma/client';

export class User {
  id?: string;
  email: string;
  hash?: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
