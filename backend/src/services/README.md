# services/ - Lógica de negocio

Este directorio separa la lógica de negocio de los controladores.
Los controladores manejan request/response HTTP y delegan aquí la lógica.

- auth.service.ts    -> Registro, login, refresh token, revocación de tokens
- url.service.ts     -> CRUD de URLs, generación de códigos, cache con Redis
- stats.service.ts   -> Analítica de clicks, resumen general y por URL
- click.service.ts   -> Registro de clicks, top URLs y clicks por día