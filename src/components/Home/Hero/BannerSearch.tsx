import { useState } from 'react';
import React from 'react';
import BuyForm from './BuyForm';
import RentForm from './RentForm';
import SellForm from './SellForm';
import MortgageForm from './MortgageForm';
import HomeValueForm from './HomeValueForm';

const BannerSearch = () => {
  const [activeTab, setActiveTab] = useState('buy');

  return (
    <div className="banner-search shadow-2xl">
      <div className="tabs">
        <button
          className={activeTab === 'buy' ? 'active' : ''}
          onClick={() => setActiveTab('buy')}
        >
          Buy
        </button>
        <button
          className={activeTab === 'rent' ? 'active' : ''}
          onClick={() => setActiveTab('rent')}
        >
          Rent
        </button>
        <button
          className={activeTab === 'sell' ? 'active' : ''}
          onClick={() => setActiveTab('sell')}
        >
          Sell
        </button>
        <button
          className={activeTab === 'mortgage' ? 'active' : ''}
          onClick={() => setActiveTab('mortgage')}
        >
          Mortgage
        </button>
        <button
          className={activeTab === 'home-value' ? 'active' : ''}
          onClick={() => setActiveTab('home-value')}
        >
          Home Value
        </button>
      </div>

      <div className="search-form">
        {activeTab === 'buy' && <BuyForm />}
        {activeTab === 'rent' && <RentForm />}
        {activeTab === 'sell' && <SellForm />}
        {activeTab === 'mortgage' && <MortgageForm />}
        {activeTab === 'home-value' && <HomeValueForm />}
      </div>
    </div>
  );
};

export default BannerSearch;
