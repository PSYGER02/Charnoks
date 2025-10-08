import React from 'react';

interface WeatherWidgetProps {
  businessLocation?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ businessLocation = "Your Business" }) => {
  // This would connect to a weather API in real implementation
  const getCurrentWeather = () => {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Clear'];
    const temps = [22, 25, 28, 30, 24, 26, 23];
    const icons = ['☀️', '⛅', '☁️', '🌧️', '🌙'];
    
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    
    return { condition: randomCondition, temp: randomTemp, icon: randomIcon };
  };

  const weather = getCurrentWeather();
  const currentHour = new Date().getHours();
  const isBusinessHours = currentHour >= 8 && currentHour <= 20;

  const getBusinessTip = (condition: string, isOpen: boolean) => {
    if (!isOpen) return "Closed - Perfect time to prep for tomorrow! 🌙";
    
    switch (condition) {
      case 'Sunny':
        return "Great weather for foot traffic! ☀️";
      case 'Rainy':
        return "Rainy day - perfect for indoor customers! ☔";
      case 'Cloudy':
        return "Cozy weather - great for warm drinks! ☁️";
      default:
        return "Beautiful day for business! 🌟";
    }
  };

  return (
    <div className="modern-card p-6 bg-gradient-to-br from-sky-900/20 to-blue-900/20 border border-sky-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">🌤️ Business Weather</h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${isBusinessHours ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {isBusinessHours ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="text-4xl">{weather.icon}</div>
        <div>
          <div className="text-2xl font-bold text-text-primary">{weather.temp}°C</div>
          <div className="text-sm text-text-secondary">{weather.condition}</div>
          <div className="text-xs text-text-secondary">{businessLocation}</div>
        </div>
      </div>

      {/* Business Insight */}
      <div className="bg-sky-500/10 rounded-lg p-3 border border-sky-500/20">
        <div className="text-sm text-sky-300 font-medium mb-1">💡 Business Insight</div>
        <div className="text-xs text-text-secondary">
          {getBusinessTip(weather.condition, isBusinessHours)}
        </div>
      </div>

      {/* Quick Weather Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="bg-gray-800/20 rounded-lg p-2">
          <div className="text-xs text-text-secondary">Humidity</div>
          <div className="text-sm font-bold text-blue-400">65%</div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-2">
          <div className="text-xs text-text-secondary">Wind</div>
          <div className="text-sm font-bold text-green-400">12 km/h</div>
        </div>
        <div className="bg-gray-800/20 rounded-lg p-2">
          <div className="text-xs text-text-secondary">UV Index</div>
          <div className="text-sm font-bold text-yellow-400">Moderate</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;