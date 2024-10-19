import React from 'react';

const CanvasLoader = () => {
  return (
    <div className="canvas-loader-container"> {/* Use a class instead of inline styles */}
      <span className="canvas-loader" /> {/* Modern spinner with glowing animation */}
      <p className="animated-text">
      Extracting the best from the waste...  🌱💚
      </p>
    </div>
  );
};

export default CanvasLoader;
