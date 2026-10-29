import React from 'react';
import { GarmentType } from '../data/products';

interface MiniGarmentIconProps {
  type: GarmentType;
  primaryColor: string;
  secondaryColor?: string;
  ribColor?: string;
  photoUrl?: string;
  className?: string;
}

export const MiniGarmentIcon: React.FC<MiniGarmentIconProps> = ({
  photoUrl = '/assets/aistudio/image_7102778c.png',
  className = 'w-14 h-16',
}) => {
  return (
    <div
      className={`${className} relative rounded overflow-hidden flex items-center justify-center bg-stone-200/80 select-none pointer-events-none`}
      aria-hidden="true"
    >
      <img
        src={photoUrl}
        alt=""
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
};
