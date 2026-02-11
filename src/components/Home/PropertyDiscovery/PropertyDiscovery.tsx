import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Waves, TreePine, TrendingUp, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/Helper/SectionHeading';

interface CityCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cities: string[];
}

const rentCategories: CityCategory[] = [
  {
    id: 'city',
    title: 'In the city',
    description: 'Live among the hustle and bustle',
    icon: <Building2 className="w-6 h-6" />,
    cities: [
      'Toronto properties to rent',
      'Vancouver properties to rent',
      'Montreal properties to rent',
      'Calgary properties to rent',
      'Ottawa properties to rent',
      'Edmonton properties to rent'
    ]
  },
  {
    id: 'coast',
    title: 'On the coast',
    description: 'Wake up to fresh air and sea views',
    icon: <Waves className="w-6 h-6" />,
    cities: [
      'Victoria properties to rent',
      'Halifax properties to rent',
      'St. John\'s properties to rent',
      'Charlottetown properties to rent',
      'Nanaimo properties to rent',
      'Sydney properties to rent'
    ]
  },
  {
    id: 'rural',
    title: 'Rural and countryside',
    description: 'Enjoy living close to nature',
    icon: <TreePine className="w-6 h-6" />,
    cities: [
      'Guelph properties to rent',
      'Kingston properties to rent',
      'Peterborough properties to rent',
      'Barrie properties to rent',
      'Oshawa properties to rent',
      'Windsor properties to rent'
    ]
  },
  {
    id: 'popular',
    title: 'Popular locations',
    description: 'Move to a property hotspot',
    icon: <TrendingUp className="w-6 h-6" />,
    cities: [
      'See all Canadian properties to rent',
      'Mississauga properties to rent',
      'Brampton properties to rent',
      'Hamilton properties to rent',
      'London properties to rent',
      'Kitchener properties to rent',
      'Markham properties to rent'
    ]
  }
];

const saleCategories: CityCategory[] = [
  {
    id: 'city',
    title: 'In the city',
    description: 'Live among the hustle and bustle',
    icon: <Building2 className="w-6 h-6" />,
    cities: [
      'Toronto properties for sale',
      'Vancouver properties for sale',
      'Montreal properties for sale',
      'Calgary properties for sale',
      'Ottawa properties for sale',
      'Edmonton properties for sale'
    ]
  },
  {
    id: 'coast',
    title: 'On the coast',
    description: 'Wake up to fresh air and sea views',
    icon: <Waves className="w-6 h-6" />,
    cities: [
      'Victoria properties for sale',
      'Halifax properties for sale',
      'St. John\'s properties for sale',
      'Charlottetown properties for sale',
      'Nanaimo properties for sale',
      'Sydney properties for sale'
    ]
  },
  {
    id: 'rural',
    title: 'Rural and countryside',
    description: 'Enjoy living close to nature',
    icon: <TreePine className="w-6 h-6" />,
    cities: [
      'Guelph properties for sale',
      'Kingston properties for sale',
      'Peterborough properties for sale',
      'Barrie properties for sale',
      'Oshawa properties for sale',
      'Windsor properties for sale'
    ]
  },
  {
    id: 'popular',
    title: 'Popular locations',
    description: 'Move to a property hotspot',
    icon: <TrendingUp className="w-6 h-6" />,
    cities: [
      'See all Canadian properties for sale',
      'Mississauga properties for sale',
      'Brampton properties for sale',
      'Hamilton properties for sale',
      'London properties for sale',
      'Kitchener properties for sale',
      'Markham properties for sale'
    ]
  }
];

const PropertyDiscovery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rent' | 'sale'>('rent');

  const currentCategories = activeTab === 'rent' ? rentCategories : saleCategories;

  const handleCityClick = (cityName: string) => {
    console.log(`Clicked on: ${cityName}`);
    // Add your navigation logic here
  };

  return (
    <div className="pt-16 pb-16 bg-gradient-to-br from-icy-blue to-glacier">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeading 
          heading="Discover Your Perfect Home" 
          subheading="Property Discovery" 
          description="Browse by property type and location to find your ideal home" 
        />

        {/* Toggle Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 mb-12">
          <div className="bg-white rounded-full p-1 shadow-lg border border-mist">
            <Button
              variant={activeTab === 'rent' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('rent')}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === 'rent'
                  ? ''
                  : 'text-smoky-gray hover:text-midnight'
              }`}
            >
              For Rent
            </Button>
            <Button
              variant={activeTab === 'sale' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('sale')}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === 'sale'
                  ? ''
                  : 'text-smoky-gray hover:text-midnight'
              }`}
            >
              For Sale
            </Button>
          </div>
          
          {/* Explore More Link */}
          <button 
            onClick={() => console.log('Explore more towns & cities clicked')}
            className="text-primary hover:text-primary-600 font-medium text-sm transition-colors duration-300 underline underline-offset-4 hover:underline-offset-2"
          >
            Explore more towns & cities
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentCategories.map((category) => (
            <Card key={category.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 border border-brand-mist rounded-lg text-primary">
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-md font-bold text-brand-cb-blue group-hover:text-primary transition-colors font-body">
                      {category.title}
                    </CardTitle>
                    <p className="text-xs text-smoky-gray font-body">
                      {category.description}
                    </p>
                  </div>
                </div>
                
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {category.cities.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => handleCityClick(city)}
                      className="w-full p-2 text-left rounded-lg hover:bg-brand-tide transition-all duration-300 text-smoky-gray hover:text-primary border border-transparent hover:border-primary-200 font-body"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-sm font-medium">{city}</span>
                      </span>
                      
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-smoky-gray text-sm font-body">
            Click on any location to explore available properties
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyDiscovery;
