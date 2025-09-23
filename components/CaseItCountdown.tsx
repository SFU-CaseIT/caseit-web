"use client";
import { useState, useEffect } from "react";

type CaseItCountdownProps = {
  year: number,
  targetDate: Date
};

export const CaseItCountdown = ( {year, targetDate}: CaseItCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const timeUnits = [
    { label: "Days", colon: ":", value: timeLeft.days },
    { label: "Hours", colon: ":", value: timeLeft.hours },
    { label: "Minutes", colon: ":", value: timeLeft.minutes },
    { label: "Seconds", colon: ":", value: timeLeft.seconds },
  ];

  return (
    <fieldset className="border-redDark border-4 rounded-xl lg:rounded-[30px] px-16 py-2 md:py-4 font-acid font-bold ">
      <legend className="uppercase text-redDark text-[1.5rem]">
        CaseIT {year}
      </legend>

      <div className="text-[2.5rem] text-redDark justify-center grid grid-cols-1 md:grid-cols-7 ">
        {timeUnits.map((unit, index) => (
          <>
            {/* Time unit (value and label) */}
            <div
              key={unit.label}
              className="flex flex-col col-span-1 items-center justify-center"
            >
              <div className="text-[2.5rem] md:text-[5rem] lg:text-[8rem] leading-[110%]">
                {unit.value}
              </div>
              <div className="text-[24px] font-normal">{unit.label}</div>
            </div>

            {/* Colon (only between units, not after the last one) */}
            {index < timeUnits.length - 1 && (
              <div className="text-[3rem] md:text-[5rem] lg:text-[8rem] leading-[50%] md:leading-[110%] pb-3 md:pb-0 rotate-90 md:rotate-0 col-span-1">
                :
              </div>
            )}
          </>
        ))}
      </div>
    </fieldset>
  );
};
