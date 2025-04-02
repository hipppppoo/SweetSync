import React from 'react';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}

const RatingInput: React.FC<RatingInputProps> = ({ value, onChange, label, min = 1, max = 10 }) => {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <label className="block text-gray-700 mb-2">{label} ({min}-{max})</label>
      <div className="flex space-x-1">
        {numbers.map((number) => (
          <button
            key={number}
            type="button" // Prevent form submission
            onClick={() => onChange(number)}
            className={`
              flex items-center justify-center 
              w-8 h-8 rounded-full 
              text-sm font-medium 
              transition-colors duration-150 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              ${value === number 
                ? 'bg-primary text-white scale-110 shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-primary-light hover:text-white'}
            `}
          >
            {number}
          </button>
        ))}
      </div>
      {/* Hidden input to satisfy form requirements if needed, though state handles the value */}
      <input type="hidden" value={value} required />
    </div>
  );
};

export default RatingInput; 