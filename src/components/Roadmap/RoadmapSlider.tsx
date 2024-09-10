import React, { useState, useRef } from 'react';
import './RoadmapSlider.scss'; // CSS file for styles

const RoadmapSlider = () => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'];

  // TODO: add slider functionality

  return (
    <div
      className="Roadmap-slider-container"
    >
      <div className="Roadmap-slider-track">
      <button className="Roadmap-slider-btn">Show All</button>
        {quarters.map((quarter, index) => (
          <div
            key={index}
            className={`Roadmap-slider-item`}
          >
            {quarter}
          </div>
        ))}
        <div className="Roadmap-slider-ruler">
        {quarters.map((quarter, index) => (
          <React.Fragment key={index}>
            <div className="Roadmap-slider-ruler-item main" />
            <div className="Roadmap-slider-ruler-item" />
            <div className="Roadmap-slider-ruler-item" />
          </React.Fragment>
        ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapSlider;