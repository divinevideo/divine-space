import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { createKeycastClient, KeycastRpc, type StoredCredentials, type TokenResponse } from '@/lib/keycast';
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

// Get the redirect URI - needs to be stable
function getRedirectUri(redirectPath: string): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin + redirectPath;
}

export function KeycastProvider({ children, redirectPath = '/callback' }: KeycastProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<StoredCredentials | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [rpc, setRpc] = useState<KeycastRpc | null>(null);
  const [signer, setSigner] = useState<KeycastSigner | null>(null);

  // Create a stable client instance
  const client = useMemo(() => {
    const redirectUri = getRedirectUri(redirectPath);
    return createKeycastClient({
      serverUrl: 'https://login.divine.video',
      clientId: 'divine',
      redirectUri,
      storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    });
  }, [redirectPath]);

  // Initialize RPC and signer from credentials
  const initializeFromCredentials = useCallback(async (creds: StoredCredentials) => {
    if (!creds.accessToken) {
      console.error('No access token in credentials');
      return false;
    }

    try {
      const newRpc = KeycastRpc.fromServerUrl('https://login.divine.video', creds.accessToken);
      setRpc(newRpc);

      const newSigner = new KeycastSigner(newRpc);
      setSigner(newSigner);

      const pk = await newRpc.getPublicKey();
      setPubkey(pk);
      console.log('Initialized with pubkey:', pk.substring(0, 16) + '...');
      return true;
    } catch (e) {
      console.error('Failed to initialize from credentials:', e);
      return false;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await client.oauth.getSessionWithRefresh();
        
        if (session && session.accessToken) {
          console.log('Found existing session');
          setCredentials(session);
          await initializeFromCredentials(session);
        } else {
          console.log('No existing session found');
        }
      } catch (e) {
        console.error('Failed to check session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [client, initializeFromCredentials]);

  // Start OAuth login flow
  const login = useCallback(async () => {
    const { url } = await client.oauth.getAuthorizationUrl({
      defaultRegister: true,
    });
    console.log('Redirecting to:', url);
    window.location.href = url;
  }, [client]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (): Promise<boolean> => {
    const result = client.oauth.parseCallback(window.location.href);
    console.log('Parsed callback result:', 'code' in result ? 'has code' : result);

    if ('error' in result) {
      console.error('OAuth error:', result.error, result.description);
      return false;
    }

    try {
      console.log('Exchanging code for tokens...');
      const tokens: TokenResponse = await client.oauth.exchangeCode(result.code);
      console.log('Got tokens:', { 
        hasBunkerUrl: !!tokens.bunker_url, 
        hasAccessToken: !!tokens.access_token,
        expiresIn: tokens.expires_in 
      });
      
      const creds = client.oauth.toStoredCredentials(tokens);
      setCredentials(creds);
      
      const success = await initializeFromCredentials(creds);
      return success;
    } catch (e) {
      console.error('Token exchange failed:', e);
      return false;
    }
  }, [client, initializeFromCredentials]);

  // Logout
  const logout = useCallback(() => {
    client.oauth.logout();
    setCredentials(null);
    setPubkey(null);
    setRpc(null);
    setSigner(null);
    console.log('Logged out');
  }, [client]);

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
