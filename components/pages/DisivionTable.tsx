import React from 'react';
import { twJoin } from 'tailwind-merge';

const labelVariant = {
  divisionDraw: "text-2xl sm:text-3xl md:text-4xl font-extrabold",
  divisionWinner: "text-lg md:text-xl font-semibold"
}

type LabelVariant = keyof typeof labelVariant;

type DivisionCardProps = {
    title: string,
    variant: LabelVariant,
    data: {
        label?: string, 
        teamName: string, 
    }[],
}

const DivisionTable = ({ title, variant, data }: DivisionCardProps) => {
  return (
    /* Changed max-w-md to max-w-2xl and added mx-auto to keep it clean on ultra-wide screens */
    <div className="w-full max-w-2xl mx-auto overflow-hidden bg-slate-50 border border-gray-200 rounded-3xl shadow-lg">
      
      {/* Header */}
      <div className="py-8 text-center border-b border-gray-200">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-red tracking-tight">{title}</h2>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {data.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-stretch ${index !== data.length - 1 ? 'border-b border-gray-200' : ''}`}
          >

            {item.label && 
              <div className="flex items-center justify-center w-32 sm:w-40 py-10 border-r border-gray-200 bg-white/50">
                <span className={twJoin(labelVariant[variant], "text-gray-800")}>{item.label}</span>
              </div>
            }
            
            {/* Content Column (Team Name) */}
            <div className="flex items-center justify-center flex-1 px-8 py-10 text-center">
              <span className="text-lg sm:text-lg md:text-xl font-semibold text-gray-900 leading-tight">
                {item.teamName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DivisionTable;