<?php
declare(strict_types=1);

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$configFile = $dataDir . DIRECTORY_SEPARATOR . 'config.php';
$stateFile = $dataDir . DIRECTORY_SEPARATOR . 'state.json';
$errors = [];
$installed = file_exists($configFile);

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function defaultState(): array
{
    $eventId = 'evt_' . bin2hex(random_bytes(4));
    return [
        'events' => [[
            'id' => $eventId,
            'slug' => 'meu-primeiro-evento',
            'title' => 'Meu primeiro evento',
            'subtitle' => '',
            'coverUrl' => '',
            'accent' => '#0f766e',
            'dateLabel' => '',
            'timeLabel' => '',
            'gatesLabel' => '',
            'locationName' => '',
            'address' => '',
            'mapsUrl' => '',
            'organizerName' => '',
            'organizerPhone' => '',
            'organizerImage' => '',
            'allowGuests' => false,
            'description' => '',
            'createdAt' => gmdate('c'),
            'sessions' => []
        ]],
        'participants' => [],
        'files' => [],
        'site' => ['activeCssFileId' => '']
    ];
}

if ($installed && isset($_GET['delete']) && $_GET['delete'] === '1') {
    @unlink(__FILE__);
    header('Location: index.html#/admin');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$installed) {
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $password = (string)($_POST['password'] ?? '');
    $confirm = (string)($_POST['confirm'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Informe um e-mail de administrador válido.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'A senha precisa ter pelo menos 8 caracteres.';
    }
    if ($password !== $confirm) {
        $errors[] = 'A confirmação de senha não confere.';
    }

    if (!$errors) {
        if (!is_dir($dataDir) && !mkdir($dataDir, 0755, true)) {
            $errors[] = 'Não foi possível criar a pasta data/. Verifique permissões.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $config = "<?php\nreturn " . var_export([
                'admin_email' => $email,
                'admin_password_hash' => $hash,
                'installed_at' => gmdate('c')
            ], true) . ";\n";

            $stateJson = json_encode(defaultState(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            if (file_put_contents($configFile, $config, LOCK_EX) === false) {
                $errors[] = 'Não foi possível escrever data/config.php.';
            }
            if (!file_exists($stateFile) && file_put_contents($stateFile, $stateJson, LOCK_EX) === false) {
                $errors[] = 'Não foi possível escrever data/state.json.';
            }
            file_put_contents($dataDir . DIRECTORY_SEPARATOR . '.htaccess', "Options -Indexes\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n", LOCK_EX);

            $installed = !$errors;
        }
    }
}
?><!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Instalador | Vem Presença</title>
  <style>
    body{margin:0;background:#f6f7f9;color:#111827;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(760px,calc(100% - 32px));margin:48px auto}
    section{background:#fff;border:1px solid #dbe1e8;border-radius:10px;box-shadow:0 18px 48px rgba(17,24,39,.08);overflow:hidden}
    header{padding:24px;border-bottom:1px solid #dbe1e8}
    h1{margin:0;font-size:34px;line-height:1.05} p{color:#667085;line-height:1.55}
    form,.content{display:grid;gap:16px;padding:24px}
    label{display:grid;gap:7px;font-size:13px;font-weight:800;color:#475467}
    input{min-height:44px;border:1px solid #c6d0db;border-radius:8px;padding:10px 12px;font:inherit}
    button,a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:8px;border:1px solid #0f766e;background:#0f766e;color:white;font-weight:800;text-decoration:none;cursor:pointer}
    a.secondary{border-color:#dbe1e8;background:#fff;color:#111827}
    .row{display:flex;gap:10px;flex-wrap:wrap}.notice{padding:12px;border-radius:8px;background:#effaf3;border:1px solid #badfcb;color:#14532d;font-weight:800}.error{padding:12px;border-radius:8px;background:#fff5f3;border:1px solid #ffd7d1;color:#b42318}.code{font-family:Consolas,monospace;background:#eef2f5;border-radius:6px;padding:2px 6px;color:#111827}
  </style>
</head>
<body>
<main>
  <section>
    <header>
      <h1>Instalar Vem Presença</h1>
      <p>Este instalador prepara o painel na Hostinger, cria armazenamento em arquivos JSON e configura o login de administrador.</p>
    </header>

    <?php if ($installed): ?>
      <div class="content">
        <div class="notice">Instalação concluída.</div>
        <p>Acesse o painel em <span class="code">index.html#/admin</span>. A página pública fica em <span class="code">index.html#/evento/meu-primeiro-evento</span>.</p>
        <div class="row">
          <a href="index.html#/admin">Abrir painel</a>
          <a class="secondary" href="install.php?delete=1">Remover instalador</a>
        </div>
        <p>Por segurança, remova este arquivo <span class="code">install.php</span> depois de instalar.</p>
      </div>
    <?php else: ?>
      <form method="post">
        <?php foreach ($errors as $error): ?>
          <div class="error"><?= h($error) ?></div>
        <?php endforeach; ?>
        <label>
          E-mail do administrador
          <input name="email" type="email" required value="<?= h($_POST['email'] ?? 'admin@seudominio.com') ?>">
        </label>
        <label>
          Senha do administrador
          <input name="password" type="password" required minlength="8">
        </label>
        <label>
          Confirmar senha
          <input name="confirm" type="password" required minlength="8">
        </label>
        <div class="row">
          <button type="submit">Instalar agora</button>
        </div>
      </form>
    <?php endif; ?>
  </section>
</main>
</body>
</html>
