import React, { useEffect, useState } from 'react';
import { getCheckIns } from '../utils/storage';

export const GithubHeatmap: React.FC = () => {
  const [checkIns, setCheckIns] = useState<string[]>([]);
  
  useEffect(() => {
    setCheckIns(getCheckIns());
    const handleUpdate = () => setCheckIns(getCheckIns());
    window.addEventListener('checkins-updated', handleUpdate);
    return () => window.removeEventListener('checkins-updated', handleUpdate);
  }, []);

  const today = new Date();
  const daysInCalendar = 120; // Around 4 months
  
  const startDate = new Date();
  startDate.setDate(today.getDate() - daysInCalendar);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const numWeeks = totalDays / 7;

  const days = [];
  const monthLabels: { month: string, index: number }[] = [];
  let lastMonth = -1;

  for (let i = 0; i < numWeeks; i++) {
     const week = [];
     for (let j = 0; j < 7; j++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (i * 7 + j));
        const dayStr = d.toISOString().split('T')[0];
        const isFuture = d > today;
        week.push({ date: d, dayStr, isFuture });

        if (j === 0 && d.getMonth() !== lastMonth) {
           monthLabels.push({ month: d.toLocaleString('default', { month: 'short' }), index: i });
           lastMonth = d.getMonth();
        }
     }
     days.push(week);
  }
  
  return (
    <div className="bg-white p-6 rounded-[32px] border border-[#E0E0D5] shadow-sm">
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex flex-col min-w-max">
              {/* Months Row */}
              <div className="flex relative h-5 mb-1 text-xs text-[#6A6A5A]">
                 <div className="w-8 shrink-0"></div>
                 {monthLabels.map((m, i) => (
                    <div key={i} className="absolute" style={{ left: `calc(2rem + ${m.index}rem)` }}>
                       {m.month}
                    </div>
                 ))}
              </div>
              
              <div className="flex">
                  {/* Days Labels Col */}
                  <div className="flex flex-col justify-between w-8 shrink-0 text-[10px] text-[#6A6A5A] mt-[2px] mb-[2px]">
                      <div className="h-3 flex items-center"></div>
                      <div className="h-3 flex items-center">Mon</div>
                      <div className="h-3 flex items-center"></div>
                      <div className="h-3 flex items-center">Wed</div>
                      <div className="h-3 flex items-center"></div>
                      <div className="h-3 flex items-center">Fri</div>
                      <div className="h-3 flex items-center"></div>
                  </div>
                  
                  {/* Grid */}
                  <div className="flex gap-1 items-start">
                      {days.map((week, i) => (
                         <div key={i} className="grid grid-rows-7 gap-1">
                            {week.map((day, j) => {
                               const isActive = !day.isFuture && checkIns.includes(day.dayStr);
                               return (
                                 <div 
                                   key={j} 
                                   className={`w-3 h-3 rounded-[2px] transition-colors ${day.isFuture ? 'bg-transparent' : isActive ? 'bg-[#40c463]' : 'bg-[#ebedf0]'}`} 
                                   title={`${day.dayStr}: ${isActive ? 'Checked In' : 'No activity'}`}
                                 />
                               );
                            })}
                         </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
      
      <div className="flex items-center justify-between mt-4">
          <div className="text-[11px] text-[#8a8a7a]">
              Learn how we count contributions
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6A6A5A]">
            <span className="mr-1">Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-[#ebedf0]"></div>
            <div className="w-3 h-3 rounded-[2px] bg-[#9be9a8]"></div>
            <div className="w-3 h-3 rounded-[2px] bg-[#40c463]"></div>
            <div className="w-3 h-3 rounded-[2px] bg-[#30a14e]"></div>
            <div className="w-3 h-3 rounded-[2px] bg-[#216e39]"></div>
            <span className="ml-1">More</span>
          </div>
      </div>
    </div>
  );
};
