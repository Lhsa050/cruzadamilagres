<?php
declare(strict_types=1);

$pageTitle = 'Confirme sua presença | IEQ São Joaquim';
$stateFile = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'state.json';

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function readState(string $path): array
{
    if (!file_exists($path)) {
        return [];
    }
    $state = json_decode(file_get_contents($path) ?: '{}', true);
    return is_array($state) ? $state : [];
}

function absoluteUrl(string $path = ''): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $base = rtrim($scriptDir === '/' ? '' : $scriptDir, '/');
    return "{$scheme}://{$host}{$base}/" . ltrim($path, '/');
}

function imageUrlFromLogo(string $logo): string
{
    $logo = trim($logo);
    if ($logo === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $logo)) {
        return $logo;
    }
    if (substr($logo, 0, 11) === 'data:image/') {
        return absoluteUrl('api.php?action=site_logo');
    }
    return absoluteUrl($logo);
}

$state = readState($stateFile);
$site = is_array($state['site'] ?? null) ? $state['site'] : [];
$logoUrl = imageUrlFromLogo((string)($site['logoUrl'] ?? ''));
?>
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0f766e" />
    <title><?= h($pageTitle) ?></title>
    <meta name="description" content="<?= h($pageTitle) ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="<?= h($pageTitle) ?>" />
    <meta property="og:description" content="<?= h($pageTitle) ?>" />
    <meta property="og:url" content="<?= h(absoluteUrl()) ?>" />
    <?php if ($logoUrl !== ''): ?>
      <meta property="og:image" content="<?= h($logoUrl) ?>" />
      <meta property="og:image:alt" content="Logo IEQ São Joaquim" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="<?= h($logoUrl) ?>" />
      <link rel="icon" href="<?= h($logoUrl) ?>" />
      <link rel="apple-touch-icon" href="<?= h($logoUrl) ?>" />
    <?php endif; ?>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" />
    <link rel="preconnect" href="https://unpkg.com" />
    <link rel="stylesheet" href="./styles.css?v=38" />
    <script defer src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <script defer src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <script defer src="./app.js?v=38"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
