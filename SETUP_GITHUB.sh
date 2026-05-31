#!/bin/bash
# Setup script para subir no GitHub e Fly.io

echo "🚀 GoDream - Setup GitHub + Fly.io"
echo ""

# Perguntar URL do repositório
read -p "Cole a URL do seu repositório GitHub (ex: https://github.com/seu-user/godream): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "❌ URL do repositório é obrigatória!"
  exit 1
fi

echo ""
echo "📤 Adicionando repositório remoto..."
git remote add origin "$REPO_URL"

echo "📤 Fazendo push para GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Repositório criado no GitHub!"
echo ""
echo "⚠️  PRÓXIMO PASSO: Configurar secrets no GitHub"
echo ""
echo "1. Acesse: $REPO_URL/settings/secrets/actions"
echo ""
echo "2. Clique em 'New repository secret'"
echo ""
echo "3. Adicione o secret FLY_API_TOKEN:"
echo "   - Name: FLY_API_TOKEN"
echo "   - Value: (seu token do Fly.io - veja abaixo)"
echo ""
echo "📋 Para gerar token no Fly.io:"
echo "   1. Acesse: https://web.fly.io/account/tokens"
echo "   2. Clique 'Create Deploy Token'"
echo "   3. Copie o token"
echo "   4. Adicione como secret no GitHub"
echo ""
echo "🎉 Depois é só fazer 'git push' que o Fly.io faz deploy automático!"
