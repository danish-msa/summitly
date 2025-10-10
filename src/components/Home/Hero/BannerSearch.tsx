import { useState } from 'react';
import React from 'react'
import BuyForm from './BuyForm';
import RentForm from './RentForm';
import SellForm from './SellForm';
import GoogleMapsWrapper from '@/components/Helper/GoogleMapsWrapper';

// Define proper types for the context
type LocationSuggestion = {
  category: string;
  items: Array<{
    id: string;
    name: string;
    type: string;
  }>;
};

// Create a shared context for location suggestions with proper types
export const LocationSuggestionsContext = React.createContext<{
  suggestions: LocationSuggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<LocationSuggestion[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  suggestions: [],
  setSuggestions: () => {},
  loading: false,
  setLoading: () => {}
});

const BannerSearch = () => {
  const [activeTab, setActiveTab] = useState('rent'); // Default tab
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <LocationSuggestionsContext.Provider value={{ suggestions, setSuggestions, loading, setLoading }}>
      <div className="banner-search shadow-2xl">
        <div className="tabs">
          <button
            className={activeTab === 'rent' ? 'active' : ''} 
            onClick={() => setActiveTab('rent')}
          >
            Rent
          </button>
          <button
            className={activeTab === 'buy' ? 'active' : ''}
            onClick={() => setActiveTab('buy')}
          >
            Buy
          </button>
          <button
            className={activeTab === 'sell' ? 'active' : ''}
            onClick={() => setActiveTab('sell')}
          >
            Sell
          </button>
        </div>

        <div className="search-form">
          <GoogleMapsWrapper>
            {activeTab === 'rent' && <RentForm />}
            {activeTab === 'buy' && <BuyForm />}
            {activeTab === 'sell' && <SellForm />}
          </GoogleMapsWrapper>
        </div>
      </div>
    </LocationSuggestionsContext.Provider>
  );
};

export default BannerSearch;