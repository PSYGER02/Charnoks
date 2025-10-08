# 🗺️ Google Maps Integration Setup Guide

## 📝 **Step-by-Step Implementation**

### **1. Install Required Dependencies**
```bash
npm install @react-google-maps/api
npm install @types/google.maps  # If using TypeScript
```

### **2. Get Google Maps API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Geocoding API** (optional, for address search)
   - **Places API** (optional, for location search)
4. Create credentials → API Key
5. Restrict the API key to your domain for security

### **3. Add API Key to Environment**
```env
# .env.local
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### **4. Database Schema Addition**
```sql
-- Add to your Supabase database
CREATE TABLE worker_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  is_hq BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_worker_locations_worker_id ON worker_locations(worker_id);
```

### **5. Add Component to Owner Dashboard**
```tsx
// pages/owner/OwnerHomePage.tsx
import GoogleMapsWorkerTracker from '../../components/maps/GoogleMapsWorkerTracker';

// Add to your dashboard
<div className="trading-grid gap-6">
  <div className="trading-full-width">
    <GoogleMapsWorkerTracker 
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
    />
  </div>
</div>
```

### **6. API Service for Worker Locations**
```tsx
// services/locationService.ts
export const getWorkerLocations = async () => {
  const { data, error } = await supabase
    .from('worker_locations')
    .select(`
      *,
      workers:worker_id(name, email, status)
    `);
    
  if (error) throw error;
  return data;
};

export const updateWorkerLocation = async (workerId: string, location: {
  latitude: number;
  longitude: number;
  address: string;
}) => {
  const { data, error } = await supabase
    .from('worker_locations')
    .upsert({
      worker_id: workerId,
      ...location,
      updated_at: new Date().toISOString()
    });
    
  if (error) throw error;
  return data;
};
```

---

## 💰 **Cost Management**

### **Free Tier Limits (Per Month):**
- ✅ **10,000 map loads** (Dynamic Maps)
- ✅ **100,000 map tiles** (Map Tiles API)
- ✅ **28,000 geocoding requests**

### **Usage Optimization:**
```tsx
// Reduce API calls with caching
const useWorkerLocations = () => {
  const [locations, setLocations] = useState([]);
  const [lastFetch, setLastFetch] = useState(0);
  
  const fetchLocations = useCallback(async () => {
    const now = Date.now();
    // Only fetch if data is older than 5 minutes
    if (now - lastFetch < 5 * 60 * 1000) return;
    
    const data = await getWorkerLocations();
    setLocations(data);
    setLastFetch(now);
  }, [lastFetch]);
  
  return { locations, fetchLocations };
};
```

---

## 🎨 **Customization Options**

### **1. Custom Marker Icons**
```tsx
// Create custom SVG markers
const createCustomMarker = (color: string, isHQ: boolean) => ({
  path: isHQ 
    ? "M12 2L2 7V10C2 16 7 21 12 21S22 16 22 10V7L12 2Z" // HQ shape
    : "M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2Z", // Pin shape
  fillColor: color,
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 2,
  scale: isHQ ? 1.5 : 1
});
```

### **2. Real-time Updates**
```tsx
// WebSocket connection for live updates
useEffect(() => {
  const channel = supabase
    .channel('worker-locations')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'worker_locations' },
      (payload) => {
        // Update locations in real-time
        updateLocationInState(payload.new);
      }
    )
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

### **3. Mobile Optimization**
```tsx
// Responsive design for mobile
const mapContainerStyle = {
  width: '100%',
  height: window.innerWidth < 768 ? '300px' : '500px'
};

// Touch-friendly markers on mobile
const markerOptions = {
  optimized: false, // Better for touch interactions
  clickable: true,
  draggable: false
};
```

---

## 📱 **Mobile Features**

### **1. Geolocation Integration**
```tsx
// Get current location for worker check-in
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateWorkerLocation(workerId, { latitude, longitude });
      },
      (error) => console.error('Location error:', error)
    );
  }
};
```

### **2. Progressive Web App Support**
```tsx
// Service worker for offline functionality
// Cache map tiles for offline use
const cacheMapTiles = async () => {
  const cache = await caches.open('map-tiles-v1');
  // Cache frequently accessed map areas
};
```

---

## 🚀 **Advanced Features**

### **1. Territory Visualization**
```tsx
// Draw coverage areas around workers
const TerritoryCircle = ({ center, radius }: {
  center: { lat: number; lng: number };
  radius: number;
}) => (
  <Circle
    center={center}
    radius={radius}
    options={{
      fillColor: '#10B981',
      fillOpacity: 0.1,
      strokeColor: '#10B981',
      strokeOpacity: 0.5,
      strokeWeight: 2
    }}
  />
);
```

### **2. Route Planning**
```tsx
// Directions between HQ and workers
const showDirections = (from: Location, to: Location) => {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  
  directionsService.route({
    origin: { lat: from.latitude, lng: from.longitude },
    destination: { lat: to.latitude, lng: to.longitude },
    travelMode: google.maps.TravelMode.DRIVING
  }, (result, status) => {
    if (status === 'OK') {
      directionsRenderer.setDirections(result);
    }
  });
};
```

### **3. Heat Map for Sales Density**
```tsx
// Show sales performance as heat map
import { HeatmapLayer } from '@react-google-maps/api';

const salesHeatmapData = workers.map(worker => ({
  location: new google.maps.LatLng(worker.latitude, worker.longitude),
  weight: worker.todaySales / 1000 // Normalize the data
}));

<HeatmapLayer data={salesHeatmapData} />
```

---

## 📊 **Analytics Integration**

### **Performance Metrics:**
- 📍 Worker distribution efficiency
- 🎯 Territory coverage analysis  
- 📈 Location-based sales correlation
- 🚗 Travel time optimization
- 📱 Mobile usage patterns

### **Business Insights:**
- Which locations perform best?
- Are workers optimally distributed?
- Where should new locations be added?
- How does location affect performance?

---

## 🎯 **Implementation Priority**

### **Phase 1 (Week 1):** ⭐ Essential
- Basic map with worker markers
- Click to show worker data
- Real-time status updates

### **Phase 2 (Week 2):** ⭐⭐ Enhanced
- Custom marker designs
- Mobile optimization
- Performance data overlays

### **Phase 3 (Week 3):** ⭐⭐⭐ Advanced
- Territory visualization
- Route planning
- Sales heat maps

This Google Maps integration will transform your POS system into a powerful territorial management tool! 🗺️✨