import React, { useEffect, useState } from 'react';
import './progressBar.css';

export interface VisualPart {
  percentage: number,
  color: string
}

interface Props {
  label?: string,
  backgroundColor?: string,
  // expected format for visual parts
  visualParts: VisualPart[]
}

const ProgressBar = ({
  visualParts = [{
    percentage: 0,
    color: 'white',
  }],
  backgroundColor = '#e5e5e5',
  label,
}: Props) => {
  // Starting values needed for the animation
  // Mapped by "visualParts" so it can work with multiple values dynamically
  // It's an array of percentage widths
  const [widths, setWidths] = useState(
    visualParts.map(() => '0%'),
  );

  useEffect(() => {
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    // You need to wrap it to trigger the animation
    requestAnimationFrame(() => {
      // Set a new array of percentage widths based on the props
      setWidths(
        visualParts.map((item) => `${item.percentage}%`),
      );
    });
  }, [visualParts]);

  return (
    <>
      <div
        className="progressVisualFull"
        // to change the background color dynamically
        style={{
          backgroundColor,
        }}
      >
        {visualParts.map((item: VisualPart, index: number) => (
          <div
              // There won't be additional changes in the array so the index can be used
              /* eslint-disable-next-line react/no-array-index-key */
            key={index}
            style={{
              width: widths[index],
              // setting the actual color of bar part
              backgroundColor: item.color,
            }}
            className="progressVisualPart"
          />
        ))}
      </div>
    </>
  );
};

export default ProgressBar;
