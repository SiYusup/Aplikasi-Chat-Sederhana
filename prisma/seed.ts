import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const ROOMS = ['Umum', 'Tugas', 'Random'] as const;
const WELCOME: Record<(typeof ROOMS)[number], string> = {
  Umum: 'Selamat datang di room Umum! Kenalan secara anonim yuk.',
  Tugas: 'Selamat datang di room Tugas! Diskusi PR dan tugas sekolah di sini.',
  Random: 'Selamat datang di room Random! Ngobrol bebas apa saja.',
};

async function main() {
  const existing = await prisma.globalRoom.count();
  if (existing > 0) {
    console.log(`Seed dilewati: ${existing} room sudah ada.`);
    return;
  }
  const bot = await prisma.user.upsert({
    where: { clerkId: 'system' },
    update: {},
    create: { clerkId: 'system', displayName: 'anonymous' },
  });
  for (const name of ROOMS) {
    const room = await prisma.globalRoom.create({ data: { name } });
    await prisma.globalMessage.create({
      data: {
        roomId: room.id,
        userId: bot.id,
        displayNameSnapshot: 'anonymous',
        body: WELCOME[name],
      },
    });
  }
  console.log(
    `Seed selesai: ${ROOMS.length} room + ${ROOMS.length} pesan sambutan.`,
  );
}

await main();
await prisma.$disconnect();
