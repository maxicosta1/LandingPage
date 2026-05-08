# Backend PHP para formulario

Este backend recibe `nombre`, `email` y `mensaje` por `POST`, valida los datos e inserta el contacto en MySQL usando PDO con prepared statements.

## 1. Crear la tabla en phpMyAdmin

1. Entrar al panel de DonWeb/Ferozo.
2. Abrir `MySQL` y crear una base de datos si todavia no existe.
3. Entrar a `phpMyAdmin`.
4. Seleccionar la base de datos.
5. Ir a la pestana `SQL`.
6. Pegar el contenido de `backEnd/crear_tabla_contactos.sql`.
7. Ejecutar.

## 2. Configurar la conexion

Editar `backEnd/config.php` con los datos reales de DonWeb:

```php
'db_host' => 'localhost',
'db_name' => 'nombre_de_tu_base',
'db_user' => 'usuario_de_tu_base',
'db_pass' => 'password_de_tu_base',
'turnstile_secret_key' => 'clave_secreta_de_cloudflare_turnstile',
'notification_email' => 'email_que_recibe_las_consultas',
'from_email' => 'email_del_mismo_dominio',
```

En hosting compartido normalmente `db_host` es `localhost`, salvo que DonWeb indique otro host.

## 3. Configurar Cloudflare Turnstile

1. Crear una cuenta en Cloudflare.
2. Ir a `Turnstile`.
3. Crear un widget para tu dominio.
4. Copiar la `Site key` y reemplazar `TU_TURNSTILE_SITE_KEY` en `contacto.html` y `contacto/index.html`.
5. Copiar la `Secret key` y reemplazar `TU_TURNSTILE_SECRET_KEY` en `backEnd/config.php`.

## 4. Conectar el formulario HTML

El formulario debe enviar por `POST` al archivo PHP:

```html
<form action="/backEnd/procesar_formulario.php" method="POST" class="formulario">
  <input type="text" name="website" autocomplete="off" tabindex="-1" hidden>

  <label for="nombre">Nombre</label>
  <input id="nombre" name="nombre" type="text" minlength="2" required>

  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>

  <label for="mensaje">Mensaje</label>
  <textarea id="mensaje" name="mensaje" minlength="10" required></textarea>

  <div class="cf-turnstile" data-sitekey="TU_TURNSTILE_SITE_KEY"></div>

  <button type="submit">Enviar consulta</button>
</form>
```

## Seguridad aplicada

- SQL Injection: evitado con prepared statements.
- Email: validado con `FILTER_VALIDATE_EMAIL`.
- Inputs: se hace `trim`, se eliminan caracteres de control, se remueven tags HTML y se limitan largos.
- Salida HTML: se imprime con `htmlspecialchars`.
- Spam basico: campo honeypot `website`; si llega completo, se rechaza.
- Verificacion humana: Cloudflare Turnstile se valida en el servidor antes de insertar en MySQL.
- Email de aviso: despues de guardar el contacto, PHP envia una notificacion con `mail()`.

## Flujo final

El formulario ya no necesita FormSubmit como `action`.

```text
Formulario -> procesar_formulario.php -> MySQL -> email de aviso
```

Esto reemplaza la funcion principal de FormSubmit, pero mantiene el mismo beneficio: recibir la consulta por email. La ventaja es que tambien queda guardada en la base de datos.

## Archivos a subir

- `backEnd/config.php`
- `backEnd/procesar_formulario.php`
- `backEnd/.htaccess`
- `backEnd/crear_tabla_contactos.sql` solo hace falta para crear la tabla, no es necesario dejarlo publicado.

No subas `backEnd/config.php` a un repositorio publico porque contiene contrasenas y claves privadas. Para GitHub usa `backEnd/config.example.php` como plantilla.
