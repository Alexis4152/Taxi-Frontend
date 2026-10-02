// sockjs-client espera la variable global de Node ("global"), que no existe en el navegador.
// Debe importarse antes que cualquier otro modulo (por eso es el primer import en main.jsx).
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window
}
