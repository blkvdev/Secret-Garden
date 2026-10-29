// Uso: npm run admin:reset -- email@exemplo.com NovaSenhaForte123
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Uso: npm run admin:reset -- email@exemplo.com SenhaComPeloMenos10Caracteres');
  process.exit(1);
}
const db = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);
await db.admin.upsert({ where: { email: email.toLowerCase() }, update: { passwordHash }, create: { email: email.toLowerCase(), passwordHash } });
console.log(`✔ Admin ${email} pronto. Senha redefinida.`);
await db.$disconnect();
