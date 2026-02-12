# Configuración PPPoE en MikroTik RouterOS v7

Esta guía te ayudará a configurar tu router MikroTik para trabajar con el sistema de facturación ISP y soportar clientes PPPoE.

## Requisitos Previos

- MikroTik RouterOS v7.x
- Acceso administrativo al router
- API habilitada (ver `MIKROTIK_SSL_GUIDE.md`)

## Configuración Paso a Paso

### 1. ⚠️ Pool de IPs (Automático)

**IMPORTANTE**: El sistema crea automáticamente los pools de IPs basándose en los rangos CIDR configurados en cada router.

**NO necesitas** crear pools manualmente. El sistema:
- Lee los CIDRs del router (ejemplo: `192.168.1.0/24,10.0.0.0/24`)
- Crea un pool con nombre `pool-{nombre-router}`
- Convierte los CIDRs a rangos utilizables (sin IP de red ni broadcast)
- Actualiza el pool automáticamente si cambias los CIDRs

**Ejemplo**: Si tu router se llama "Router Principal" con CIDR `192.168.1.0/24`, el sistema creará:
```
/ip pool print
# name="pool-router-principal" ranges=192.168.1.1-192.168.1.254
```

### 2. Configurar Servidor PPPoE

Habilita el servidor PPPoE en la interfaz que conecta a tus clientes (usualmente bridge o interface LAN):

```bash
/interface pppoe-server server
add disabled=no interface=bridge service-name=ISP authentication=pap,chap \
    keepalive-timeout=30 one-session-per-host=yes

# O si tienes una interfaz específica (ejemplo: ether2):
# add disabled=no interface=ether2 service-name=ISP authentication=pap,chap \
#     keepalive-timeout=30 one-session-per-host=yes
```

### 3. Verificar Perfil PPP Predeterminado

El sistema creará automáticamente perfiles PPP con el formato `PLAN-XXmb` (ejemplo: `PLAN-50MB`, `PLAN-100MB`).

Puedes configurar un perfil predeterminado que se usará como base:

```bash
/ppp profile
add name=default-pppoe \
    local-address=10.0.0.1 \
    remote-address=pppoe-pool \
    use-encryption=yes \
    comment="Default PPPoE profile"
```

**IMPORTANTE**: Si decides usar un pool diferente, asegúrate de que exista primero en `/ip pool`.

### 4. Configuración Firewall (Opcional pero Recomendado)

Para mejor control de acceso, configura reglas de firewall:

```bash
# Permitir tráfico PPPoE
/ip firewall filter
add chain=input action=accept protocol=tcp dst-port=1701 comment="Allow PPPoE"
add chain=input action=accept protocol=udp dst-port=1701 comment="Allow PPPoE"

# Permitir tráfico de clientes PPPoE autenticados
add chain=forward action=accept connection-state=established,related \
    comment="Allow established connections"
add chain=forward action=accept in-interface-list=PPPoE \
    comment="Allow PPPoE clients"
```

### 5. Configurar NAT (si es necesario)

Si tus clientes PPPoE necesitan acceso a Internet:

```bash
/ip firewall nat
add chain=srcnat action=masquerade out-interface-list=WAN \
    comment="NAT for PPPoE clients"

# O si tienes una interfaz WAN específica:
# add chain=srcnat action=masquerade out-interface=ether1
```

## Verificación

### Verificar que el servidor PPPoE está activo:

```bash
/interface pppoe-server server print
```

### Ver perfiles PPP creados automáticamente:

```bash
/ppp profile print
```

Deberías ver perfiles con nombres como `PLAN-10MB`, `PLAN-50MB`, etc., creados automáticamente por el sistema de facturación.

### Ver usuarios PPPoE (secrets):

```bash
/ppp secret print
```

Aquí verás los usuarios PPPoE creados desde el sistema de facturación.

### Ver sesiones activas:

```bash
/ppp active print
```

Muestra las conexiones PPPoE activas en tiempo real.

## Troubleshooting

### Error: "invalid value for argument remote-address"

**Causa**: El pool de IPs especificado no existe.

**Solución**: Crea el pool de IPs como se muestra en el paso 1, o verifica que el nombre del pool coincida con la configuración.

### Los clientes no pueden autenticarse

**Verificar**:
1. El servidor PPPoE está habilitado: `/interface pppoe-server server print`
2. La interfaz correcta está configurada
3. El método de autenticación es compatible (PAP o CHAP)
4. Las credenciales en el sistema coinciden con las del MikroTik

### Los perfiles no se crean automáticamente

**Verificar**:
1. Las credenciales API del router en el sistema de facturación
2. El router está en estado "activo"
3. Los logs del backend: `docker compose logs backend`

## Notas Importantes

1. **Pool de IPs (AUTOMÁTICO)**:
   - ✅ El sistema crea automáticamente pools de IPs basados en los CIDRs del router
   - Nombre del pool: `pool-{nombre-router}` (espacios reemplazados por guiones)
   - Se crea al primer contrato PPPoE o al sincronizar perfiles
   - **Requisito**: Debes configurar los CIDRs en cada router en el sistema de facturación

2. **Perfiles Automáticos**: El sistema crea/actualiza automáticamente perfiles PPP con el formato `PLAN-{velocidad}MB` cuando:
   - Se crea un contrato PPPoE
   - Se actualiza la velocidad de un plan
   - Se sincroniza manualmente desde la interfaz

3. **Sincronización de Estado**: El sistema sincroniza automáticamente el estado del usuario PPPoE:
   - **ACTIVO**: Usuario habilitado (`disabled=no`)
   - **SUSPENDIDO**: Usuario deshabilitado (`disabled=yes`)
   - **CANCELADO**: Usuario eliminado

4. **Seguridad**: Asegúrate de usar contraseñas fuertes para los usuarios PPPoE.

## Configuración Mínima Rápida

Si solo quieres probar rápidamente:

```bash
# 1. Habilitar servidor PPPoE en el MikroTik
/interface pppoe-server server add disabled=no interface=bridge service-name=ISP

# 2. En el sistema de facturación:
#    - Crea un router y configura los CIDRs (ejemplo: 192.168.1.0/24)
#    - Prueba la conexión API
#    - Crea un plan con velocidades
#    - Crea un contrato PPPoE

# 3. El sistema automáticamente:
#    - Creará el pool de IPs desde los CIDRs del router
#    - Creará el perfil PPP con las velocidades del plan
#    - Creará el usuario PPPoE (secret) con usuario/contraseña
```

## Próximos Pasos

Después de configurar PPPoE en MikroTik:

1. Crea o edita un router en el sistema y prueba la conexión
2. Crea un plan con velocidades específicas (ejemplo: 50 Mbps bajada, 10 Mbps subida)
3. Crea un contrato seleccionando "PPPoE" y asigna usuario/contraseña
4. Verifica en MikroTik que el perfil y secret se crearon correctamente

## Referencias

- [MikroTik Wiki - PPPoE](https://wiki.mikrotik.com/wiki/Manual:Interface/PPPoE)
- [MikroTik Wiki - PPP](https://wiki.mikrotik.com/wiki/Manual:PPP)
- Documentación API: `MIKROTIK_SSL_GUIDE.md`
