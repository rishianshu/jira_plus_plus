-- Add MANAGER role value if missing
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';
