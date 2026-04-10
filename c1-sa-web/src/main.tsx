import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { SensorProvider } from './context/SensorContext'
import { AuthProvider } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'

const oidcConfig = {
  authority: "https://auth.azura.io.vn/realms/smart_aquarium",
  client_id: "aquarium-frontend",
  redirect_uri: window.location.origin,
  response_type: "code",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <ThemeProvider>
        <LanguageProvider>
          <SensorProvider> 
            <RouterProvider router={router} />
          </SensorProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)