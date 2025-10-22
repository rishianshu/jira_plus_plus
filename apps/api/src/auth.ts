import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { CredentialType, type Role, type User } from "@platform/cdm";
import { withTenant } from "@platform/clients";
import { prisma } from "./prisma.js";
import { getEnv } from "./env.js";
import type { AuthenticatedUser } from "./context.js";

const TOKEN_EXPIRES_IN = "12h";
const BCRYPT_ROUNDS = 12;
const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%&*?";

interface JwtPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createAuthToken(user: AuthenticatedUser): string {
  const env = getEnv();
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.SESSION_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  );
}

export function verifyAuthToken(token: string): JwtPayload | null {
  const env = getEnv();

  try {
    return jwt.verify(token, env.SESSION_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

function deriveEncryptionKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

export function generateTemporaryPassword(length = 16): string {
  if (length <= 0) {
    throw new Error("Password length must be positive");
  }

  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let index = 0; index < length; index += 1) {
    const charIndex = bytes[index] % PASSWORD_ALPHABET.length;
    password += PASSWORD_ALPHABET.charAt(charIndex);
  }
  return password;
}

export function encryptSecret(value: string): string {
  const env = getEnv();
  const iv = crypto.randomBytes(12);
  const key = deriveEncryptionKey(env.ENCRYPTION_SECRET);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decryptSecret(cipherText: string): string {
  const env = getEnv();
  const decoded = Buffer.from(cipherText, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as { iv: string; tag: string; data: string };
  const key = deriveEncryptionKey(env.ENCRYPTION_SECRET);

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export async function resolveUserFromRequest(
  req?: IncomingMessage,
): Promise<AuthenticatedUser | null> {
  if (!req?.headers.authorization) {
    return null;
  }

  const token = req.headers.authorization.replace("Bearer ", "").trim();
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload?.sub) {
    return null;
  }

  const env = getEnv();

  const user = await withTenant(prisma, env.TENANT_ID, (tx) =>
    tx.user.findUnique({
      where: { id: payload.sub },
    }),
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function seedAdminUser(): Promise<User> {
  const env = getEnv();
  const tenantId = env.TENANT_ID;

  return withTenant(prisma, tenantId, async (tx) => {
    const existing = await tx.user.findUnique({
      where: { tenantId_email: { tenantId, email: env.ADMIN_EMAIL } },
      include: { credential: true },
    });

    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

    if (!existing) {
      return tx.user.create({
        data: {
          tenantId,
          email: env.ADMIN_EMAIL,
          displayName: env.ADMIN_DISPLAY_NAME,
          role: "ADMIN",
          credential: {
            create: {
              tenantId,
              type: CredentialType.LOCAL,
              secretHash: passwordHash,
            },
          },
        },
      });
    }

    const updates: Partial<User> = {};

    if (existing.role !== "ADMIN") {
      updates.role = "ADMIN";
    }

    if (Object.keys(updates).length > 0) {
      await tx.user.update({
        where: { id: existing.id },
        data: updates,
      });
    }

    if (existing.credential) {
      const isSamePassword = await verifyPassword(env.ADMIN_PASSWORD, existing.credential.secretHash);
      if (!isSamePassword) {
        await tx.credential.update({
          where: { id: existing.credential.id },
          data: { secretHash: passwordHash },
        });
      }
    } else {
      await tx.credential.create({
        data: {
          tenantId,
          type: CredentialType.LOCAL,
          secretHash: passwordHash,
          userId: existing.id,
        },
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: existing.id },
    });
  });
}
