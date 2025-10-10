export const navLinks = [
    // { id: 1, label: 'Home', url: '/' },
    {
      id: 1,
      label: 'Listings',
      url: '/listings',
    },
    {
      id: 2,
      label: 'Map Search',
      url: '/map-search',
    },
    {
      id: 3,
      label: 'Buy & Sell',
      url: '#',
      subLinks: [
        { id: 31, label: 'Buy with us', url: '/buy' },
        { id: 32, label: 'Sell with us', url: '/sell' },
        { id: 33, label: 'Home Estimator', url: '/home-estimation' },
      ],
    },
    { id: 4, label: 'Find a Realtor', url: '/agents' },
    { id: 5, label: 'Pre-Con', url: '/pre-con' },
    {
      id: 6,
      label: 'Tools',
      url: '#',
      subLinks: [
        { id: 61, label: 'Down Payment Calculator', url: '/down-payment-calculator' },
      ],
    },
    {
      id: 7,
      label: 'More',
      url: '#',
      subLinks: [
        { id: 71, label: 'About Us', url: '/about' },
        { id: 72, label: 'Contact us', url: '/contact' },
        { id: 73, label: 'FAQs', url: '/faqs' },
      ],
    },
    
];