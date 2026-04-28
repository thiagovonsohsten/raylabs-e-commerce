import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Seed inicial: 1 admin, 1 cliente demo e alguns produtos.
 * É idempotente — usa upsert por e-mail/nome.
 */
const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminPwd = await bcrypt.hash('admin123', 10);
  await prisma.customer.upsert({
    where: { email: 'admin@raylabs.dev' },
    create: {
      name: 'Admin RayLabs',
      email: 'admin@raylabs.dev',
      document: '11144477735', // CPF válido
      passwordHash: adminPwd,
      role: Role.ADMIN,
    },
    update: { passwordHash: adminPwd, role: Role.ADMIN },
  });

  // Cliente demo
  const customerPwd = await bcrypt.hash('cliente123', 10);
  await prisma.customer.upsert({
    where: { email: 'cliente@raylabs.dev' },
    create: {
      name: 'Cliente Demo',
      email: 'cliente@raylabs.dev',
      document: '52998224725', // CPF válido
      passwordHash: customerPwd,
      role: Role.CUSTOMER,
    },
    update: { passwordHash: customerPwd },
  });

  // Produtos demo
  const products = [
    { name: 'Notebook Pro 14"', priceCents: 729900n, stock: 10 },
    { name: 'Mouse Sem Fio Ergonômico', priceCents: 14990n, stock: 50 },
    { name: 'Teclado Mecânico RGB', priceCents: 39990n, stock: 25 },
    { name: 'Monitor 27" 4K', priceCents: 199900n, stock: 8 },
    { name: 'Webcam Full HD', priceCents: 24990n, stock: 30 },
    { name: 'Headset Gamer', priceCents: 34990n, stock: 0 }, // sem estoque (testar CANCELLED)
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: { priceCents: p.priceCents, stock: p.stock },
      });
    }
  }

  console.log('Seed aplicado com sucesso.');
  console.log('Admin: admin@raylabs.dev / admin123');
  console.log('Cliente: cliente@raylabs.dev / cliente123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
