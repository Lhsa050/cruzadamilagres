# Instalação na Hostinger

## Como instalar

1. Abra o Gerenciador de Arquivos da Hostinger.
2. Entre na pasta do site, normalmente `public_html`.
3. Envie todos os arquivos desta pasta:
   - `index.html`
   - `app.js`
   - `styles.css`
   - `api.php`
   - `install.php`
   - `.htaccess`
   - `version.json`
4. Acesse no navegador:
   - `https://seudominio.com/install.php`
5. Informe o e-mail e a senha do administrador.
6. Clique em `Instalar agora`.
7. Depois da instalação, clique em `Remover instalador`.

## Depois de instalado

- Painel: `https://seudominio.com/admin`
- Página pública: `https://seudominio.com/index.html#/evento/meu-primeiro-evento`
- Atualizações: entre no painel e use `Atualizações do sistema` para buscar/atualizar direto do GitHub.

## O que o instalador cria

- `data/config.php`: credenciais do administrador com senha criptografada.
- `data/state.json`: banco de dados em JSON dos eventos, participantes, arquivos e configurações.
- `data/.htaccess`: bloqueia acesso direto à pasta `data`.

## Observação

Esse instalador usa PHP e arquivos JSON, compatível com hospedagem compartilhada simples. Para alto volume de acessos, o ideal no futuro é migrar para banco de dados MySQL.

O atualizador baixa arquivos de `https://github.com/Lhsa050/cruzadamilagres` e preserva a pasta `data/`.
