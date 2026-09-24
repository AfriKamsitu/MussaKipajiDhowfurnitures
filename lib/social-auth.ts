/** Browser helpers for Google Identity Services + Facebook SDK. */

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client"
const FACEBOOK_SCRIPT = "https://connect.facebook.net/en_US/sdk.js"

type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string
      scope: string
      callback: (response: { access_token?: string; error?: string; error_description?: string }) => void
    }) => GoogleTokenClient
  }
}

type FacebookLoginResponse = {
  status: string
  authResponse?: { accessToken?: string }
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts }
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login: (callback: (response: FacebookLoginResponse) => void, options?: { scope?: string }) => void
    }
    fbAsyncInit?: () => void
  }
}

function loadScript(src: string, id: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Social login is only available in the browser."))
  }
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing?.dataset.loaded === "true") return Promise.resolve()
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = "true"
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export function getGoogleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ""
}

export function getFacebookAppId() {
  return process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || ""
}

export async function requestGoogleAccessToken(): Promise<string> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error("Google sign-in is currently unavailable.")
  }

  await loadScript(GOOGLE_SCRIPT, "google-gsi-client")
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Sign-In SDK failed to initialize.")
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(
              new Error(
                response.error_description ||
                  response.error ||
                  "Google sign-in was cancelled or failed.",
              ),
            )
            return
          }
          resolve(response.access_token)
        },
      })
      client.requestAccessToken({ prompt: "select_account" })
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Google sign-in failed."))
    }
  })
}

async function ensureFacebookSdk(appId: string): Promise<void> {
  if (window.FB) {
    window.FB.init({ appId, cookie: true, xfbml: false, version: "v21.0" })
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Facebook SDK timed out while loading."))
    }, 10000)

    window.fbAsyncInit = () => {
      window.clearTimeout(timeout)
      if (!window.FB) {
        reject(new Error("Facebook SDK failed to initialize."))
        return
      }
      window.FB.init({ appId, cookie: true, xfbml: false, version: "v21.0" })
      resolve()
    }

    loadScript(FACEBOOK_SCRIPT, "facebook-jssdk")
      .then(() => {
        // If FB was already present after script load (cached), init immediately.
        if (window.FB) {
          window.clearTimeout(timeout)
          window.FB.init({ appId, cookie: true, xfbml: false, version: "v21.0" })
          resolve()
        }
      })
      .catch((error) => {
        window.clearTimeout(timeout)
        reject(error)
      })
  })
}

export async function requestFacebookAccessToken(): Promise<string> {
  const appId = getFacebookAppId()
  if (!appId) {
    throw new Error("Facebook sign-in is currently unavailable.")
  }

  await ensureFacebookSdk(appId)

  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("Facebook SDK is unavailable."))
      return
    }

    window.FB.login(
      (response) => {
        const token = response.authResponse?.accessToken
        if (response.status === "connected" && token) {
          resolve(token)
          return
        }
        reject(new Error("Facebook sign-in was cancelled or email permission was denied."))
      },
      { scope: "email,public_profile" },
    )
  })
}

export async function requestSocialProviderToken(
  provider: "google" | "facebook",
): Promise<string> {
  if (provider === "google") return requestGoogleAccessToken()
  return requestFacebookAccessToken()
}
