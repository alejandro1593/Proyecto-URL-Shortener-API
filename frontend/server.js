/* ==========================================================================
   URL Shortener - Frontend server
   Servidor estático mínimo (sólo Node, sin dependencias) que sirve el
   frontend en el puerto 3001. El backend ya permite CORS desde ahí.
   ========================================================================== */

// Módulos nativos de Node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;               // Puerto donde corre el frontend
const ROOT = __dirname;          // Carpeta raíz: la propia carpeta del frontend

// Mapa de extensiones de archivo a su tipo MIME
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Creamos el servidor HTTP
const server = http.createServer((req, res) => {
  // Resolvemos la ruta pedida dentro de ROOT (evita salir de la carpeta)
  let urlPath = req.url.split('?')[0];        // quitamos query string
  if (urlPath === '/') urlPath = '/index.html'; // ruta raíz -> index.html

  const filePath = path.join(ROOT, urlPath);

  // Seguridad: si la carpeta final no es la raíz, respondemos 403
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // Leemos el archivo de forma asíncrona
  fs.readFile(filePath, (err, content) => {
    // Si no existe, respondemos 404
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<h1>404 - No encontrado</h1>');
    }

    // Tipo MIME según la extensión (por defecto texto plano)
    const type = MIME[path.extname(filePath)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
});

// Ponemos el servidor a escuchar en el puerto configurado
server.listen(PORT, () => {
  console.log(`Frontend disponible en http://localhost:${PORT}`);
});