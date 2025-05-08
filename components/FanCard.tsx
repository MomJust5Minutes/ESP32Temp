"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface FanCardProps {
  title?: string;
  onToggle?: (isOn: boolean) => void;
  defaultChecked?: boolean;
}

const FanCard: React.FC<FanCardProps> = ({
  title = "Ventilador",
  onToggle,
  defaultChecked = false,
}) => {
  const [isOn, setIsOn] = useState(defaultChecked);

  const handleToggle = (checked: boolean) => {
    setIsOn(checked);
    onToggle?.(checked);
  };

  return (
    <Card
      className={`flex flex-col items-center p-4 gap-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
        isOn ? "bg-blue-50" : ""
      }`}
      onClick={() => handleToggle(!isOn)}
    >
      <div className="relative w-16 h-16">
        <Image 
          src="/fan-circled-svgrepo-com.svg"
          alt="Ventilador"
          fill
          className={`transition-all duration-500 ${isOn ? "animate-spin" : ""}`}
          style={{ animationDuration: isOn ? "3s" : "0s" }}
        />
      </div>
      
      <h3 className="font-medium text-lg mt-2">{title}</h3>
      
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={isOn}
          onCheckedChange={handleToggle}
          aria-label="Ligar/Desligar ventilador"
        />
      </div>
    </Card>
  );
};

export default FanCard; 