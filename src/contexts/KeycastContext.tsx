import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createDivineKeycastClient, KeycastRpc, type StoredCredentials } from '@/lib/keycast';
import { KeycastSigner } from '@/lib/keycast/signer';

interface KeycastContextValue {
  /** Whether the user is authenticated via Keycast */
  isAuthenticated: boolean;
  /** Whether we're checking for existing session */
  isLoading: boolean;
  /** The user's public key (hex) */
  pubkey: string | null;
  /** The Keycast signer for signing events */
  signer: KeycastSigner | null;
  /** The Keycast RPC client */
  rpc: KeycastRpc | null;
  /** Start the OAuth login flow */
  login: () => Promise<void>;
  /** Log out and clear session */
  logout: () => void;
  /** Handle OAuth callback */
  handleCallback: () => Promise<boolean>;
}

const KeycastContext = createContext<KeycastContextValue | null>(null);

interface KeycastProviderProps {
  children: ReactNode;
  /** Override redirect URI (defaults to /callback) */
  redirectPath?: string;
}

export function KeycastProvider({ children, redirectPath = '/callback' }: KeycastProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<StoredCredentials | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [rpc, setRpc] = useState<KeycastRpc | null>(null);
  const [signer, setSigner] = useState<KeycastSigner | null>(null);

  // Get redirect URI based on current origin
  const getRedirectUri = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + redirectPath;
  }, [redirectPath]);

  // Create the Keycast client
  const getClient = useCallback(() => {
    return createDivineKeycastClient(getRedirectUri());
  }, [getRedirectUri]);

  // Initialize RPC and signer from credentials
  const initializeFromCredentials = useCallback(async (creds: StoredCredentials) => {
    if (!creds.accessToken) return;

    const newRpc = KeycastRpc.fromServerUrl('https://login.divine.video', creds.accessToken);
    setRpc(newRpc);

    const newSigner = new KeycastSigner(newRpc);
    setSigner(newSigner);

    try {
      const pk = await newRpc.getPublicKey();
      setPubkey(pk);
    } catch (e) {
      console.error('Failed to get public key:', e);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const client = getClient();
        const session = await client.oauth.getSessionWithRefresh();
        
        if (session && session.accessToken) {
          setCredentials(session);
          await initializeFromCredentials(session);
        }
      } catch (e) {
        console.error('Failed to check session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [getClient, initializeFromCredentials]);

  // Start OAuth login flow
  const login = useCallback(async () => {
    const client = getClient();
    const { url } = await client.oauth.getAuthorizationUrl({
      defaultRegister: true,
    });
    window.location.href = url;
  }, [getClient]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (): Promise<boolean> => {
    const client = getClient();
    const result = client.oauth.parseCallback(window.location.href);

    if ('error' in result) {
      console.error('OAuth error:', result.error, result.description);
      return false;
    }

    try {
      const tokens = await client.oauth.exchangeCode(result.code);
      const creds = client.oauth.toStoredCredentials(tokens);
      setCredentials(creds);
      await initializeFromCredentials(creds);
      return true;
    } catch (e) {
      console.error('Token exchange failed:', e);
      return false;
    }
  }, [getClient, initializeFromCredentials]);

  // Logout
  const logout = useCallback(() => {
    const client = getClient();
    client.oauth.logout();
    setCredentials(null);
    setPubkey(null);
    setRpc(null);
    setSigner(null);
  }, [getClient]);

  const value: KeycastContextValue = {
    isAuthenticated: !!credentials && !!pubkey,
    isLoading,
    pubkey,
    signer,
    rpc,
    login,
    logout,
    handleCallback,
  };

  return (
    <KeycastContext.Provider value={value}>
      {children}
    </KeycastContext.Provider>
  );
}

export function useKeycast(): KeycastContextValue {
  const context = useContext(KeycastContext);
  if (!context) {
    throw new Error('useKeycast must be used within a KeycastProvider');
  }
  return context;
}
