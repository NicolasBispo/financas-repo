# Deploy (VPS) — imagens no GHCR

As imagens de produção são construídas no GitHub Actions
(`.github/workflows/build.yml`) a cada push na `main` (ou manualmente via
"Run workflow") e publicadas no GitHub Container Registry. A VPS **não faz
build**: só `pull` + `up -d`.

## Imagens

| Imagem | Contexto / Dockerfile | Serviço (container) |
|---|---|---|
| `ghcr.io/nicolasbispo/financas-repo-api` | `apps/backend` / `apps/backend/Dockerfile` | `api` (`financas-app-api`) |
| `ghcr.io/nicolasbispo/financas-repo-frontend` | raiz do repo / `infra/dockers/frontend/Dockerfile` (build arg `VITE_API_BASE_URL`, padrão vazio) | `frontend` (`financas-app-frontend`) |

Tags publicadas: `latest` (último build da `main`) e o SHA curto do commit
(7 caracteres, ex.: `a1b2c3d`).

`VITE_API_BASE_URL` é embutido no bundle no build. Para mudar, crie a
variável de repositório `VITE_API_BASE_URL` (Settings → Secrets and
variables → Actions → Variables) e rode o workflow de novo.

## Configuração única na VPS

Crie um PAT **classic** com escopo `read:packages` e faça login:

```bash
docker login ghcr.io -u nicolasbispo
# cole o PAT como senha
```

## Deploy

```bash
cd /opt/apps/financas-repo
git pull            # compose/Makefile atualizados
make deploy         # pull das imagens + up -d + db:migrate + health
```

Equivalente sem Make (a partir de `infra/dockers`):

```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml pull api frontend
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
docker compose -f docker-compose.yml -f docker-compose.vps.yml exec api bundle exec rails db:migrate
```

## Rollback

Use o SHA curto de um build anterior (aba Actions ou página do pacote):

```bash
make deploy IMAGE_TAG=<sha-anterior>
# ou
IMAGE_TAG=<sha-anterior> docker compose -f docker-compose.yml -f docker-compose.vps.yml pull
IMAGE_TAG=<sha-anterior> docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d
```

Para voltar ao normal: `make deploy` (usa `latest`).

> Atenção: rollback de imagem não desfaz migrations já aplicadas.

## Voltar temporariamente ao build local

Se o GHCR/Actions estiver indisponível, dá para buildar na própria VPS com
o arquivo extra `infra/dockers/docker-compose.build.yml` (nunca é carregado
automaticamente):

```bash
make up-build && make migrate && make health
# ou, em infra/dockers:
docker compose -f docker-compose.yml -f docker-compose.vps.yml -f docker-compose.build.yml up -d --build
```

O build local gera a imagem com o mesmo nome/tag do GHCR; o próximo
`make deploy` substitui pela versão do registry.

## Visibilidade dos pacotes

O repositório é público, então os pacotes do GHCR ligados a ele ficam
públicos. As imagens não contêm segredos (o frontend é buildado com
`VITE_API_BASE_URL` vazio e a API pré-compila assets com
`SECRET_KEY_BASE=DUMMY`; os segredos reais vêm do `.env` em runtime).
Observação: a imagem da API copia todo `apps/backend`, incluindo
`db/imports/financas_2025_2029.csv` (mesmo conteúdo já visível no repo).

Para deixar um pacote privado: GitHub → seu perfil → Packages →
`financas-repo-api` (ou `-frontend`) → Package settings → Danger Zone →
Change visibility → Private. Com pacote privado o `docker login` com PAT
`read:packages` na VPS continua funcionando.
