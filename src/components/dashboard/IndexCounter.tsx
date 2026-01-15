import React from 'react';

interface IndexCounterProps {
  index: number;
  position?: "start" | "center" | "end";
}

const IndexCounter = ({ index, position = "center" }: IndexCounterProps) => {
  if (index === undefined && index !== 0) return null;

  return (
    <p
      className={`absolute ${
        position === "start"
          ? "top-1/2 -translate-y-1/2 left-0"
          : position === "end"
            ? "top-1/2 -translate-y-1/2 right-0"
            : "top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2"
      } font-extrabold text-3xl text-opacity-20 opacity-40 text-gray-900 pointer-events-none select-none`}
    >
      {index + 1}
    </p>
  );
};

export default IndexCounter;