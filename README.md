# Vem Presença

Protótipo estático para criação de eventos, confirmação de presença e emissão de QR Code individual por participante.

## Telas

- Painel administrativo: `#/admin`
- Login administrativo: acesse `#/admin` sem estar logado
- Página pública do evento: `#/evento/paul-enenche-brasil`
- Ticket com QR Code: criado após uma confirmação de presença

## Acesso de teste

- E-mail: `admin@evento.local`
- Senha: `admin123`

Na Hostinger, o e-mail e a senha são definidos em `install.php`.

## O que já funciona

- Criar, duplicar, excluir e editar eventos.
- Editar capa, cor, local, descrição, organizador e sessões.
- Criar evento em etapas, começando com campos vazios e capacidade zerada.
- Proteger o painel com login de administrador.
- Mostrar visitantes apenas como convidados, sem botão de login no cabeçalho público.
- Importar imagens de capa/organizador por arquivo local ou colar URL.
- Trocar nome e logo do cabeçalho pela aba `Configurações` do painel.
- Instalar em hospedagem PHP pela Hostinger com `install.php` e persistência em `data/state.json`.
- Buscar atualizações pelo painel administrativo e atualizar os arquivos direto do GitHub.
- Confirmar presença pela página pública em duas etapas.
- Validar e-mail e telefone com DDD antes de gerar o QR Code.
- Bloquear inscrição duplicada no mesmo evento por e-mail ou telefone.
- Habilitar convidado por evento; quando habilitado, a inscrição ganha etapa própria para informar o nome do convidado.
- Gerar código e QR Code único para cada participante.
- Validar QR pelo painel usando código, ID ou link do ticket.
- Marcar/desmarcar check-in.
- Buscar, filtrar e exportar participantes em CSV.

Os dados ficam salvos no `localStorage` do navegador enquanto o protótipo é testado.

## Atualizações via GitHub

Repositório conectado: `https://github.com/Lhsa050/cruzadamilagres`

Depois que o site estiver instalado na Hostinger, acesse `#/admin`, entre como administrador e use a seção `Atualizações do sistema`.

- `Buscar atualizações`: compara o `version.json` instalado com o `version.json` publicado no GitHub.
- `Atualizar`: baixa o ZIP da branch `main` do GitHub e substitui os arquivos do sistema.

A pasta `data/` não é substituída pelo atualizador, então eventos, participantes e arquivos enviados pelo painel são preservados.
