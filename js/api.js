// ============================================================
//  QUINDES APP — api.js  (comunicación con el backend)
// ============================================================

async function apiCall(endpoint, method = 'GET', body = null) {
  const url = CONFIG.API_URL + endpoint;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta inválida: ' + text.substring(0, 200)); }
  if (json.error) throw new Error(json.error);
  return json;
}

async function gasCall(action, data = {}) {
  if (action === 'getCurrentUser') {
    return apiCall('/usuario?email=' + encodeURIComponent(data.email));
  }
  if (action === 'getMyProfile') {
    return apiCall('/perfil/' + data.rowNumber);
  }
  if (action === 'updateMyProfile') {
    return apiCall('/perfil/' + data.rowNumber, 'PUT', data.data);
  }
  if (action === 'subirArchivo') {
    return apiCall('/archivo', 'POST', {
      base64Data: data.base64Data,
      tipoArchivo: data.tipoArchivo,
      email: data.email,
    });
  }
  if (action === 'borrarPerfil') {
    return apiCall('/perfil/' + data.rowNumber, 'DELETE');
  }
  throw new Error('Acción no soportada: ' + action);
}