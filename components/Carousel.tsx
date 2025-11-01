"use client";
import React, { ReactNode } from "react";
import { motion, useAnimationControls, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export type CarouselProps = {
  className?: string;
  children: ReactNode
};

export default function Carousel({ className, children }: CarouselProps) {
  const carousel = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const cardWidthRef = useRef(0);
  
  // Convert children to array and duplicate for seamless infinite scroll
  const childrenArray = React.Children.toArray(children);
  const duplicatedChildren = Array(3).fill(childrenArray).flat();
  const singleSetLength = childrenArray.length;

  useEffect(() => {
    setIsMounted(true);
    if (carousel.current) {
      const firstCard = carousel.current.querySelector('.cursor-grab > *');
      if (firstCard) {
        const cardRect = firstCard.getBoundingClientRect();
        cardWidthRef.current = cardRect.width + 32; // width + gap (gap-8 = 32px)
      }
    }
  }, []);

  // Monitor x position and wrap it for infinite effect
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (cardWidthRef.current === 0) return;
      
      const oneSetWidth = cardWidthRef.current * singleSetLength;
      
      // Wrap the position to create infinite loop effect
      if (latest <= -oneSetWidth) {
        x.set(latest + oneSetWidth);
      } else if (latest > 0) {
        x.set(latest - oneSetWidth);
      }
    });

    return () => unsubscribe();
  }, [x, singleSetLength]);

  useEffect(() => {
    if (!isMounted || isDragging) return;

    const autoSlide = () => {
      const currentPosition = x.get();
      const nextX = currentPosition - 1; // Smooth continuous slide (1px at a time)
      controls.start({ x: nextX, transition: { duration: 0, ease: "linear" } });
    };

    const intervalId = setInterval(autoSlide, 16); // ~60fps for smooth animation

    return () => clearInterval(intervalId);
  }, [controls, isDragging, x, isMounted]);
  return (
    <div ref={carousel} className="relative flex overflow-hidden">
      {/* progressive blue for styling purposes */}
      <div className="w-[200px] z-20 h-full hidden lg:block absolute top-0 left-0 bg-white/100  [mask-image:linear-gradient(90deg,_rgba(0,0,0,1)_10%,_rgba(255,255,255,0)_60%)]  backdrop-blur-[10px]"></div>

      <motion.div
        drag="x"
        dragConstraints={false}
        dragElastic={0}
        animate={controls}
        style={{ x }}
        onDragStart={() => {
          setIsDragging(true);
          controls.stop();
        }}
        onDragEnd={() => {
          setIsDragging(false);
        }}
        className="cursor-grab pl-8 lg:pl-32 flex flex-row gap-5 p-3 "
      >
        {duplicatedChildren.map((child, index) => (
          <React.Fragment key={`carousel-item-${index}`}>
            {child}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
