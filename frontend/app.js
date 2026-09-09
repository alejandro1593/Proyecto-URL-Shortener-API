/* ==========================================================================
   URL Shortener - Frontend
   Aplicación de una sola página (sin frameworks) que consume la API.
   Secciones: configuración, utilidades, autenticación, URLs e inicialización.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONFIGURACIÓN
   -------------------------------------------------------------------------- */
// Base URL de la API. Con el backend sirviendo también el frontend, ambos
// comparten el mismo origen: rutas relativas funcionan en producción y local.
const API_BASE = '';

// Clave usada en localStorage para guardar el token de sesión
const TOKEN_KEY = 'url_shortener_token';

// Estado global de la app (el token se recupera al cargar la página)
let token = localStorage.getItem(TOKEN_KEY) || null;

/* --------------------------------------------------------------------------
   2. UTILIDADES
   -------------------------------------------------------------------------- */

/**
 * Llama a la API con el método y el cuerpo indicados.
 * Inyecta el token de sesión si existe y lanza un error si la respuesta no es 2xx.
 */
async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`; // autenticación

  // fetch hace la petición; esperamos la respuesta y la convertimos a JSON
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  // Si la API respondió con error, lanzamos excepción con el mensaje
  if (!res.ok) {
    throw new Error(data.message || 'Error en la solicitud');
  }
  return data;
}

/**
 * Escapa texto para evitar inyección de HTML (XSS) al pintar datos del servidor.
 */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Muestra un mensaje flotante (toast) durante unos segundos.
 * color es "success" o "error".
 */
function toast(message, color = 'success') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast ${color}`; // quita "hidden" y aplica el color
  setTimeout(() => el.classList.add('hidden'), 3000);
}

/**
 * Construye la URL acortada completa a partir del código corto.
 * Ejemplo: código "ab12cd" -> "/ab12cd" (mismo origen)
 */
function shortUrlFor(code) {
  return `${API_BASE}/${code}`;
}

/* --------------------------------------------------------------------------
   3. AUTENTICACIÓN
   -------------------------------------------------------------------------- */

// Referencias a los elementos del formulario de auth
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const btnAuth = document.getElementById('btn-auth');
const btnToggle = document.getElementById('btn-toggle');
const toggleText = document.getElementById('toggle-text');
const fieldFullName = document.getElementById('field-fullName');

// Modo actual del formulario: "login" o "register"
let authMode = 'login';

/**
 * Cambia entre los modos login y registro del formulario.
 */
function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';

  // Ajusta textos y la visibilidad del campo "nombre"
  authTitle.textContent = isLogin ? 'Iniciar sesión' : 'Crear cuenta';
  authSubtitle.textContent = isLogin ? 'Bienvenido de nuevo' : 'Es rápido y gratuito';
  btnAuth.textContent = isLogin ? 'Iniciar sesión' : 'Registrarme';
  toggleText.textContent = isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?';
  btnToggle.textContent = isLogin ? 'Regístrate' : 'Inicia sesión';
  fieldFullName.classList.toggle('hidden', isLogin);
}

/**
 * Envía la petición de login o registro según el modo activo.
 * Guarda el token en localStorage y entra al dashboard.
 */
async function handleAuth(e) {
  e.preventDefault(); // evita que el formulario recargue la página

  // En modo registro el nombre es obligatorio (no usamos required en HTML
  // porque si no, Chrome bloquea el login: el campo queda oculto y vacío)
  if (authMode === 'register' && !fullName.value.trim()) {
    toast('Escribe tu nombre', 'error');
    return;
  }

  const body = { email: email.value.trim(), password: password.value };
  if (authMode === 'register') body.fullName = fullName.value.trim();

  try {
    // El endpoint cambia según el modo (register o login)
    const path = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const data = await api(path, { method: 'POST', body });

    // Guardamos el accessToken para las siguientes peticiones
    token = data.data.accessToken;
    localStorage.setItem(TOKEN_KEY, token);

    // Limpiamos el formulario y mostramos el dashboard
    authForm.reset();
    showDashboard();
    toast(authMode === 'register' ? 'Cuenta creada correctamente' : 'Sesión iniciada');
  } catch (err) {
    toast(err.message, 'error');
  }
}

/**
 * Cierra la sesión: borra el token y muestra la pantalla de login.
 */
function logout() {
  token = null;
  localStorage.removeItem(TOKEN_KEY);
  showAuth();
  toast('Sesión cerrada');
}

/* --------------------------------------------------------------------------
   4. URLS: crear, listar, copiar y borrar
   -------------------------------------------------------------------------- */

// Referencias del dashboard
const createForm = document.getElementById('create-form');
const longUrlInput = document.getElementById('long-url');
const customCodeInput = document.getElementById('custom-code');
const urlsList = document.getElementById('urls-list');

/**
 * Crea una URL corta con lo introducido en el formulario.
 */
async function handleCreate(e) {
  e.preventDefault();

  // Cuerpo de la petición; el código personalizado va sólo si se escribió
  const body = { originalUrl: longUrlInput.value.trim() };
  const customCode = customCodeInput.value.trim();
  if (customCode) body.customCode = customCode;

  try {
    await api('/api/urls', { method: 'POST', body });
    longUrlInput.value = '';
    customCodeInput.value = '';
    toast('URL acortada correctamente');
    loadUrls(); // refresca la lista para mostrar la nueva
  } catch (err) {
    toast(err.message, 'error');
  }
}

/**
 * Obtiene y pinta la lista de URLs del usuario.
 * La API devuelve data -> { data: [urls...], pagination: {...} }
 */
async function loadUrls() {
  try {
    const res = await api('/api/urls');
    renderUrls(res.data.data); // el arreglo de URLs está en res.data.data
  } catch (err) {
    toast(err.message, 'error');
  }
}

/**
 * Dibuja cada URL como un elemento de la lista.
 */
function renderUrls(urls) {
  // Si no hay URLs, mostramos un mensaje vacío
  if (!urls || urls.length === 0) {
    urlsList.innerHTML = '<p class="empty">Aún no has acortado ninguna URL</p>';
    return;
  }

  // Construimos el HTML de todos los ítems y lo insertamos de una vez
  urlsList.innerHTML = urls.map((u) => {
    const short = shortUrlFor(u.shortCode);
    return `
      <div class="url-item">
        <div class="url-info">
          <a class="url-short" href="${short}" target="_blank" rel="noopener">${escapeHtml(short)}</a>
          <div class="url-original">${escapeHtml(u.originalUrl)}</div>
        </div>
        <span class="url-stats">${u.clickCount} clicks</span>
        <div class="url-actions">
          <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${short}')">Copiar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUrl('${u.id}')">Borrar</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Copia la URL corta al portapapeles y lo confirma con un toast.
 */
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  toast('URL copiada al portapapeles');
}

/**
 * Borra una URL y refresca la lista.
 */
async function deleteUrl(id) {
  try {
    await api(`/api/urls/${id}`, { method: 'DELETE' });
    toast('URL eliminada');
    loadUrls();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* --------------------------------------------------------------------------
   5. VISUALIZACIÓN DE VISTAS
   -------------------------------------------------------------------------- */

// Referencias de las dos vistas principales
const viewAuth = document.getElementById('view-auth');
const viewDashboard = document.getElementById('view-dashboard');
const btnLogout = document.getElementById('btn-logout');

/**
 * Muestra la pantalla de login y oculta el dashboard.
 */
function showAuth() {
  viewAuth.classList.remove('hidden');
  viewDashboard.classList.add('hidden');
  btnLogout.classList.add('hidden');
  setAuthMode('login');
}

/**
 * Muestra el dashboard (requiere token) y carga las URLs.
 */
function showDashboard() {
  viewAuth.classList.add('hidden');
  viewDashboard.classList.remove('hidden');
  btnLogout.classList.remove('hidden');
  loadUrls();
}

/* --------------------------------------------------------------------------
   6. EVENTOS E INICIALIZACIÓN
   -------------------------------------------------------------------------- */

// Formulario de autenticación -> enviar sesión/registro
authForm.addEventListener('submit', handleAuth);

// Botón que alterna entre login y registro
btnToggle.addEventListener('click', () =>
  setAuthMode(authMode === 'login' ? 'register' : 'login')
);

// Cerrar sesión
btnLogout.addEventListener('click', logout);

// Formulario de creación de URLs
createForm.addEventListener('submit', handleCreate);

// Botón para refrescar la lista manualmente
document.getElementById('btn-refresh').addEventListener('click', loadUrls);

// Al cargar la página: si hay token entramos directo al dashboard
if (token) {
  showDashboard();
} else {
  showAuth();
}