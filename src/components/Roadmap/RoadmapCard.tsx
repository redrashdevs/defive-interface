import './RoadmapCard.scss';

import checkedIcon from "img/ic_checked.svg";

export type RoadmapCardProps = {
  title: string;
  description: string;
  Icon: React.ReactElement;
  isCompleted: boolean;
  iconBgColor: string;
  isCurrent?: boolean;
};

export default function RoadmapCard({ 
  title,
  description,
  Icon,
  isCompleted,
  iconBgColor,
  isCurrent
 }: RoadmapCardProps) {
  return (
    <div className={`Roadmap-card ${isCompleted ? 'completed' : ''}`}>
      <div className='Roadmap-card-top'>
        <div className="Roadmap-card-icon" style={{backgroundColor: iconBgColor}}>
          {Icon}
          {isCompleted && <div className="Roadmap-card-icon-checked">
            <img src={checkedIcon} alt="Check icon" />
          </div>}
        </div>
        <div className={`Roadmap-card-line ${isCompleted ? 'completed' : ''}`}></div>
      </div>
      <h3 className="Roadmap-card-title">{title}</h3>
      <p className="Roadmap-card-description">{description}</p>
      {isCurrent && <div className="Roadmap-card-currentphase">
        current phase
      </div>}
    </div>
  );
}