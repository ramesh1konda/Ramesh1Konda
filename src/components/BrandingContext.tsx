import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { WhiteLabelConfig } from '../types';

interface BrandingContextType {
  config: WhiteLabelConfig | null;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({ config: null, isLoading: true });

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for brokerId in URL
    const params = new URLSearchParams(window.location.search);
    const brokerId = params.get('brokerId');

    if (brokerId) {
      const unsubscribe = onSnapshot(doc(db, 'brokerConfigs', brokerId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as WhiteLabelConfig;
          setConfig(data);
          
          // Apply primary color to CSS variables
          document.documentElement.style.setProperty('--primary-color', data.primaryColor);
          // Also set a lighter version for backgrounds if needed
          document.documentElement.style.setProperty('--primary-color-light', `${data.primaryColor}15`);
        } else {
          setConfig(null);
          // Reset to defaults
          document.documentElement.style.removeProperty('--primary-color');
          document.documentElement.style.removeProperty('--primary-color-light');
        }
        setIsLoading(false);
      }, (error) => {
        console.error('Error fetching branding config:', error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
      // Reset to defaults
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--primary-color-light');
    }
  }, []);

  return (
    <BrandingContext.Provider value={{ config, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
};
