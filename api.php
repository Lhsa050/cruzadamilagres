<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$configFile = $dataDir . DIRECTORY_SEPARATOR . 'config.php';
$stateFile = $dataDir . DIRECTORY_SEPARATOR . 'state.json';
$versionFile = __DIR__ . DIRECTORY_SEPARATOR . 'version.json';
$githubRepo = 'Lhsa050/cruzadamilagres';
$githubBranch = 'main';
$githubRawVersionUrl = "https://raw.githubusercontent.com/{$githubRepo}/{$githubBranch}/version.json";
$githubZipUrl = "https://github.com/{$githubRepo}/archive/refs/heads/{$githubBranch}.zip";

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function requireAdmin(): void
{
    if (empty($_SESSION['admin'])) {
        respond(['ok' => false, 'error' => 'Login de administrador obrigatorio.'], 403);
    }
}

function readJsonFile(string $path): array
{
    if (!file_exists($path)) {
        return [];
    }

    $data = json_decode(file_get_contents($path) ?: '{}', true);
    return is_array($data) ? $data : [];
}

function writeStateFile(string $path, array $state): void
{
    $json = json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($path, $json, LOCK_EX) === false) {
        respond(['ok' => false, 'error' => 'Nao foi possivel salvar state.json.'], 500);
    }
}

function normalizeEmailValue($value): string
{
    return strtolower(trim((string)$value));
}

function normalizePhoneValue($value): string
{
    $digits = preg_replace('/\D+/', '', (string)$value) ?: '';
    if (substr($digits, 0, 2) === '55' && (strlen($digits) === 12 || strlen($digits) === 13)) {
        $digits = substr($digits, 2);
    }
    return $digits;
}

function validPhoneValue(string $digits): bool
{
    return strlen($digits) === 10 || strlen($digits) === 11;
}

function formatPhoneValue(string $digits): string
{
    if (strlen($digits) === 11) {
        return sprintf('(%s) %s-%s', substr($digits, 0, 2), substr($digits, 2, 5), substr($digits, 7));
    }
    if (strlen($digits) === 10) {
        return sprintf('(%s) %s-%s', substr($digits, 0, 2), substr($digits, 2, 4), substr($digits, 6));
    }
    return $digits;
}

function randomToken(int $length): string
{
    return substr(strtolower(bin2hex(random_bytes(max(8, $length)))), 0, $length);
}

function participantHeadcountValue(array $participant): int
{
    return trim((string)($participant['guestName'] ?? '')) !== '' ? 2 : 1;
}

function fetchUrl(string $url)
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 30,
            'header' => "User-Agent: VemPresencaUpdater/1.0\r\n",
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $content = @file_get_contents($url, false, $context);
    if ($content !== false) {
        return $content;
    }

    if (!function_exists('curl_init')) {
        return false;
    }

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_USERAGENT => 'VemPresencaUpdater/1.0',
    ]);
    $content = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($content === false || $status >= 400) {
        return false;
    }

    return $content;
}

function versionLabel(array $version): string
{
    return trim((string)($version['version'] ?? '') . ' ' . (string)($version['build'] ?? ''));
}

function endsWithSlash(string $value): bool
{
    return substr($value, -1) === '/';
}

function remoteVersion(string $url): array
{
    $raw = fetchUrl($url);
    if ($raw === false) {
        respond(['ok' => false, 'error' => 'Nao foi possivel acessar o version.json no GitHub.'], 502);
    }

    $data = json_decode((string)$raw, true);
    if (!is_array($data)) {
        respond(['ok' => false, 'error' => 'version.json do GitHub esta invalido.'], 502);
    }

    return $data;
}

function updateAvailable(array $local, array $remote): bool
{
    return versionLabel($local) !== versionLabel($remote);
}

function ensureDirectory(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0755, true)) {
        respond(['ok' => false, 'error' => 'Nao foi possivel criar pasta de atualizacao.'], 500);
    }
}

function safeWriteFile(string $path, string $content): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        respond(['ok' => false, 'error' => 'Nao foi possivel criar pasta para arquivo.'], 500);
    }

    if (file_put_contents($path, $content, LOCK_EX) === false) {
        respond(['ok' => false, 'error' => 'Nao foi possivel gravar arquivo atualizado.'], 500);
    }
}

function runGithubUpdate(string $zipUrl): array
{
    if (!class_exists('ZipArchive')) {
        respond(['ok' => false, 'error' => 'A extensao ZipArchive do PHP precisa estar ativa na hospedagem.'], 500);
    }

    $allowedFiles = [
        '.htaccess',
        'api.php',
        'app.js',
        'index.html',
        'install.php',
        'INSTALAR-HOSTINGER.md',
        'README.md',
        'styles.css',
        'version.json',
    ];

    $updateDir = __DIR__ . DIRECTORY_SEPARATOR . 'updates';
    $backupDir = $updateDir . DIRECTORY_SEPARATOR . 'backup-' . date('Ymd-His');
    ensureDirectory($updateDir);
    safeWriteFile($updateDir . DIRECTORY_SEPARATOR . '.htaccess', "Options -Indexes\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
    ensureDirectory($backupDir);

    $zipContent = fetchUrl($zipUrl);
    if ($zipContent === false) {
        respond(['ok' => false, 'error' => 'Nao foi possivel baixar o ZIP do GitHub.'], 502);
    }

    $zipPath = $updateDir . DIRECTORY_SEPARATOR . 'github-main.zip';
    safeWriteFile($zipPath, (string)$zipContent);

    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== true) {
        respond(['ok' => false, 'error' => 'Nao foi possivel abrir o ZIP baixado do GitHub.'], 500);
    }

    $updated = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $entry = $zip->getNameIndex($i);
        if (!is_string($entry) || endsWithSlash($entry)) {
            continue;
        }

        $relative = preg_replace('#^[^/]+/#', '', str_replace('\\', '/', $entry));
        if (!in_array($relative, $allowedFiles, true)) {
            continue;
        }

        $content = $zip->getFromIndex($i);
        if ($content === false) {
            continue;
        }

        $target = __DIR__ . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
        if (file_exists($target)) {
            $backupTarget = $backupDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
            ensureDirectory(dirname($backupTarget));
            copy($target, $backupTarget);
        }

        safeWriteFile($target, $content);
        $updated[] = $relative;
    }

    $zip->close();
    @unlink($zipPath);

    if (!$updated) {
        respond(['ok' => false, 'error' => 'Nenhum arquivo permitido foi encontrado no ZIP do GitHub.'], 500);
    }

    return [$updated, $backupDir];
}

$action = $_GET['action'] ?? 'state';

if ($action === 'status') {
    respond(['ok' => true, 'installed' => file_exists($configFile)]);
}

if (!file_exists($configFile)) {
    respond(['ok' => false, 'error' => 'Aplicacao ainda nao instalada. Abra install.php.'], 503);
}

$config = require $configFile;

if ($action === 'login') {
    $body = readBody();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');

    if ($email === strtolower((string)$config['admin_email']) && password_verify($password, (string)$config['admin_password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        respond(['ok' => true]);
    }

    respond(['ok' => false, 'error' => 'Credenciais invalidas.'], 401);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
    respond(['ok' => true]);
}

if ($action === 'session') {
    respond(['ok' => true, 'admin' => !empty($_SESSION['admin'])]);
}

if ($action === 'register_participant') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'Metodo nao permitido.'], 405);
    }

    $body = readBody();
    $input = is_array($body['participant'] ?? null) ? $body['participant'] : [];
    $eventId = trim((string)($body['eventId'] ?? ''));
    $state = readJsonFile($stateFile);
    $state['events'] = is_array($state['events'] ?? null) ? $state['events'] : [];
    $state['participants'] = is_array($state['participants'] ?? null) ? $state['participants'] : [];

    $event = null;
    foreach ($state['events'] as $candidate) {
        if ((string)($candidate['id'] ?? '') === $eventId) {
            $event = is_array($candidate) ? $candidate : null;
            break;
        }
    }

    if (!$event) {
        respond(['ok' => false, 'error' => 'Evento nao encontrado.'], 404);
    }

    $name = trim((string)($input['name'] ?? ''));
    $email = normalizeEmailValue($input['email'] ?? '');
    $phoneDigits = normalizePhoneValue($input['phone'] ?? '');
    $city = trim((string)($input['city'] ?? ''));
    $guestName = trim((string)($input['guestName'] ?? ''));
    $sessionId = trim((string)($input['sessionId'] ?? ''));

    if ($name === '') {
        respond(['ok' => false, 'error' => 'Informe o nome completo.', 'field' => 'name'], 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['ok' => false, 'error' => 'Informe um e-mail valido.', 'field' => 'email'], 422);
    }
    if (!validPhoneValue($phoneDigits)) {
        respond(['ok' => false, 'error' => 'Informe um telefone valido com DDD.', 'field' => 'phone'], 422);
    }

    $sessions = is_array($event['sessions'] ?? null) ? $event['sessions'] : [];
    $session = null;
    foreach ($sessions as $candidate) {
        if ((string)($candidate['id'] ?? '') === $sessionId) {
            $session = is_array($candidate) ? $candidate : null;
            break;
        }
    }
    if (!$session) {
        respond(['ok' => false, 'error' => 'Selecione uma sessao valida.', 'field' => 'sessionId'], 422);
    }

    foreach ($state['participants'] as $participant) {
        if (!is_array($participant) || (string)($participant['eventId'] ?? '') !== $eventId) {
            continue;
        }
        if (normalizeEmailValue($participant['email'] ?? '') === $email) {
            respond(['ok' => false, 'error' => 'Este e-mail ja esta inscrito neste evento.', 'field' => 'email'], 409);
        }
        if (normalizePhoneValue($participant['phone'] ?? '') === $phoneDigits) {
            respond(['ok' => false, 'error' => 'Este telefone ja esta inscrito neste evento.', 'field' => 'phone'], 409);
        }
    }

    if (empty($event['allowGuests'])) {
        $guestName = '';
    }

    $requestedPeople = $guestName !== '' ? 2 : 1;
    $capacity = (int)($session['capacity'] ?? 0);
    if ($capacity > 0) {
        $used = 0;
        foreach ($state['participants'] as $participant) {
            if (is_array($participant)
                && (string)($participant['eventId'] ?? '') === $eventId
                && (string)($participant['sessionId'] ?? '') === $sessionId) {
                $used += participantHeadcountValue($participant);
            }
        }
        if ($used + $requestedPeople > $capacity) {
            respond(['ok' => false, 'error' => 'Sessao sem vagas disponiveis.', 'field' => 'sessionId'], 409);
        }
    }

    $participant = [
        'id' => 'part_' . randomToken(14),
        'eventId' => $eventId,
        'ticketCode' => 'VP-' . strtoupper(randomToken(9)),
        'name' => $name,
        'email' => $email,
        'phone' => formatPhoneValue($phoneDigits),
        'city' => $city,
        'guestName' => $guestName,
        'sessionId' => $sessionId,
        'status' => 'confirmed',
        'createdAt' => date(DATE_ATOM),
        'checkInAt' => null,
    ];

    $state['participants'][] = $participant;
    writeStateFile($stateFile, $state);
    respond(['ok' => true, 'participant' => $participant]);
}

if ($action === 'check_update') {
    requireAdmin();
    $local = readJsonFile($versionFile);
    $remote = remoteVersion($githubRawVersionUrl);
    respond([
        'ok' => true,
        'repo' => $githubRepo,
        'branch' => $githubBranch,
        'local' => $local,
        'remote' => $remote,
        'updateAvailable' => updateAvailable($local, $remote),
    ]);
}

if ($action === 'run_update') {
    requireAdmin();
    [$files, $backupDir] = runGithubUpdate($githubZipUrl);
    $local = readJsonFile($versionFile);
    respond([
        'ok' => true,
        'message' => 'Atualizacao aplicada. Recarregue a pagina para usar a nova versao.',
        'files' => $files,
        'backup' => basename($backupDir),
        'local' => $local,
    ]);
}

if ($action === 'state') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!file_exists($stateFile)) {
            respond(['ok' => true, 'state' => ['events' => [], 'participants' => [], 'files' => [], 'site' => ['activeCssFileId' => '']]]);
        }

        $state = json_decode(file_get_contents($stateFile) ?: '{}', true);
        respond(['ok' => true, 'state' => is_array($state) ? $state : []]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        requireAdmin();

        $body = readBody();
        if (!isset($body['state']) || !is_array($body['state'])) {
            respond(['ok' => false, 'error' => 'Estado invalido.'], 422);
        }

        writeStateFile($stateFile, $body['state']);
        respond(['ok' => true]);
    }
}

respond(['ok' => false, 'error' => 'Acao nao encontrada.'], 404);
