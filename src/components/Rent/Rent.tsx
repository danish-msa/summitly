import React from "react";
import Hero from "./Hero/Hero";
import NewestListingsSection from "./NewestListingsSection/NewestListingsSection";
import ApartmentsCtaSection from "./ApartmentsCtaSection/ApartmentsCtaSection";
import RentalsWithRentSpecialsSection from "./RentalsWithRentSpecialsSection/RentalsWithRentSpecialsSection";
import PetFriendlyRentalsSection from "./PetFriendlyRentalsSection/PetFriendlyRentalsSection";
import RentalsAcceptingOnlineApplicationsSection from "./RentalsAcceptingOnlineApplicationsSection/RentalsAcceptingOnlineApplicationsSection";
import RentalsWithInUnitLaundrySection from "./RentalsWithInUnitLaundrySection/RentalsWithInUnitLaundrySection";
import RentalsWithPoolsSection from "./RentalsWithPoolsSection/RentalsWithPoolsSection";
import ListRentalCtaSection from "./ListRentalCtaSection/ListRentalCtaSection";

const Rent = () => {
  return (
    <div className="bg-white">
      <Hero />
      <NewestListingsSection />
      <ApartmentsCtaSection areaTitle="Austin, TX" />
      <RentalsWithRentSpecialsSection />
      <PetFriendlyRentalsSection />
      <RentalsAcceptingOnlineApplicationsSection />
      <RentalsWithInUnitLaundrySection />
      <RentalsWithPoolsSection />
      <ListRentalCtaSection />
    </div>
  );
};

export default Rent;;
