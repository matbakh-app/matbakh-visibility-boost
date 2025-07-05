
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'goodMorning';
  } else if (hour >= 12 && hour < 18) {
    return 'goodAfternoon';
  } else {
    return 'goodEvening';
  }
}

export function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return '☀️';
  } else if (hour >= 12 && hour < 18) {
    return '🌤️';
  } else {
    return '🌙';
  }
}
