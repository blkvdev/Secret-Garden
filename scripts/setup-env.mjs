import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (existsSync('.env')) {
  console.log('✔ Arquivo .env já existe — mantendo as configurações atuais.');
} else {
  const password = randomBytes(9).toString('base64url');
  writeFileSync('.env', [
    `JWT_SECRET="${randomBytes(48).toString('hex')}"`,
    `ADMIN_EMAIL="admin@secretgarden.com.br"`,
    `ADMIN_PASSWORD="${password}"`,
    '',
  ].join('\n'));
  console.log('✔ Arquivo .env criado com uma chave secreta aleatória.');
}
const env = readFileSync('.env', 'utf8');
console.log('\n================ LOGIN DO ADMIN ================');
console.log(' Endereço: http://localhost:3000/admin');
console.log(` E-mail:   ${env.match(/ADMIN_EMAIL="(.*)"/)?.[1]}`);
console.log(` Senha:    ${env.match(/ADMIN_PASSWORD="(.*)"/)?.[1]}`);
console.log(' (troque a senha em Admin > Configurações)');
console.log('================================================\n');
