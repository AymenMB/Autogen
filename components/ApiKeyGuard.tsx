import React, { useState, useEffect } from 'react';

interface ApiKeyGuardProps {
  children: React.ReactNode;
  reason: string;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ children, reason }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkKey = async () => {
    setIsLoading(true);
    try {
      const win = window as any;
      if (win.aistudio?.hasSelectedApiKey) {
        const selected = await win.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for environments without the specific wrapper injection (e.g. local dev without the specific extension/wrapper)
        // We assume true if env var is present, or handle gracefully.
        // For this specific task environment, we assume the method exists if running in the expected container.
        // If not, we default to true to allow UI to render (and fail at API call if key missing).
        setHasKey(!!process.env.API_KEY);
      }
    } catch (e) {
      console.error("Failed to check API key", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio?.openSelectKey) {
      try {
        await win.aistudio.openSelectKey();
        // Assume success immediately as per guidance
        setHasKey(true);
      } catch (e) {
        console.error("Key selection failed", e);
      }
    } else {
      alert("API Key selection dialog not available in this environment.");
    }
  };

  if (isLoading) return <div className="p-4 text-carbon-300">Checking permissions...</div>;

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-carbon-900/50 rounded-xl border border-carbon-700">
        <div className="bg-neon-cyan/10 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-cyan"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Premium Feature Access</h3>
        <p className="text-carbon-300 mb-6 max-w-md">
          {reason}. This requires a paid API key. Please select your project key to continue.
        </p>
        <button 
          onClick={handleSelectKey}
          className="bg-neon-cyan text-carbon-950 px-6 py-3 rounded-lg font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2"
        >
          Select API Key
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        <p className="mt-4 text-xs text-carbon-500">
          See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-neon-cyan">billing documentation</a> for details.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiKeyGuard;