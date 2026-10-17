-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "clerkId" TEXT NOT NULL,
    "displayName" VARCHAR(30) NOT NULL DEFAULT 'anonymous',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_messages" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayNameSnapshot" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE INDEX "global_messages_roomId_createdAt_idx" ON "global_messages"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "global_messages" ADD CONSTRAINT "global_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "global_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_messages" ADD CONSTRAINT "global_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
