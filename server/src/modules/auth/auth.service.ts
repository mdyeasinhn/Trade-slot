import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import type { LoginInput, RegisterInput } from './auth.validation';

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    traderId?: string;
  };
}

/// Register a user; creates a Business + Trader for the new account.
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict('An account with that email already exists.');

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        role: 'TRADER',
      },
    });

    const business = await tx.business.create({
      data: { name: input.businessName ?? `${input.name}'s Business` },
    });

    const trader = await tx.trader.create({
      data: {
        businessId: business.id,
        userId: created.id,
        name: input.name,
        phone: input.phone,
      },
    });

    return { ...created, traderId: trader.id };
  });

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      traderId: user.traderId,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { trader: { select: { id: true } } },
  });
  if (!user) throw AppError.unauthorized('Invalid email or password.');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid email or password.');

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      traderId: user.trader?.id,
    },
  };
}