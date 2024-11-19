"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';

interface Marker {
  name: string;
  state: string;
  country: string;
  postcode: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
}

interface Label {
  text: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  name: string;
  state: string;
  country: string;
  postcode: string;
}

interface InteractiveGlobeProps {
  searchResults: any;
}

export default function InteractiveGlobe({ searchResults }: InteractiveGlobeProps) {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [globeReady, setGlobeReady] = useState(false);

  // Handle window resize
  const handleResize = useCallback(() => {
    const container = document.getElementById('globe-container');
    if (container) {
      setDimensions({
        width: container.clientWidth,
        height: Math.max(500, window.innerHeight * 0.6)
      });
    }
  }, []);

  // Initialize globe and fetch country data
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://unpkg.com/world-atlas/countries-110m.json');
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error('Failed to load country data:', error);
      }
    };

    fetchCountries();
    handleResize();
    window.addEventListener('resize', handleResize);

    // Add ambient light after globe initialization
    if (globeRef.current) {
      const ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
      globeRef.current.scene().add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      globeRef.current.scene().add(directionalLight);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, globeReady]);

  // Update markers and labels when search results change
  useEffect(() => {
    if (searchResults?.places?.[0]) {
      const place = searchResults.places[0];
      const lat = parseFloat(place.latitude);
      const lng = parseFloat(place.longitude);

      const newMarker: Marker = {
        name: place["place name"],
        state: place.state,
        country: searchResults.country,
        postcode: searchResults["post code"],
        lat,
        lng,
        size: 1.5,
        color: '#ff4444'
      };

      const newLabel: Label = {
        text: `${place["place name"]}, ${searchResults["post code"]}`,
        lat,
        lng,
        size: 1,
        color: '#ffffff',
        name: place["place name"],
        state: place.state,
        country: searchResults.country,
        postcode: searchResults["post code"]
      };

      setMarkers([newMarker]);
      setLabels([newLabel]);

      if (globeRef.current) {
        globeRef.current.pointOfView({
          lat,
          lng,
          altitude: 2.5
        }, 1000);
      }
    }
  }, [searchResults]);

  return (
    <Card className="my-16 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div id="globe-container" className="relative w-full">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="rgb(200,230,255)"
          atmosphereAltitude={0.25}
          atmosphereGlow={0.1}
          pointsData={markers}
          pointAltitude={0.1}
          pointColor="color"
          pointRadius="size"
          pointsMerge={false}
          pointResolution={32}
          labelsData={labels}
          labelLat={d => d.lat}
          labelLng={d => d.lng}
          labelAltitude={0.15}
          labelRotation={0}
          labelSize={1.5}
          labelIncludeDot={true}
          labelDotRadius={0.5}
          labelColor={() => '#ffffff'}
          labelResolution={2}
          labelText="text"
          labelRenderer={d => {
            const el = document.createElement('div');
            el.className = 'label-container';
            el.innerHTML = `
              <div class="fixed bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-lg text-xs whitespace-nowrap z-50" style="transform: translate(-50%, -100%); margin-top: -10px;">
                <div class="font-semibold">${d.name}</div>
                <div class="text-muted-foreground">
                  ${d.postcode} • ${d.state}, ${d.country}<br/>
                  ${d.lat.toFixed(4)}°, ${d.lng.toFixed(4)}°
                </div>
              </div>
            `;
            el.style.color = 'white';
            el.style.userSelect = 'none';
            return el;
          }}
          polygonsData={countries.features}
          polygonCapColor={() => '#1a1a1a'}
          polygonSideColor={() => '#242424'}
          polygonStrokeColor={() => '#333'}
          polygonLabel={({ properties: d }) => `
            <div class="bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-lg">
              <div class="font-bold">${d?.name || 'Unknown'}</div>
              ${d?.formal_en ? `<div class="text-sm">${d.formal_en}</div>` : ''}
            </div>
          `}
          onGlobeReady={() => {
            setGlobeReady(true);
            if (globeRef.current) {
              const ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
              globeRef.current.scene().add(ambientLight);
              
              const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
              directionalLight.position.set(1, 1, 1);
              globeRef.current.scene().add(directionalLight);

              // Set initial camera position
              globeRef.current.pointOfView({
                lat: 20,
                lng: 0,
                altitude: 2.5
              });
            }
          }}
          rendererConfig={{
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true
          }}
        />
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-sm text-muted-foreground">
          <p>Drag to rotate • Scroll to zoom • Hover elements for details</p>
        </div>
      </div>
    </Card>
  );
}