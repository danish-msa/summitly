import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const BannerSearch = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'buy', label: 'Buy' },
    { id: 'rent', label: 'Rent' },
    { id: 'sell', label: 'Sell' },
    { id: 'preapproval', label: 'Pre-approval' },
    { id: 'justsold', label: 'Just sold' },
    { id: 'homevalue', label: 'Home value' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission
    console.log('Search submitted:', { activeTab, searchQuery });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Simple Search Container */}
      
        {/* Tab Navigation */}
        <div className="flex bg-muted/20 p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Search Input */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center bg-background rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <input
                type="text"
                placeholder="Address, School, City, Zip or Neighborhood"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 md:px-8 py-4 md:py-5 text-base md:text-lg bg-transparent border-none outline-none rounded-full placeholder:text-muted-foreground font-body"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-foreground hover:bg-foreground/90 text-background"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
          </form>
          
          {/* Bottom Text */}
          <p className="text-center mt-4 text-sm md:text-base text-foreground/70 font-body">
            <Search className="w-4 h-4 inline mr-1" />
            Search it how you'd say it. <span className="underline cursor-pointer hover:text-foreground">Try it</span>
          </p>
        </div>
      
    </motion.div>
  );
};

export default BannerSearch;