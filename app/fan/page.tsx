"use client";

import React from "react";
import FanCard from "@/components/FanCard";

export default function FanPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Controle do Ventilador</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <FanCard 
          title="Ventilador 1" 
          onToggle={(isOn) => {
            console.log(`Ventilador 1 está ${isOn ? 'ligado' : 'desligado'}`);
            // Aqui você pode adicionar a lógica para controlar o ventilador real
          }}
        />
        
        <FanCard 
          title="Ventilador 2"
          defaultChecked={true}
          onToggle={(isOn) => {
            console.log(`Ventilador 2 está ${isOn ? 'ligado' : 'desligado'}`);
          }}
        />
        
        <FanCard 
          title="Ventilador 3"
          onToggle={(isOn) => {
            console.log(`Ventilador 3 está ${isOn ? 'ligado' : 'desligado'}`);
          }}
        />
      </div>
    </div>
  );
} 