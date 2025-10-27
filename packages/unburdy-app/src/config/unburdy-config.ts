/**
 * Unburdy App Configuration
 * 
 * This file shows how to override the default core-frontend configuration
 * for the Unburdy app with custom logos and legal links.
 */

import { setAppConfig } from '@agile-exec/core-frontend/config/app-config'

// Import Unburdy-specific logos
import unburdyLogo from '../assets/unburdy-logo.svg'
import unburdyLogoDark from '../assets/unburdy-logo-dark.svg'
import unburdyLogoSmall from '../assets/unburdy-logo-small.svg'
import unburdyLogoSmallDark from '../assets/unburdy-logo-small-dark.svg'

// Configure the app with Unburdy-specific settings
export const configureUnburdyApp = () => {
  setAppConfig({
    logos: {
      main: unburdyLogo,
      mainDark: unburdyLogoDark,
      small: unburdyLogoSmall,
      smallDark: unburdyLogoSmallDark
    },
    
    legal: {
      termsOfService: {
        url: 'https://unburdy.com/terms',
        text: {
          de: 'Allgemeine Geschäftsbedingungen',
          en: 'Terms and Conditions'
        }
      },
      privacyPolicy: {
        url: 'https://unburdy.com/privacy', 
        text: {
          de: 'Datenschutzbestimmungen',
          en: 'Privacy Policy'
        }
      }
    },
    
    app: {
      name: 'Unburdy',
      description: {
        de: 'Die Lerntherapie-Plattform für Kinder mit Lernschwierigkeiten',
        en: 'Learning therapy platform for children with learning difficulties'
      }
    }
  })
}

// Call this function early in the Unburdy app initialization
// For example, in main.ts before creating the Vue app