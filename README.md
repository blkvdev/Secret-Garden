# 🌸 Secret Garden — v3

Loja online da floricultura + painel administrativo. Pedido finalizado pelo WhatsApp.
Sem Firebase e sem PostgreSQL: o banco é o arquivo `prisma/dev.db` (SQLite) e as fotos ficam em `uploads/`.

## ▶️ Como rodar (Windows / VS Code) — Node.js 20+

```powershell
npm install
npm run setup
npm run dev
```

- `npm run setup` cria o `.env` com chave secreta, o banco, dados iniciais e o **login do admin** (aparece no terminal).
- Loja: http://localhost:3000 · Admin: http://localhost:3000/admin
- Esqueceu a senha? `npm run admin:reset -- admin@secretgarden.com.br NovaSenhaForte123`

### Atualizando a partir da v2
Copie a pasta `prisma/dev.db` e a pasta `uploads/` da v2 para a v3 e rode `npx prisma db push` antes do `npm run dev`
(o comando adiciona as novas tabelas — Banners, Promoções, Cupons — sem apagar seus produtos e pedidos).

## O que tem no admin
| Menu | Para quê |
|---|---|
| Dashboard | gráfico de vendas (7/30/90 dias, 12 meses, em R$ ou quantidade), vendas de hoje, ticket médio, mais vendidos, estoque |
| Pedidos | abas Aguardando / Vendidos / Cancelados, botão **✅ Concluir venda**, filtros, detalhes, observação interna |
| Produtos | cadastro, fotos do computador/celular, estoque com histórico |
| Banners | carrossel de ponta a ponta no topo + faixas no meio da home, com agendamento |
| Promoções | campanhas com data (% ou R$), para produtos escolhidos ou loja toda |
| Cupons | código, desconto, compra mínima, validade, limite de usos |
| Categorias / Entrega | menu do site e frete por cidade |
| Configurações | WhatsApp, logo, faixa de aviso, contato, modelo da mensagem, troca de senha |

## Fluxo da venda
Cliente finaliza → pedido salvo como **Enviado para WhatsApp** → WhatsApp abre com a mensagem →
cliente confirma na conversa → você clica **✅ Concluir venda** → entra no faturamento/gráfico e baixa o estoque.
Cancelar uma venda concluída devolve o estoque.

## Segurança
bcrypt · sessão JWT em cookie HttpOnly/SameSite=Strict (8h) · middleware protege /admin e /api/admin ·
anti-CSRF por origem · limite de tentativas no login, checkout e cupom · upload confere o tipo real da imagem ·
validação Zod · preços, promoções, cupom e frete sempre recalculados no servidor.

## Publicar
Use servidor com disco persistente (VPS, Railway com volume, Render com disco) e HTTPS.
Faça backup de `prisma/dev.db` e `uploads/`.
