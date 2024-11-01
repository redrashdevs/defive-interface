import { Trans } from "@lingui/macro";
import { useEffect, useRef, useState } from "react";

import { Mode, Operation } from "components/Synthetics/GmSwap/GmSwapBox/types";
import { getSyntheticsDepositMarketKey } from "config/localStorage";
import { selectDepositMarketTokensData } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { MarketsInfoData, useMarketsInfoRequest, useMarketTokensData } from "domain/synthetics/markets";
import { useGmMarketsApy } from "domain/synthetics/markets/useGmMarketsApy";
import { getTokenData } from "domain/synthetics/tokens";
import { useChainId } from "lib/chains";
import { getPageTitle } from "lib/legacy";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { EMPTY_OBJECT, getByKey } from "lib/objects";

import SEO from "components/Common/SEO";
import ExternalLink from "components/ExternalLink/ExternalLink";
import Footer from "components/Footer/Footer";
import PageTitle from "components/PageTitle/PageTitle";
import { GmList } from "components/Synthetics/GmList/GmList";
import { getGmSwapBoxAvailableModes } from "components/Synthetics/GmSwap/GmSwapBox/getGmSwapBoxAvailableModes";
import { GmSwapBox } from "components/Synthetics/GmSwap/GmSwapBox/GmSwapBox";
import { MarketStats } from "components/Synthetics/MarketStats/MarketStats";

import "./MarketPoolsPage.scss";
import { Link } from "react-router-dom";

export function MarketPoolsPage() {
  const { chainId } = useChainId();
  const gmSwapBoxRef = useRef<HTMLDivElement>(null);

  const { marketsInfoData = EMPTY_OBJECT as MarketsInfoData } = useMarketsInfoRequest(chainId);

  const depositMarketTokensData = useSelector(selectDepositMarketTokensData);
  const { marketTokensData: withdrawalMarketTokensData } = useMarketTokensData(chainId, { isDeposit: false });

  const { marketsTokensApyData, marketsTokensIncentiveAprData, marketsTokensLidoAprData } = useGmMarketsApy(chainId);

  const [operation, setOperation] = useState<Operation>(Operation.Deposit);
  let [mode, setMode] = useState<Mode>(Mode.Single);

  const [selectedMarketKey, setSelectedMarketKey] = useLocalStorageSerializeKey<string | undefined>(
    getSyntheticsDepositMarketKey(chainId),
    undefined
  );

  useEffect(() => {
    const newAvailableModes = getGmSwapBoxAvailableModes(operation, getByKey(marketsInfoData, selectedMarketKey));

    if (!newAvailableModes.includes(mode)) {
      setMode(newAvailableModes[0]);
    }
  }, [marketsInfoData, mode, operation, selectedMarketKey]);

  const marketInfo = getByKey(marketsInfoData, selectedMarketKey);

  const marketToken = getTokenData(
    operation === Operation.Deposit ? depositMarketTokensData : withdrawalMarketTokensData,
    selectedMarketKey
  );

  return (
    <SEO title={getPageTitle("V2 Pools")}>
      <div className="container mx-auto px-[16px] pt-32 lg:px-[100px]">
        <Link to={"/earn"}>
          <div className="mb-32 flex h-[40px] w-[180px] items-center justify-evenly rounded-[40px] bg-[#242429] py-8 ">
            <img src="/images/arrow-narrow-left.svg" />
            <p className="whitespace-nowrap text-[#D6D6D6]">Back to pools</p>
          </div>
        </Link>

        <div className="MarketPoolsPage-content">
          <MarketStats
            marketsTokensApyData={marketsTokensApyData}
            marketsTokensIncentiveAprData={marketsTokensIncentiveAprData}
            marketsTokensLidoAprData={marketsTokensLidoAprData}
            marketTokensData={depositMarketTokensData}
            marketsInfoData={marketsInfoData}
            marketInfo={marketInfo}
            marketToken={marketToken}
          />

          <div className="MarketPoolsPage-swap-box xl:pl-32" ref={gmSwapBoxRef}>
            <GmSwapBox
              selectedMarketAddress={selectedMarketKey}
              onSelectMarket={setSelectedMarketKey}
              operation={operation}
              mode={mode}
              onSetMode={setMode}
              onSetOperation={setOperation}
            />
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </SEO>
  );
}
