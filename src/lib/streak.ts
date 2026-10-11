export function calculateStreak(dates: string[], todayStr: string): number {
  if (dates.length === 0) return 0;
  
  // Create unique, sorted (descending) array of date strings
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  
  let streak = 0;
  
  // Date parsing helper to handle just the date part properly
  const parseDate = (d: string) => {
    const [year, month, day] = d.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const today = parseDate(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // The streak can start on either today or yesterday
  let expectedNext = today;
  let hasStarted = false;

  for (const dateStr of uniqueDates) {
    const d = parseDate(dateStr);
    
    if (!hasStarted) {
      if (d.getTime() === today.getTime() || d.getTime() === yesterday.getTime()) {
        hasStarted = true;
        streak = 1;
        expectedNext = new Date(d);
        expectedNext.setDate(expectedNext.getDate() - 1);
      } else {
        // First date is before yesterday, so streak is 0
        return 0;
      }
    } else {
      if (d.getTime() === expectedNext.getTime()) {
        streak++;
        expectedNext.setDate(expectedNext.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return streak;
}
