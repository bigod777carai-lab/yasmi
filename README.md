# Yasmin AI

Interface de chat responsiva em português com histórico local e backend serverless seguro.

## Implantação na Vercel

1. Importe `bigod777carai-lab/yasmi` no Vercel.
2. Mantenha o framework como **Other**.
3. Em **Settings → Environment Variables**, adicione:
   - Nome: `OPENAI_API_KEY`
   - Valor: sua chave da OpenAI
   - Ambientes: Production, Preview e Development
4. Implante novamente depois de adicionar a variável.

A chave é acessada apenas por `api/chat.js` no servidor. O navegador não recebe nem pode ler a chave.

## Desenvolvimento

Execute o projeto com a CLI da Vercel para testar `/api/chat`:

```bash
npx vercel dev
```

## Segurança

- Nunca coloque `OPENAI_API_KEY` em arquivos públicos.
- Nunca use `NEXT_PUBLIC_*` ou outras variáveis expostas ao navegador.
- Configure limites de uso e faturamento na conta da OpenAI.
