import 'swiper/css';
import 'swiper/css/pagination'
import 'swiper/css/effect-cards';

import "./BenefitsSection.scss";

import { Trans } from "@lingui/macro";
import { useMedia } from "react-use";
import {Swiper, SwiperSlide} from "swiper/react";
import { EffectCards, Pagination } from 'swiper/modules';
import Spline from '@splinetool/react-spline';
import { TbLock, TbMenu2, TbBook2, TbBrandGithub, TbArrowsExchange2, TbTrendingUp, TbTrendingDown, TbBuildingBridge } from 'react-icons/tb';
import { useState } from 'react';

import OpenCode from '@/img/home-benefit_open.svg';

export function BenefitsSection() {
  const isMobile = useMedia("(max-width: 600px)");
  const [isSecureSwitchLocked, setIsSecureSwitchLocked] = useState(false);
  const [mousePosition, setMousePosition] = useState({ 
    easy_x: 0, 
    easy_y: 0,
    open_x: 0,
    open_y: 0,
   });

   const handleMouseMove = (e, name: 'easy' | 'open') => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition(prev => ({
      ...prev,  // Keep other coordinates intact
      [`${name}_x`]: e.clientX - rect.left,
      [`${name}_y`]: e.clientY - rect.top,
    }));
  };

  const onSecureSwitchClick = () => {
    setIsSecureSwitchLocked((prev) => !prev);
  }

  return (
    <div className="Home-benefits-section">
      {isMobile ? (
        <Swiper
          effect={'cards'}
          grabCursor={true}
          modules={[EffectCards, Pagination]}
          pagination={{ clickable: true }}
          className="Home-benefits-swiper"
          // spaceBetween={100}
          style={{
            "--swiper-pagination-color": "#D9D9D9",
            "--swiper-pagination-left": "auto",
            "--swiper-pagination-right": "8px",
            "--swiper-pagination-bottom": "-2.5rem",
            "--swiper-pagination-fraction-color": "inherit",
            "--swiper-pagination-progressbar-bg-color": "rgba(0,0,0,0.25)",
            "--swiper-pagination-progressbar-size": "4px",
            "--swiper-pagination-bullet-size": "8px",
            "--swiper-pagination-bullet-width": "8px",
            "--swiper-pagination-bullet-height": "4px",
            "--swiper-pagination-bullet-border-radius": "16px",
            "--swiper-pagination-bullet-inactive-color": "#1F1F1F",
            "--swiper-pagination-bullet-inactive-opacity": "1",
            "--swiper-pagination-bullet-opacity": "1",
            "--swiper-pagination-bullet-horizontal-gap": "2px",
            "--swiper-pagination-bullet-vertical-gap": "6px",
          } as React.CSSProperties}
        >
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__easy`} 
              style={{
                '--maskX': `${mousePosition.easy_x}px`,
                '--maskY': `${mousePosition.easy_y}px`
              } as React.CSSProperties}
            >
              <div className='Home-benefit__easy__mask1' />
              <div className='Home-benefit__easy__mask2' />
              <div className='Home-benefit__easy__buttons__container'>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbArrowsExchange2 size={24} />
                </div>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbTrendingUp size={24} />
                </div>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbTrendingDown size={24} />
                </div>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbBuildingBridge size={24} />
                </div>
              </div>
              <div className="Home-benefit-title">
                <Trans>
                  Easy
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Whether you're a beginner or seasoned pro, DeFive makes it easy.
                </Trans>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__secure`}>
              <div className={`secure-switch ${isSecureSwitchLocked ? 'locked' : ''}`} onClick={onSecureSwitchClick}>
                <div className='secure-switch__container'>
                  <div className='secure-switch__handle'>
                    <TbMenu2 size={16} color='#000' className='mix-blend-overlay' />
                  </div>
                  <div className='secure-switch__lock'>
                    <TbLock size={16} color='#fff' />
                  </div>
                </div>
              </div>
              <div className="Home-benefit-title">
                {isSecureSwitchLocked ? '******' : (
                  <Trans>
                    Secure
                  </Trans>
                )}
              </div>
              <div className="Home-benefit-description">
                {isSecureSwitchLocked ? (<>**** ********<br/>**** ********</>) : (
                  <Trans>
                    Your $crypto,<br/>your control.
                  </Trans>
                )}
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__open`}>
              <div
                className="flashlight-container"
                onMouseMove={(e) => handleMouseMove(e, 'open')}
              >
                <img 
                  src={OpenCode}
                  alt="Hidden" 
                  className="hidden-code" 
                  style={{
                    '--maskX': `${mousePosition.open_x}px`,
                    '--maskY': `${mousePosition.open_y}px`
                  } as React.CSSProperties}
                />
              </div>
              <div className="Home-benefit-title">
                <Trans>
                  Open
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Get started by <span className='Home-benefit-description__docs'><TbBook2 size={16} /> reading docs</span>, or view the code on <span className='Home-benefit-description__github'><TbBrandGithub size={16} /> Github</span>
                </Trans>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__save-on-costs`}>
              <div className="Home-benefit-title">
                <Trans>
                  Save on Costs
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Trade with minimal spread and low impact.
                </Trans>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__reduce-risks`}>
              <div className="Home-benefit-title">
                <Trans>
                  Reduce Risks
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Reliable price feeds trigger timely liquidations, protecting your positions.
                </Trans>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__rewards`}>
              <Spline scene={'/spline/rewards.splinecode'}/>
              <div className="Home-benefit-title">
                <Trans>
                  Rewards
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Instantly Earn $D5 after each action
                </Trans>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      ) : (
        <div>
          <div className="Home-benefits row1 default-container">
            <div className={`Home-benefit Home-benefit__easy`} 
              onMouseMove={(e) => handleMouseMove(e, 'easy')}
              style={{
                '--maskX': `${mousePosition.easy_x}px`,
                '--maskY': `${mousePosition.easy_y}px`
              } as React.CSSProperties}
            >
              <div className='Home-benefit__easy__mask1' />
              <div className='Home-benefit__easy__mask2' />
              <div className='Home-benefit__easy__buttons__container'>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbArrowsExchange2 size={24} />
                </div>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbTrendingUp size={24} />
                </div>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbTrendingDown size={24} />
                </div>
                <div className='Home-benefit__easy__buttons__button'>
                  <TbBuildingBridge size={24} />
                </div>
              </div>
              <div className="Home-benefit-title">
                <Trans>
                  Easy
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Whether you're a beginner or seasoned pro, DeFive makes it easy.
                </Trans>
              </div>
            </div>
            <div className={`Home-benefit Home-benefit__secure`}>
              <div className={`secure-switch flex items-center justify-center ${isSecureSwitchLocked ? 'locked' : ''}`} onClick={onSecureSwitchClick}>
                <div className='secure-switch__container'>
                  <div className='secure-switch__handle'>
                    <TbMenu2 size={16} color='#000' className='mix-blend-overlay' />
                  </div>
                  <div className='secure-switch__lock'>
                    <TbLock size={16} color='#fff' />
                  </div>
                </div>
              </div>
              <div className="Home-benefit-title">
                {isSecureSwitchLocked ? '******' : (
                  <Trans>
                    Secure
                  </Trans>
                )}
              </div>
              <div className="Home-benefit-description">
                {isSecureSwitchLocked ? (<>**** ********<br/>**** ********</>) : (
                  <Trans>
                    Your $crypto,<br/>your control.
                  </Trans>
                )}
              </div>
            </div>
            <div className={`Home-benefit Home-benefit__open`}>
              <div
                className="flashlight-container"
                onMouseMove={(e) => handleMouseMove(e, 'open')}
              >
                <img 
                  src={OpenCode}
                  alt="Hidden" 
                  className="hidden-code" 
                  style={{
                    '--maskX': `${mousePosition.open_x}px`,
                    '--maskY': `${mousePosition.open_y}px`
                  } as React.CSSProperties}
                />
              </div>

              <div className="Home-benefit-title">
                <Trans>
                  Open
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Get started by <span className='Home-benefit-description__docs'><TbBook2 size={16} /> reading docs</span>, or view the code on <span className='Home-benefit-description__github'><TbBrandGithub size={16} /> Github</span>
                </Trans>
              </div>
            </div>
          </div>
          <div className="Home-benefits row2 default-container">
            <div className={`Home-benefit Home-benefit__save-on-costs`}>
              <div className="Home-benefit-title">
                <Trans>
                  Save on Costs
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Trade with minimal spread and low impact.
                </Trans>
              </div>
            </div>
            <div className={`Home-benefit Home-benefit__reduce-risks`}>
              <div className="Home-benefit-title">
                <Trans>
                  Reduce Risks
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Reliable price feeds trigger timely liquidations, protecting your positions.
                </Trans>
              </div>
            </div>
            <div className={`Home-benefit Home-benefit__rewards`}>
              <Spline className="Home-benefit-spline" scene={'/spline/rewards.splinecode'}/>
              <div className="Home-benefit-title">
                <Trans>
                  Rewards
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Instantly Earn $D5 after each action
                </Trans>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}