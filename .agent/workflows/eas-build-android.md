---
description: Build Android development client with pre-build checks
---

# EAS Build for Android Development

Este workflow ejecuta verificaciones previas y luego lanza un build de desarrollo para Android.

## Pre-requisitos

Asegúrate de estar en el directorio `Client/`:
```bash
cd C:\Users\Javier Ubeda Sosa\Desktop\ChatApp\Client
```

## Pasos

### 1. Verificar archivos de configuración
Verifica que existan los archivos necesarios:
- `google-services.json` (Firebase/FCM)
- `firebase-service-account.json` (FCM V1 credentials)

// turbo
### 2. Ejecutar verificación de TypeScript
```bash
npx tsc --noEmit
```

Si hay errores, **detente y corrígelos antes de continuar**.

// turbo
### 3. Limpiar caché de Metro (opcional pero recomendado)
```bash
npx expo start --dev-client -c --non-interactive
```
Espera unos segundos a que inicie y luego termina el proceso (Ctrl+C).

### 4. Ejecutar EAS Build
```bash
npx eas build --profile development --platform android
```

Esto subirá el código a los servidores de EAS y comenzará el build. Recibirás un link para monitorear el progreso.

### 5. Post-build
Una vez completado el build:
1. Descarga el APK desde el link de EAS
2. **Desinstala** cualquier versión anterior de la app del dispositivo
3. Instala el nuevo APK
4. Ejecuta `npx expo start --dev-client` para conectar

## Notas Importantes

- Si agregas dependencias nativas nuevas, **siempre** debes hacer un nuevo build
- El package name debe ser `app.twinpro.twinpro`
- Si cambias el package name, debes generar un nuevo keystore
