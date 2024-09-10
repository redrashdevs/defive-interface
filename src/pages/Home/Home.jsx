import React from "react";
import Footer from "components/Footer/Footer";
import "./Home.css";

import simpleSwapIcon from "img/ic_simpleswaps.svg";
import costIcon from "img/ic_cost.svg";
import totaluserIcon from "img/ic_totaluser.svg";

import statsIcon from "img/ic_stats.svg";
import tradingIcon from "img/ic_trading.svg";

import useSWR from "swr";

import { getTotalVolumeSum } from "lib/legacy";
import { USD_DECIMALS } from "config/factors";

import { useUserStat } from "domain/legacy";

import arbitrumIcon from "img/ic_arbitrum_96.svg";
import avaxIcon from "img/ic_avalanche_96.svg";

import TokenCard from "components/TokenCard/TokenCard";
import { Trans } from "@lingui/macro";
import { HeaderLink } from "components/Header/HeaderLink";
import { ARBITRUM, AVALANCHE } from "config/chains";
import { getServerUrl } from "config/backend";
import { bigNumberify, formatAmount, numberWithCommas } from "lib/numbers";
import useV2Stats from "domain/synthetics/stats/useV2Stats";
import { SyntheticsStateContextProvider } from "context/SyntheticsStateContext/SyntheticsStateContextProvider";
import Roadmap from "@/components/Roadmap/Roadmap";

export default function Home({ showRedirectModal }) {
  const arbV2Stats = useV2Stats(ARBITRUM);
  const avaxV2Stats = useV2Stats(AVALANCHE);

  // ARBITRUM

  const arbitrumPositionStatsUrl = getServerUrl(ARBITRUM, "/position_stats");
  const { data: arbitrumPositionStats } = useSWR([arbitrumPositionStatsUrl], {
    fetcher: (args) => fetch(...args).then((res) => res.json()),
  });

  const arbitrumTotalVolumeUrl = getServerUrl(ARBITRUM, "/total_volume");
  const { data: arbitrumTotalVolume } = useSWR([arbitrumTotalVolumeUrl], {
    fetcher: (args) => fetch(...args).then((res) => res.json()),
  });

  // AVALANCHE

  const avalanchePositionStatsUrl = getServerUrl(AVALANCHE, "/position_stats");
  const { data: avalanchePositionStats } = useSWR([avalanchePositionStatsUrl], {
    fetcher: (args) => fetch(...args).then((res) => res.json()),
  });

  const avalancheTotalVolumeUrl = getServerUrl(AVALANCHE, "/total_volume");
  const { data: avalancheTotalVolume } = useSWR([avalancheTotalVolumeUrl], {
    fetcher: (args) => fetch(...args).then((res) => res.json()),
  });

  // Total Volume

  const arbitrumTotalVolumeSum = getTotalVolumeSum(arbitrumTotalVolume);
  const avalancheTotalVolumeSum = getTotalVolumeSum(avalancheTotalVolume);

  let totalVolumeSum = 0n;
  if (arbitrumTotalVolumeSum !== undefined && avalancheTotalVolumeSum !== undefined && arbV2Stats && avaxV2Stats) {
    totalVolumeSum = totalVolumeSum + arbitrumTotalVolumeSum;
    totalVolumeSum = totalVolumeSum + avalancheTotalVolumeSum;
    totalVolumeSum = totalVolumeSum + BigInt(arbV2Stats.totalVolume);
    totalVolumeSum = totalVolumeSum + BigInt(avaxV2Stats.totalVolume);
  }

  // Open Interest

  let openInterest = 0n;
  if (
    arbitrumPositionStats &&
    arbitrumPositionStats.totalLongPositionSizes &&
    arbitrumPositionStats.totalShortPositionSizes
  ) {
    openInterest = openInterest + BigInt(arbitrumPositionStats.totalLongPositionSizes);
    openInterest = openInterest + BigInt(arbitrumPositionStats.totalShortPositionSizes);
  }

  if (
    avalanchePositionStats &&
    avalanchePositionStats.totalLongPositionSizes &&
    avalanchePositionStats.totalShortPositionSizes
  ) {
    openInterest = openInterest + BigInt(avalanchePositionStats.totalLongPositionSizes);
    openInterest = openInterest + BigInt(avalanchePositionStats.totalShortPositionSizes);
  }

  if (arbV2Stats && avaxV2Stats) {
    openInterest = openInterest + arbV2Stats.openInterest;
    openInterest = openInterest + avaxV2Stats.openInterest;
  }

  // user stat
  const arbitrumUserStats = useUserStat(ARBITRUM);
  const avalancheUserStats = useUserStat(AVALANCHE);
  let totalUsers = 0;

  if (arbitrumUserStats && arbitrumUserStats.uniqueCount) {
    totalUsers += arbitrumUserStats.uniqueCount;
  }

  if (avalancheUserStats && avalancheUserStats.uniqueCount) {
    totalUsers += avalancheUserStats.uniqueCount;
  }

  if (arbV2Stats && avaxV2Stats) {
    totalUsers = Number(bigNumberify(totalUsers) + arbV2Stats.totalUsers + avaxV2Stats.totalUsers);
  }

  const LaunchExchangeButton = () => {
    return (
      <HeaderLink className="default-btn" to="/trade" showRedirectModal={showRedirectModal}>
        <Trans>Launch App</Trans>
      </HeaderLink>
    );
  };

  return (
    <div className="Home">
      <div className="Home-top">
        <div className="Home-title-section-container default-container">
          <div className="Home-title-section">
            <div className="Home-title">
              <Trans>
                Your Favorite
                <br />
                Decentralized Perpetual Exchange
              </Trans>
            </div>
            <div className="Home-description">
              <Trans>
                Trade BTC, ETH, FTM and other top cryptos with up to 100x leverage directly from your wallet
              </Trans>
            </div>
            {/* <LaunchExchangeButton /> */}
            {/* an email input to stay updated! */}
            <div className="Home-email-input-container">
              <div className="Home-email-input">
                <input type="email" placeholder="Email" />
                <button>
                  Stay Updated
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="Home-benefits-section">
      <div className="Home-benefits row1 default-container">
          <div className="Home-benefit Home-benefit__easy">
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
          <div className="Home-benefit Home-benefit__secure">
            <div className="Home-benefit-title">
              <Trans>Secure</Trans>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Your $crypto,<br/> your control.
              </Trans>
            </div>
          </div>
          <div className="Home-benefit Home-benefit__open">
            <div className="Home-benefit-title">
              <Trans>Open</Trans>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Get started by reading docs, or view the code on Github
              </Trans>
            </div>
          </div>
        </div>
        <div className="Home-benefits row2 default-container">
          <div className="Home-benefit Home-benefit__save-cost">
            <div className="Home-benefit-title">
              <Trans>Save on Costs</Trans>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Trade with minimal spread and low impact.
              </Trans>
            </div>
          </div>
          <div className="Home-benefit Home-benefit__reduce-risks">
            <div className="Home-benefit-title">
              <Trans>Reduce Risks</Trans>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Reliable price feeds trigger timely liquidations, protecting your positions.
              </Trans>
            </div>
          </div>
          <div className="Home-benefit Home-benefit__rewards">
            <div className="Home-benefit-title">
              <Trans>Rewards</Trans>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Instantly Earn $D5 after each action
              </Trans>
            </div>
          </div>
        </div>
      </div>
      <div className="Home-tokenomics-section">
        <div className="Home-tokenomics-container default-container">
          <h2 className="Home-tokenomics-title">
            <Trans>
              D5 Tokenomics
            </Trans>
          </h2>
          <p className="Home-tokenomics-description">
            <Trans>
              D5 (DeFive) is the core token of our decentralized exchange. It lets you trade, earn, and have a say in the future of our platform.
            </Trans>
          </p>
          <a href="https://gmxio.gitbook.io/gmx/" className="default-btn Home-tokenomics-documentation">
            <Trans>
              Read More in Docs
            </Trans>
          </a>
          <div className="Home-tokenomics-card-container">
            <div className="Home-tokenomics-card">
              <div className="Home-tokenomics-card__title">
                <Trans>
                  Earn Reward
                </Trans>
              </div>
              <div className="Home-tokenomics-card__description">
                <Trans>
                  Stake your D5 tokens to earn more tokens and a share of trading fees.
                </Trans>
              </div>
            </div>
            <div className="Home-tokenomics-card">
              <div className="Home-tokenomics-card__title">
                <Trans>
                  Governance
                </Trans>
              </div>
              <div className="Home-tokenomics-card__description">
                <Trans>
                  Hold D5 tokens to vote on important decisions and shape the future of DeFive.
                </Trans>
              </div>
            </div>
            <div className="Home-tokenomics-card">
              <div className="Home-tokenomics-card__title">
                <Trans>
                  Provide Liquidity
                </Trans>
              </div>
              <div className="Home-tokenomics-card__description">
                <Trans>
                  Support our platform by providing liquidity and earn rewards.
                </Trans>
              </div>
            </div>
          </div>

          <div className="Home-tokenomics-distribution">
            <div className="Home-tokenomics-distribution__title">
              <Trans>
                Distribution
              </Trans>
            </div>
            <div className="Home-tokenomics-distribution-rows">
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Yield Rewards
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  30%
                </div>
              </div>
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Public Sale
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  20%
                </div>
              </div>
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Vault
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  10%
                </div>
              </div>
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Team
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  10%
                </div>
              </div>
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Exchange Liquidity
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  10%
                </div>
              </div>
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Development
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  10%
                </div>
              </div>
              <div className="Home-tokenomics-distribution-row">
                <div className="Home-tokenomics-distribution-row__title">
                  <Trans>
                    Pre-Sale & ISPO
                  </Trans>
                </div>
                <div className="Home-tokenomics-distribution-row__percentage">
                  10%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Roadmap />

      {/* <div className="Home-video-section">
        <div className="Home-video-container default-container">
          <div className="Home-video-block">
            <img src={gmxBigIcon} alt="gmxbig" />
          </div>
        </div>
      </div> */}
      {/* <div className="Home-faqs-section">
        <div className="Home-faqs-container default-container">
          <div className="Home-faqs-introduction">
            <div className="Home-faqs-introduction__title">FAQs</div>
            <div className="Home-faqs-introduction__description">Most asked questions. If you wish to learn more, please head to our Documentation page.</div>
            <a href="https://gmxio.gitbook.io/gmx/" className="default-btn Home-faqs-documentation">Documentation</a>
          </div>
          <div className="Home-faqs-content-block">
            {
              faqContent.map((content, index) => (
                <div className="Home-faqs-content" key={index} onClick={() => toggleFAQContent(index)}>
                  <div className="Home-faqs-content-header">
                    <div className="Home-faqs-content-header__icon">
                      {
                        openedFAQIndex === index ? <FiMinus className="opened" /> : <FiPlus className="closed" />
                      }
                    </div>
                    <div className="Home-faqs-content-header__text">
                      { content.question }
                    </div>
                  </div>
                  <div className={ openedFAQIndex === index ? "Home-faqs-content-main opened" : "Home-faqs-content-main" }>
                    <div className="Home-faqs-content-main__text">
                      <div dangerouslySetInnerHTML={{__html: content.answer}} >
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div> */}
      <Footer showRedirectModal={showRedirectModal} />
    </div>
  );
}
