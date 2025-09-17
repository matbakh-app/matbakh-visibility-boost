export const getVCEnvironmentInfo = () => {
  if (process.env.NODE_ENV === 'production') return null

  // Statt import.meta.env:
  const env = (globalThis as any).importMetaEnv ?? process.env;
  const provider = env.VITE_VC_API_PROVIDER
  const apiBase = env.VITE_PUBLIC_API_BASE

  if (!apiBase) {
    throw new Error('Missing VITE_PUBLIC_API_BASE environment variable')
  }

  if (provider !== 'aws') {
    throw new Error(
      `Invalid VC API provider: ${provider}. Expected 'aws'`
    )
  }

  return {
    provider,
    apiBase,
    env: 'test',
  }
}

export const startVisibilityCheck = async (
  email: string,
  name?: string,
  marketing?: boolean,
  locale?: string
): Promise<{ token?: string; error?: boolean }> => {
  try {
    // Statt import.meta.env:
    const env = (globalThis as any).importMetaEnv ?? process.env;
    const provider = env.VITE_VC_API_PROVIDER
    const apiBase = env.VITE_PUBLIC_API_BASE

    if (provider !== 'aws' || !apiBase) {
      return { error: true }
    }

    const response = await fetch(`${apiBase}/vc/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email,
        name,
        marketing,
        locale,
      }),
    })

    if (!response.ok) {
      return { error: true }
    }

    const data = await response.json()
    return { token: data.token }
  } catch (e) {
    return { error: true }
  }
}
