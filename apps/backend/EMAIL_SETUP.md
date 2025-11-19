# Configuración de Email para OTP

## 📧 Configurar Gmail para Envío de OTP

### Paso 1: Habilitar Verificación en 2 Pasos
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a **Seguridad**
3. Habilita **Verificación en 2 pasos**

### Paso 2: Generar Contraseña de Aplicación
1. Ve a: https://myaccount.google.com/apppasswords
2. En "Seleccionar app" elige **Correo**
3. En "Seleccionar dispositivo" elige **Otro (nombre personalizado)**
4. Escribe: "Align Designs Backend"
5. Click en **Generar**
6. **Copia la contraseña de 16 caracteres** (sin espacios)

### Paso 3: Configurar Variables de Entorno

Edita el archivo `backend/.env` y actualiza estas líneas:

```env
# Email (configurar para producción)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com              # ← Cambia esto
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx         # ← Pega la contraseña de aplicación
EMAIL_FROM="Align Designs <tu-email@gmail.com>"  # ← Cambia esto
```

### Paso 4: Reiniciar el Backend

El servidor se reiniciará automáticamente con las nuevas configuraciones.

---

## 🔧 Configurar Otros Proveedores de Email

### Outlook / Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña
EMAIL_FROM="Align Designs <tu-email@outlook.com>"
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=tu-email@yahoo.com
EMAIL_PASSWORD=contraseña-de-aplicación
EMAIL_FROM="Align Designs <tu-email@yahoo.com>"
```

### SendGrid (Recomendado para Producción)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=tu-api-key-de-sendgrid
EMAIL_FROM="Align Designs <noreply@tudominio.com>"
```

---

## ✅ Probar el Envío de OTP

1. Ve a la página de login del frontend
2. Selecciona "Cliente"
3. Ingresa el email de un cliente existente
4. Click en "Enviar código OTP"
5. Revisa tu bandeja de entrada
6. También verás el código en la consola del backend como respaldo

---

## 🐛 Troubleshooting

### Error: "Failed to send email"
- Verifica que las credenciales sean correctas
- Asegúrate de haber habilitado "Verificación en 2 pasos" en Gmail
- Usa la contraseña de aplicación, NO tu contraseña normal de Gmail
- Verifica que el puerto 587 no esté bloqueado por tu firewall

### El email no llega
- Revisa la carpeta de SPAM
- Verifica que el email del cliente sea válido
- Mira los logs del backend para ver si hay errores

### Para Desarrollo Sin Email
Si no quieres configurar email ahora, el código OTP seguirá apareciendo en la consola del backend con un formato claro.
