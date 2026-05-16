declare global {
  interface Window {
    naver: {
      maps: {
        Map: any;
        Marker: any;
        LatLng: any;
        LatLngBounds: any;
        Event: {
          addListener: (target: any, eventName: string, listener: Function) => any;
          removeListener: (listener: any) => void;
        };
        Polyline: any;
        Point: any; // Add Point
      };
    };
  }
}

export {};
