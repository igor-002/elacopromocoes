CREATE TYPE "Marketplace" AS ENUM ('AMAZON', 'MERCADO_LIVRE');
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');
CREATE TYPE "DestinationChannel" AS ENUM ('TELEGRAM', 'WHATSAPP');
CREATE TYPE "PublicationStatus" AS ENUM ('SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'UNKNOWN', 'CANCELLED');

CREATE TABLE "Admin" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Offer" (
  "id" UUID NOT NULL,
  "marketplace" "Marketplace" NOT NULL,
  "productId" TEXT,
  "fingerprint" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "imageUrl" TEXT,
  "currentPriceCents" INTEGER NOT NULL,
  "originalPriceCents" INTEGER,
  "coupon" TEXT,
  "category" TEXT,
  "headline" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Destination" (
  "id" UUID NOT NULL,
  "channel" "DestinationChannel" NOT NULL,
  "name" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Publication" (
  "id" UUID NOT NULL,
  "offerId" UUID NOT NULL,
  "destinationId" UUID NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'SCHEDULED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "externalMessageId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationSetting" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL,
  "adminId" UUID,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE UNIQUE INDEX "Offer_fingerprint_key" ON "Offer"("fingerprint");
CREATE INDEX "Offer_status_createdAt_idx" ON "Offer"("status", "createdAt");
CREATE INDEX "Offer_marketplace_productId_idx" ON "Offer"("marketplace", "productId");
CREATE UNIQUE INDEX "Destination_channel_externalId_key" ON "Destination"("channel", "externalId");
CREATE INDEX "Destination_deletedAt_enabled_idx" ON "Destination"("deletedAt", "enabled");
CREATE INDEX "Publication_status_scheduledAt_idx" ON "Publication"("status", "scheduledAt");
CREATE INDEX "Publication_offerId_idx" ON "Publication"("offerId");
CREATE INDEX "Publication_destinationId_idx" ON "Publication"("destinationId");
CREATE UNIQUE INDEX "IntegrationSetting_key_key" ON "IntegrationSetting"("key");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

ALTER TABLE "Publication" ADD CONSTRAINT "Publication_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
