import { t, Trans } from "@lingui/macro";

import { getPageTitle } from "lib/legacy";

import SEO from "components/Common/SEO";
import Footer from "components/Footer/Footer";
import PageTitle from "components/PageTitle/PageTitle";
import { Externals } from "./constants";
import csx from "classnames";

import "./Buy.css";
import { useState } from "react";

export default function BuyGMXGLP() {
  const [activeChain, setActiveChain] = useState<"Arbitrum" | "Avalanche" | "Fantom">("Arbitrum");
  return (
    <SEO title={getPageTitle(t`Buy GLP or GMX`)}>
      <div className="BuyGMXGLP page-layout">
        <div className="container px-[16px] md:px-[100px]">
          <div className="BuyGMXGLP-container">
            <PageTitle showNetworkIcon={false} isTop title={t`Buy D5`} qa="buy-page" />
            <div className="buy-tabs-wrappper">
              <button
                onClick={() => setActiveChain("Arbitrum")}
                className={csx("tab-btn", { active: activeChain === "Arbitrum" })}
              >
                <Trans>On Arbitrum</Trans>
              </button>
              <button
                onClick={() => setActiveChain("Avalanche")}
                className={csx("tab-btn ml-2", { active: activeChain === "Avalanche" })}
              >
                <Trans>On Avalanche</Trans>
              </button>
              <button
                onClick={() => setActiveChain("Fantom")}
                className={csx("tab-btn ml-2", { active: activeChain === "Fantom" })}
              >
                <Trans>On Fantom</Trans>
              </button>
            </div>
            <div className="mt-16 ">
              {Externals[activeChain].map((item) => {
                return (
                  <div className="mt-16">
                    <p className="section-header">{item.title}</p>
                    <div className="external-links-wrapper -mx-4 mt-8 flex flex-wrap">
                      {item.links.map((link) => {
                        return (
                          <div className="external-link mx-4 my-4 h-[88px] w-[46%] flex-col items-start justify-center md:h-[80px] md:w-[240px] md:flex-row md:items-center md:justify-start">
                            <img width={24} height={24} src={link.icon} alt={link.title} />
                            <p className="mt-8 text-left md:ml-8 md:mt-0">{link.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
