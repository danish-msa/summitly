import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import BannerSearch from "./BannerSearch";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const [activeTab, setActiveTab] = useState("Buy");
  const titles = useMemo(
    () => ["amazing", "new", "wonderful", "beautiful", "smart"],
    []
  );

  const tabs = ["Buy", "Rent", "Sell", "Pre-approval", "Just sold", "Home value"];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="bg-transparent my-5">
      <div className="w-[97%] m-auto min-h-[500px] rounded-2xl relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/backgroundGradient.jpg')" }}>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/60" />
        
        <div className="container mx-auto relative z-10">
          <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
            {/* Animated Title */}
            <div className="flex gap-4 flex-col">
              <h1 className="text-4xl md:text-6xl lg:text-6xl tracking-tight text-center font-heading capitalize font-bold">
                <span className="text-foreground">Let AI guide you to your</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-subhead font-semibold text-6xl text-primary"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
                <span className="text-foreground">home today</span>
              </h1>

              <p className="text-base md:text-xl leading-relaxed tracking-tight text-foreground/70 max-w-3xl text-center">
                Discover your dream property with our comprehensive search. Browse thousands of listings, 
                get pre-approved, and find the perfect place to call home.
              </p>
            </div>

            

            <BannerSearch />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;