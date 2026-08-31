import type { Request } from 'express';

export interface AdminIdentity {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  admin: AdminIdentity;
}
