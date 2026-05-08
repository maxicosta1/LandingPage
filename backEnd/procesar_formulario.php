<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    mostrarRespuesta('Metodo no permitido.', false);
    exit;
}

if (!empty($_POST['website'] ?? '')) {
    http_response_code(400);
    mostrarRespuesta('No se pudo procesar la solicitud.', false);
    exit;
}

$nombre = limpiarTexto($_POST['nombre'] ?? '', 100);
$email = trim((string)($_POST['email'] ?? ''));
$mensaje = limpiarTexto($_POST['mensaje'] ?? '', 2000);
$turnstileToken = trim((string)($_POST['cf-turnstile-response'] ?? ''));
$config = require __DIR__ . '/config.php';

$errores = [];

if ($nombre === '' || largoTexto($nombre) < 2) {
    $errores[] = 'El nombre debe tener al menos 2 caracteres.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || largoTexto($email) > 254) {
    $errores[] = 'El email no es valido.';
}

if ($mensaje === '' || largoTexto($mensaje) < 10) {
    $errores[] = 'El mensaje debe tener al menos 10 caracteres.';
}

if (!validarTurnstile($turnstileToken, $config['turnstile_secret_key'])) {
    $errores[] = 'No pudimos verificar que seas humano. Recarga la pagina e intentalo nuevamente.';
}

if ($errores !== []) {
    http_response_code(422);
    mostrarRespuesta(implode(' ', $errores), false);
    exit;
}

$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=%s',
    $config['db_host'],
    $config['db_name'],
    $config['db_charset']
);

try {
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $stmt = $pdo->prepare(
        'INSERT INTO contactos (nombre, email, mensaje, ip, user_agent)
         VALUES (:nombre, :email, :mensaje, :ip, :user_agent)'
    );

    $stmt->execute([
        ':nombre' => $nombre,
        ':email' => $email,
        ':mensaje' => $mensaje,
        ':ip' => substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45),
        ':user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);

    mostrarRespuesta('Gracias. Recibimos tu mensaje correctamente.', true);
} catch (PDOException $e) {
    error_log('Error al guardar contacto: ' . $e->getMessage());
    http_response_code(500);
    mostrarRespuesta('No pudimos guardar tu mensaje. Intentalo nuevamente en unos minutos.', false);
}

function limpiarTexto(string $valor, int $maximo): string
{
    $valor = trim($valor);
    $valor = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $valor) ?? '';
    $valor = strip_tags($valor);

    if (function_exists('mb_substr')) {
        return mb_substr($valor, 0, $maximo, 'UTF-8');
    }

    return substr($valor, 0, $maximo);
}

function largoTexto(string $valor): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($valor, 'UTF-8');
    }

    return strlen($valor);
}

function validarTurnstile(string $token, string $secretKey): bool
{
    if ($token === '' || $secretKey === '' || $secretKey === 'TU_TURNSTILE_SECRET_KEY') {
        return false;
    }

    $datos = http_build_query([
        'secret' => $secretKey,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    $respuesta = null;

    if (function_exists('curl_init')) {
        $curl = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
        if ($curl === false) {
            return false;
        }

        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $datos,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);
        $respuesta = curl_exec($curl);
        curl_close($curl);
    } else {
        $contexto = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $datos,
                'timeout' => 10,
            ],
        ]);
        $respuesta = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $contexto);
    }

    if (!is_string($respuesta) || $respuesta === '') {
        return false;
    }

    $json = json_decode($respuesta, true);

    return is_array($json) && ($json['success'] ?? false) === true;
}

function mostrarRespuesta(string $mensaje, bool $ok): void
{
    $titulo = $ok ? 'Mensaje enviado' : 'No se pudo enviar';
    $color = $ok ? '#207a3c' : '#a33232';
    $mensajeSeguro = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
    $tituloSeguro = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');

    echo <<<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$tituloSeguro}</title>
  <link rel="stylesheet" href="/frontEnd/style.css">
  <style>
    body { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .respuesta-formulario { max-width: 560px; text-align: center; }
    .respuesta-formulario h1 { color: {$color}; margin-bottom: 12px; }
    .respuesta-formulario p { margin-bottom: 24px; }
  </style>
</head>
<body>
  <main class="respuesta-formulario">
    <h1>{$tituloSeguro}</h1>
    <p>{$mensajeSeguro}</p>
    <a class="cta-btn" href="/contacto/">Volver al formulario</a>
  </main>
</body>
</html>
HTML;
}
