# 🚀 Deploy GoDream no Fly.io

## Pré-requisitos
- Conta no Fly.io (grátis): https://fly.io
- Flyctl instalado: ✅ (já está)
- Projeto no Git (GitHub, GitLab, etc)

---

## Passo 1: Login no Fly.io

```bash
flyctl auth login
```

Isso vai abrir o navegador para você fazer login. Autorize e volta pro terminal.

---

## Passo 2: Criar app no Fly.io

```bash
cd godream-platform

# Cria o app (Fly vai criar automaticamente)
flyctl launch
```

Vai fazer perguntas:
- **App name:** godream (ou seu nome)
- **Region:** gig (ou escolhe outro próximo)
- **PostgreSQL Database:** Diz SIM (y) para criar banco grátis
- **Redis:** Diz NÃO (n)

Depois escolhe:
- **Would you like to set up Pagerduty:** NÃO (n)

---

## Passo 3: Configurar variáveis de ambiente

```bash
# Abre editor de secrets
flyctl secrets set \
  JWT_SECRET="sua-chave-super-secreta-aqui" \
  JWT_REFRESH_SECRET="outra-chave-secreta" \
  NODE_ENV="production"
```

(Mude as chaves para algo real)

---

## Passo 4: Deploy!

```bash
# Faz build e publica tudo
flyctl deploy

# Acompanha o log
flyctl logs
```

Pronto! 🎉

---

## URLs após deploy

- **API:** https://godream.fly.dev
- **Status:** `flyctl status`
- **Logs:** `flyctl logs`

---

## Próximas vezes (atualizar)

Depois de fazer alterações no código:

```bash
git push  # Commita tudo
flyctl deploy  # Redeploy automático
```

---

## Troubleshooting

**Erro de conexão com banco:**
```bash
flyctl postgres connect
# Testa a conexão
```

**Resetar tudo:**
```bash
flyctl destroy
flyctl launch  # Começa do zero
```

**Ver todas as variáveis:**
```bash
flyctl secrets list
```
