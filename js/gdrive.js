// ============================================================
//  PIVOT APP — gdrive.js  (Google Drive Picker integration)
// ============================================================

let _driveTokenClient    = null;
let _driveAccessToken    = null;
let _drivePickerLoaded   = false;
let _pendingCropTarget   = null;

// Punto de entrada público — llamar con el cropTarget correspondiente
// Ej: abrirDrivePicker('registro') / abrirDrivePicker('fotoBase64') / abrirDrivePicker('logoBase64')
function abrirDrivePicker(targetKey) {
  _pendingCropTarget = targetKey;
  _solicitarTokenDrive();
}

function _solicitarTokenDrive() {
  if (!_driveTokenClient) {
    _driveTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('[DRIVE] Error al obtener token:', tokenResponse.error);
          mostrarToastGuardado('No se pudo conectar con Google Drive');
          return;
        }
        _driveAccessToken = tokenResponse.access_token;
        _cargarPickerYAbrir();
      },
    });
  }
  _driveTokenClient.requestAccessToken({ prompt: 'select_account' });
}

function _cargarPickerYAbrir() {
  if (_drivePickerLoaded) {
    _abrirPicker();
    return;
  }
  gapi.load('picker', () => {
    _drivePickerLoaded = true;
    _abrirPicker();
  });
}

function _abrirPicker() {
  const view = new google.picker.View(google.picker.ViewId.DOCS_IMAGES);
  view.setMimeTypes('image/jpeg,image/png,image/webp,image/gif');

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(_driveAccessToken)
    .setDeveloperKey(CONFIG.GOOGLE_PICKER_API_KEY)
    .setCallback(_onDriveFilePicked)
    .setTitle('Elegir imagen de Google Drive')
    .build();

  picker.setVisible(true);
}

async function _onDriveFilePicked(data) {
  if (data.action !== google.picker.Action.PICKED) return;
  const file   = data.docs[0];
  const fileId = file.id;
  try {
    mostrarToastGuardado('Descargando desde Drive…');
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${_driveAccessToken}` } }
    );
    if (!res.ok) throw new Error('Error al descargar el archivo de Drive');
    const blob   = await res.blob();
    const base64 = await _blobABase64(blob);
    cropTarget = _pendingCropTarget;
    abrirCropper(base64);
  } catch (e) {
    console.error('[DRIVE] Error:', e);
    mostrarToastGuardado('Error al obtener el archivo de Drive');
  }
}

function _blobABase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}