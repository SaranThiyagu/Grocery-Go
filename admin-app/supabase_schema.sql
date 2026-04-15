-- ============================================================
-- Orderly Admin Panel - Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (for cuid-like IDs via gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AdminUser
-- ============================================================
CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "email"     TEXT        NOT NULL,
  "name"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");

-- ============================================================
-- Post
-- ============================================================
CREATE TABLE IF NOT EXISTS "Post" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "title"     TEXT        NOT NULL,
  "content"   TEXT,
  "published" BOOLEAN     NOT NULL DEFAULT FALSE,
  "authorId"  TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- User
-- ============================================================
CREATE TABLE IF NOT EXISTS "User" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"          TEXT,
  "email"         TEXT,
  "emailVerified" TIMESTAMP(3),
  "image"         TEXT,
  "avatar"        TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- ============================================================
-- Account
-- ============================================================
CREATE TABLE IF NOT EXISTS "Account" (
  "id"                TEXT    NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"            TEXT    NOT NULL,
  "type"              TEXT    NOT NULL,
  "provider"          TEXT    NOT NULL,
  "providerAccountId" TEXT    NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- ============================================================
-- Session
-- ============================================================
CREATE TABLE IF NOT EXISTS "Session" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "sessionToken" TEXT        NOT NULL,
  "userId"       TEXT        NOT NULL,
  "expires"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- ============================================================
-- VerificationToken
-- ============================================================
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT        NOT NULL,
  "token"      TEXT        NOT NULL,
  "expires"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- ============================================================
-- Product
-- ============================================================
CREATE TABLE IF NOT EXISTS "Product" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"        TEXT        NOT NULL,
  "description" TEXT,
  "price"       DOUBLE PRECISION NOT NULL,
  "image"       TEXT,
  "category"    TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- Order
-- ============================================================
CREATE TABLE IF NOT EXISTS "Order" (
  "id"          SERIAL,
  "userId"      TEXT             NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status"      TEXT             NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- ============================================================
-- OrderItem
-- ============================================================
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id"        TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "orderId"   INTEGER          NOT NULL,
  "productId" TEXT             NOT NULL,
  "quantity"  INTEGER          NOT NULL,
  "price"     DOUBLE PRECISION NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id"),
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

-- ============================================================
-- Cart
-- ============================================================
CREATE TABLE IF NOT EXISTS "Cart" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_userId_key" ON "Cart"("userId");

-- ============================================================
-- CartItem
-- ============================================================
CREATE TABLE IF NOT EXISTS "CartItem" (
  "id"        TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "cartId"    TEXT             NOT NULL,
  "productId" TEXT             NOT NULL,
  "quantity"  INTEGER          NOT NULL,
  "price"     DOUBLE PRECISION NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id"),
  CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

-- ============================================================
-- Auto-update updatedAt trigger (optional but recommended)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER "AdminUser_updatedAt" BEFORE UPDATE ON "AdminUser" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER "User_updatedAt"      BEFORE UPDATE ON "User"      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER "Product_updatedAt"   BEFORE UPDATE ON "Product"   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER "Order_updatedAt"     BEFORE UPDATE ON "Order"     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER "Cart_updatedAt"      BEFORE UPDATE ON "Cart"      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER "Post_updatedAt"      BEFORE UPDATE ON "Post"      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
