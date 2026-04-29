import Keycloak from 'keycloak-js';

// Cấu hình Keycloak cho Practice App
const keycloak = new Keycloak({
  url: 'https://auth.azura.io.vn',
  realm: 'Practice_App',
  clientId: 'practice-client',
});

export default keycloak;
