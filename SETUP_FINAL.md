# 🚀 GoDream - Setup Final (3 passos)

## ✅ O que já foi feito:
- ✅ Código compilado e testado
- ✅ Git inicializado
- ✅ Commit inicial feito
- ✅ Dockerfile criado
- ✅ GitHub Actions workflow criado

---

## 📋 O que VOCÊ precisa fazer:

### PASSO 1️⃣ : Criar repositório vazio no GitHub
1. Abra: https://github.com/new
2. Nome: `godream`
3. Descrição: `Learning platform with gamification`
4. **NÃO** marque "Add a README"
5. Clique **Create repository**
6. Copie a URL (será algo como `https://github.com/seu-user/godream`)

---

### PASSO 2️⃣ : Subir código no GitHub
Abra terminal na pasta do projeto e rode:

```bash
git remote add origin https://github.com/SEU-USER/godream
git branch -M main
git push -u origin main
```

(Troque `SEU-USER` pela sua conta do GitHub)

---

### PASSO 3️⃣ : Configurar deploy automático

#### A) Criar conta e token no Fly.io
1. Acesse: https://fly.io (grátis)
2. Faça login/cadastro
3. Vá em: https://web.fly.io/account/tokens
4. Clique **Create Deploy Token**
5. Copie o token (será algo como `FlyV1 xyz...`)

#### B) Adicionar token no GitHub
1. Vá em: `https://github.com/SEU-USER/godream/settings/secrets/actions`
2. Clique **New repository secret**
3. Preencha:
   - **Name:** `FLY_API_TOKEN`
   - **Value:** Cole o token do Fly.io (ex: `FlyV1 xyz...`)
4. Clique **Add secret**

---

### PRONTO! 🎉

Agora toda vez que você fizer:
```bash
git push
```

Automaticamente:
1. GitHub vai rodar seu código
2. Vai fazer build do Docker
3. Vai fazer deploy no Fly.io
4. Sua aplicação fica online em: `https://godream.fly.dev`

---

## 📊 URLs após deploy:
- **Frontend:** https://godream.fly.dev
- **API:** https://godream.fly.dev/api
- **Logs:** `flyctl logs -a godream`
- **Status:** `flyctl status -a godream`

---

## ⚡ Próximos deploys
Depois de qualquer mudança no código:

```bash
git add .
git commit -m "sua mensagem"
git push
```

Pronto! GitHub Actions faz o resto automaticamente. ✨

---

**Precisa de ajuda?** Só me avisa! 🚀
