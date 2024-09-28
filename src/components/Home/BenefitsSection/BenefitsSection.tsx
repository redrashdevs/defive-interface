import 'swiper/css';
import 'swiper/css/pagination'
import 'swiper/css/effect-cards';

import "./BenefitsSection.scss";

import { Trans } from "@lingui/macro";
import { useMedia } from "react-use";
import {Swiper, SwiperSlide} from "swiper/react";
import { EffectCards, Pagination } from 'swiper/modules';
import Spline from '@splinetool/react-spline';

export function BenefitsSection() {
  const isMobile = useMedia("(max-width: 600px)");

  const benefitsData = [
    { title: 'Easy', description: "Whether you're a beginner or seasoned pro, DeFive makes it easy." },
    { title: 'Secure', description: 'Your $crypto, your control.' },
    { title: 'Open', description: 'Get started by reading docs, or view the code on Github' },
    { title: 'Save on Costs', description: 'Trade with minimal spread and low impact.' },
    { title: 'Reduce Risks', description: 'Reliable price feeds trigger timely liquidations, protecting your positions.' },
    { title: 'Rewards', description: 'Instantly Earn $D5 after each action' }
  ];

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
          }}
        >
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__easy`}>
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
              <div className="Home-benefit-title">
                <Trans>
                  Secure
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Your $crypto, your control.
                </Trans>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={`Home-benefit Home-benefit__open`}>
              <div className="Home-benefit-title">
                <Trans>
                  Open
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Get started by reading docs, or view the code on Github
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
            <div className={`Home-benefit Home-benefit__easy`}>
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
              <div className="Home-benefit-title">
                <Trans>
                  Secure
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Your $crypto, your control.
                </Trans>
              </div>
            </div>
            <div className={`Home-benefit Home-benefit__open`}>
              <div className="Home-benefit-title">
                <Trans>
                  Open
                </Trans>
              </div>
              <div className="Home-benefit-description">
                <Trans>
                  Get started by reading docs, or view the code on Github
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