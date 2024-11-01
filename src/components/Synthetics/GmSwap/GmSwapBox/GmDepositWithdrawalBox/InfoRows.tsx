import { t } from "@lingui/macro";
import values from "lodash/values";

import { selectMarketsInfoData } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { ExecutionFee } from "domain/synthetics/fees";
import { TokensData } from "domain/synthetics/tokens";
import { useGmTokensFavorites } from "domain/synthetics/tokens/useGmTokensFavorites";
import { GmSwapFees } from "domain/synthetics/trade";

import { showMarketToast } from "../showMarketToast";

import { ExchangeInfo } from "components/Exchange/ExchangeInfo";
import ExchangeInfoRow from "components/Exchange/ExchangeInfoRow";
import { PoolSelector } from "components/MarketSelector/PoolSelector";
import { GmFees } from "components/Synthetics/GmSwap/GmFees/GmFees";
import { NetworkFeeRow } from "components/Synthetics/NetworkFeeRow/NetworkFeeRow";
import { HighPriceImpactRow } from "../HighPriceImpactRow";
import { formatDeltaUsd, formatUsdPrice } from "@/lib/numbers";
import { bigMath } from "@/lib/bigmath";
import { useState } from "react";
import cx from "classnames";

export function InfoRows({
  indexName,
  marketAddress,
  marketTokensData,
  isDeposit,
  fees,
  executionFee,
  isHighPriceImpact,
  isHighPriceImpactAccepted,
  setIsHighPriceImpactAccepted,
  isSingle,
  onMarketChange,
}: {
  indexName: string | undefined;
  marketAddress: string | undefined;
  marketTokensData: TokensData | undefined;
  isDeposit: boolean;
  fees: GmSwapFees | undefined;
  executionFee: ExecutionFee | undefined;
  isHighPriceImpact: boolean;
  isHighPriceImpactAccepted: boolean;
  setIsHighPriceImpactAccepted: (val: boolean) => void;
  isSingle: boolean;
  onMarketChange: (marketAddress: string) => void;
}) {
  const gmTokenFavoritesContext = useGmTokensFavorites();
  const markets = values(useSelector(selectMarketsInfoData));
  const [expandFees, setExpandFees] = useState(false);
  return (
    <ExchangeInfo className="GmSwapBox-info-section" dividerClassName="App-card-divider">
      {/* <ExchangeInfo.Group>
        <ExchangeInfoRow
          className="SwapBox-info-row"
          label={t`Pool`}
          value={
            <PoolSelector
              label={t`Pool`}
              className="-mr-4"
              selectedIndexName={indexName}
              selectedMarketAddress={marketAddress}
              markets={markets}
              marketTokensData={marketTokensData}
              isSideMenu
              showBalances
              onSelectMarket={(marketInfo) => {
                onMarketChange(marketInfo.marketTokenAddress);
                showMarketToast(marketInfo);
              }}
              {...gmTokenFavoritesContext}
            />
          }
        />
      </ExchangeInfo.Group> */}

      {/* <ExchangeInfo.Group>
        <div className="GmSwapBox-info-section">
          <GmFees
            isDeposit={isDeposit}
            totalFees={fees?.totalFees}
            swapFee={fees?.swapFee}
            swapPriceImpact={fees?.swapPriceImpact}
            uiFee={fees?.uiFee}
          />
          <NetworkFeeRow executionFee={executionFee} />
        </div>
      </ExchangeInfo.Group> */}
      <div className="pointer flex items-center justify-between" onClick={() => setExpandFees(!expandFees)}>
        <p className="fee-title">TOTAL FEES</p>
        <div className="flex items-center">
          <p className="negative fee-content">{formatDeltaUsd(fees?.totalFees?.deltaUsd)}</p>
          <svg
            stroke="currentColor"
            fill="currentColor"
            stroke-width="0"
            viewBox="0 0 24 24"
            className={cx('rotate-0 transition duration-300 ease-in-out', {'rotate-180': expandFees})}
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.293 9.293 12 13.586 7.707 9.293l-1.414 1.414L12 16.414l5.707-5.707z"></path>
          </svg>
        </div>
      </div>
      {!expandFees ? null : (
        <>
          <div className="mt-8 flex items-center justify-between">
            <p className="fee-title">NETWORK FEE</p>
            <div className="flex items-center">
              <p className="negative fee-content">{formatDeltaUsd(-executionFee?.feeUsd!)}</p>
            </div>
          </div>
          {bigMath.abs(fees?.swapPriceImpact?.deltaUsd ?? 0n) > 0 ? (
            <div className="flex items-center justify-between">
              <p className="fee-title">{t`PRICE IMPACT`}</p>
              <div className="flex items-center">
                <p className="negative fee-content">
                  {formatDeltaUsd(fees?.swapPriceImpact?.deltaUsd, fees?.swapPriceImpact?.bps)!}
                </p>
              </div>
            </div>
          ) : null}
          {fees?.swapFee ? (
            <div className="flex items-center justify-between">
              <p className="fee-title">{isDeposit ? t`BUY FEE` : t`SELL FEE`}</p>
              <div className="flex items-center">
                <p className="negative fee-content">{formatDeltaUsd(fees.swapFee.deltaUsd, fees.swapFee.bps!)!}</p>
              </div>
            </div>
          ) : null}

          {bigMath.abs(fees?.uiFee?.deltaUsd ?? 0n) > 0 ? (
            <div className="flex items-center justify-between">
              <p className="fee-title">{t`UI FEE`}</p>
              <div className="flex items-center">
                <p className="negative fee-content">{formatDeltaUsd(fees?.uiFee?.deltaUsd, fees?.uiFee?.bps)!}</p>
              </div>
            </div>
          ) : null}
        </>
      )}

      {isHighPriceImpact && (
        <HighPriceImpactRow
          isHighPriceImpactAccepted={isHighPriceImpactAccepted}
          setIsHighPriceImpactAccepted={setIsHighPriceImpactAccepted}
          isSingle={isSingle}
        />
      )}
    </ExchangeInfo>
  );
}
