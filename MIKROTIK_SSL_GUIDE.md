# Guía para Configurar API de MikroTik

## 🔴 Problema Actual

El error `SSL: SSLV3_ALERT_HANDSHAKE_FAILURE` ocurre porque:

1. **Puerto 8443** NO es el puerto de la API de MikroTik
2. El puerto 8443 es típicamente usado para **HTTPS/Web** (WebFig), no para la API
3. La API de MikroTik usa puertos diferentes:
   - **8728** = API sin SSL ✅ (RECOMENDADO)
   - **8729** = API con SSL/TLS

## ✅ Solución: Opción 1 (RECOMENDADA) - API sin SSL

### Paso 1: Habilitar servicio API en MikroTik

Conecta a tu MikroTik por Winbox o SSH y ejecuta:

```bash
/ip service print
```

Verás algo como:
```
Flags: X - disabled, I - invalid
 #   NAME      PORT  ADDRESS     CERTIFICATE
 0   telnet      23
 1   ftp         21
 2 X api       8728
 3 X api-ssl   8729               none
 4   www         80
 5   ssh         22
 6   www-ssl   8443
```

### Paso 2: Habilitar el servicio API

```bash
/ip service set api disabled=no port=8728
```

### Paso 3: Permitir acceso desde tu red (Firewall)

```bash
# Ver reglas actuales
/ip firewall filter print

# Agregar regla para permitir API desde tu red
/ip firewall filter add chain=input protocol=tcp dst-port=8728 \
  src-address=TU_IP_O_RED comment="Allow API access" action=accept \
  place-before=0
```

Reemplaza `TU_IP_O_RED` con:
- Tu IP específica: `192.168.1.100`
- O tu red completa: `192.168.1.0/24`
- O la red del servidor ISP Billing

### Paso 4: Actualizar router en el sistema ISP Billing

En tu sistema, edita el router y cambia:
- **Puerto**: `8728`
- **SSL**: ❌ Desactivado

---

## 🔒 Solución: Opción 2 - API con SSL (Para conexiones por internet)

Si necesitas SSL porque el sistema ISP Billing se conecta desde internet:

### Paso 1: Generar certificados SSL en MikroTik

```bash
# Crear certificado CA
/certificate add name=ca-template common-name="ISP CA" \
  key-usage=key-cert-sign,crl-sign

# Crear certificado para el servidor
/certificate add name=server-template common-name="server" \
  key-usage=tls-server

# Firmar CA
/certificate sign ca-template name=myCa

# Esperar a que se firme (status=ok)
/certificate print

# Firmar certificado del servidor
/certificate sign server-template name=server ca=myCa

# Esperar a que se firme
/certificate print
```

### Paso 2: Asignar certificado a API-SSL

```bash
/certificate set api-ssl certificate=server
```

### Paso 3: Habilitar servicio API-SSL

```bash
/ip service set api-ssl disabled=no port=8729
```

### Paso 4: Permitir acceso en firewall

```bash
/ip firewall filter add chain=input protocol=tcp dst-port=8729 \
  src-address=TU_IP_O_RED comment="Allow API-SSL access" action=accept \
  place-before=0
```

### Paso 5: Actualizar router en el sistema ISP Billing

- **Puerto**: `8729`
- **SSL**: ✅ Activado

---

## 📋 Verificación

### Verificar servicios habilitados

```bash
/ip service print detail
```

Debes ver:
```
 2   name="api" port=8728 disabled=no
```

O para SSL:
```
 3   name="api-ssl" port=8729 certificate=server disabled=no
```

### Verificar firewall

```bash
/ip firewall filter print where chain=input and dst-port=8728
```

### Probar desde terminal

```bash
# Desde Linux/Mac (sin SSL)
telnet 38.224.22.255 8728

# Debería conectar
```

---

## ⚠️ Importante

1. **NO uses el puerto 8443** - Es para web (HTTPS), no para API
2. **Para redes locales** - Usa API sin SSL (puerto 8728) - Es más simple y confiable
3. **Para internet** - Usa API-SSL (puerto 8729) con certificados
4. **Firewall** - Asegúrate de permitir el puerto en el firewall de MikroTik

---

## 🔧 Troubleshooting

### Si sigue sin funcionar:

1. Verifica que el servicio esté escuchando:
   ```bash
   /ip service print
   ```

2. Verifica conectividad de red:
   ```bash
   # Desde tu servidor ISP Billing
   telnet 38.224.22.255 8728
   ```

3. Revisa logs de MikroTik:
   ```bash
   /log print where topics~"api"
   ```

4. Verifica usuario y permisos:
   ```bash
   /user print detail
   # El usuario debe tener group=full o permisos API
   ```

---

## 🎯 Resumen Rápido

**Para empezar rápido (red local):**
```bash
# En MikroTik
/ip service set api disabled=no port=8728

# En ISP Billing
# Editar router: Puerto=8728, SSL=Desactivado
```

Eso es todo! 🚀
