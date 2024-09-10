import "./Roadmap.scss";
import RoadmapCard, { RoadmapCardProps } from './RoadmapCard';
import { TbRocket, TbCertificate2, TbAlpha, TbTestPipe, TbShieldCode, TbBeta } from "react-icons/tb";
import RoadmapSlider from './RoadmapSlider';

const quartersData: RoadmapCardProps[] = [
  {
      title: 'Website Launch',
      description: 'Complete design and deployment of the DeFive website.',
      Icon: <TbRocket size={32} color='#80FFB2' strokeWidth={1.5}/>,
      isCompleted: true,
      iconBgColor: '#29CC6A'
  },
  {
      title: 'SmartContract Development',
      description: 'Initial development and internal testing of core smart contracts.',
      Icon: <TbCertificate2 size={32} color='#80FFB2' strokeWidth={1.5}/>,
      isCompleted: true,
      iconBgColor: '#29CC6A'
  },
  {
      title: 'Private Alpha',
      description: 'Limited release to early testers and partners for initial feedback.',
      Icon: <TbAlpha size={32} color='#80FFB2' strokeWidth={1.5}/>,
      isCompleted: true,
      iconBgColor: '#29CC6A'
  },
  {
      title: 'Testnet Deployment',
      description: 'Launch the DEX on a public testnet for broader testing.',
      Icon: <TbTestPipe size={32} color='#FFFB00' strokeWidth={1.5}/>,
      isCompleted: false,
      iconBgColor: '#CC4929',
      isCurrent: true
  },
  {
      title: 'Security Audits',
      description: 'Conduct comprehensive third-party audits of smart contracts to ensure security and reliability.',
      Icon: <TbShieldCode size={32} color='#000000' strokeWidth={1.5}/>,
      isCompleted: false,
      iconBgColor: '#73C0FA'
  },
  {
      title: 'Beta Launch',
      description: 'Release a public beta version of the DEX with basic trading features.',
      Icon: <TbBeta size={32} color='#FFFFFF' strokeWidth={1.5}/>,
      isCompleted: false,
      iconBgColor: '#343340'
  },
];

export default function Roadmap() {
  // const [selectedQuarter, setSelectedQuarter] = useState('Q1 2024');
  // const cardContainerRef = useRef(null);

  // const quarters = [
  //     'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024',
  //     'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'
  // ];

  // const quartersMarks = [
  //   'Q1', 'Q2', 'Q3', 'Q4',
  //   'Q1', 'Q2', 'Q3', 'Q4'
  // ]

  // const handleQuarterClick = (quarter) => {
  //     setSelectedQuarter(quarter);
  //     scrollToQuarter(quarter);
  // };

  // const scrollToQuarter = (quarter) => {
  //     const quarterIndex = quarters.indexOf(quarter);
  //     if (cardContainerRef.current) {
  //         cardContainerRef.current.scrollTo({
  //             left: quarterIndex * 184,
  //             behavior: 'smooth'
  //         });
  //     }
  // };

  // useEffect(() => {
  //     scrollToQuarter(selectedQuarter);
  // }, [selectedQuarter]);

  return (
      <div className="Roadmap-container default-container">
          <h2 className="Roadmap-title">Roadmap</h2>
          <div className="Roadmap-quarter-slider">
            <RoadmapSlider />
              {/* <Slider
                  min={0}
                  max={quarters.length - 1}
                  step={1}
                  value={quarters.indexOf(selectedQuarter)}
                  onChange={(value) => setSelectedQuarter(quarters[value])}
                  handle={props => 
                    <Handle {...props}>
                      <div className="default-btn" style={{left: -10}} />
                    </Handle>
                  }
                  style={{ maxWidth: '52.5rem' }}
                  handleStyle={{ transition: 'all 0.3s' }}
                  trackStyle={{ height: 32, transition: 'all 0.3s' }}
                  railStyle={{ backgroundColor: '#343340', height: 32 }}
                  dotStyle={{ display: 'none' }}
                  marks={quartersMarks}
              /> */}
          </div>
          <div className="Roadmap-cards-container">
            {quartersData.map((quarter, index) => (
              <RoadmapCard
                key={index}
                title={quarter.title}
                description={quarter.description}
                Icon={quarter.Icon}
                isCompleted={quarter.isCompleted}
                isCurrent={quarter.isCurrent}
                iconBgColor={quarter.iconBgColor}
              />
            ))}
          </div>
      </div>
  );
}
