-- AlterEnum: add multimodal assistant modes (additive, idempotent)
ALTER TYPE "AiMode" ADD VALUE IF NOT EXISTS 'PLANT_ID';
ALTER TYPE "AiMode" ADD VALUE IF NOT EXISTS 'MEDICAL_DEVICE';
ALTER TYPE "AiMode" ADD VALUE IF NOT EXISTS 'STUDENT';
