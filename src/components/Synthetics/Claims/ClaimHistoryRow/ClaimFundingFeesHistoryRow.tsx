import { MessageDescriptor } from "@lingui/core";
import { msg, t, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import React, { useCallback, useMemo } from "react";

import { getExplorerUrl } from "config/chains";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { ClaimFundingFeeAction, ClaimType } from "domain/synthetics/claimHistory";
import { getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets";
import { formatTokenAmountWithUsd } from "lib/numbers";
import { getFormattedTotalClaimAction } from "./getFormattedTotalClaimAction";

import ExternalLink from "components/ExternalLink/ExternalLink";
import { MarketWithDirectionLabel } from "components/MarketWithDirectionLabel/MarketWithDirectionLabel";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import {
  formatTradeActionTimestamp,
  formatTradeActionTimestampISO,
} from "components/Synthetics/TradeHistory/TradeHistoryRow/utils/shared";
import Tooltip from "components/Tooltip/Tooltip";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";

import NewLink20ReactComponent from "img/ic_new_link_20.svg?react";
import TokenIcon from "@/components/TokenIcon/TokenIcon";
import cx from "classnames";
import { useMedia } from "react-use";

export type ClaimFundingFeesHistoryRowProps = {
  claimAction: ClaimFundingFeeAction;
};

export const claimFundingFeeEventTitles: Record<ClaimFundingFeeAction["eventName"], MessageDescriptor> = {
  [ClaimType.SettleFundingFeeCancelled]: msg`Failed Settlement of Funding Fees`,
  [ClaimType.SettleFundingFeeCreated]: msg`Request Settlement of Funding Fees`,
  [ClaimType.SettleFundingFeeExecuted]: msg`Settled Funding Fees`,
};

export function ClaimFundingFeesHistoryRow({ claimAction }: ClaimFundingFeesHistoryRowProps) {
  const chainId = useSelector(selectChainId);
  const { _ } = useLingui();

  const eventTitleDescriptor = claimFundingFeeEventTitles[claimAction.eventName];

  const isMobile = useMedia("(max-width: 600px)");
  const formattedTimestamp = useMemo(() => formatTradeActionTimestamp(claimAction.timestamp), [claimAction.timestamp]);

  const renderIsoTimestamp = useCallback(() => {
    return formatTradeActionTimestampISO(claimAction.timestamp);
  }, [claimAction.timestamp]);

  const marketContent = useMemo(() => {
    if (claimAction.eventName === ClaimType.SettleFundingFeeCreated) {
      const formattedMarketNames = (
        <div className={cx({ "flex-col items-start": isMobile }, "flex   leading-2")}>
          {claimAction.markets.map((market, index) => {
            const indexName = getMarketIndexName(market);
            const poolName = getMarketPoolName(market);
            const isLong = claimAction.isLongOrders[index];
            return (
              <div key={index}>
                {/* {index !== 0 && ", "}
              <MarketWithDirectionLabel
                bordered
                indexName={getMarketIndexName(market)}
                tokenSymbol={market.indexToken.symbol}
                isLong={claimAction.isLongOrders[index]}
              /> */}
                {!isMobile ? <span>{index !== 0 && ", "}</span> : null}
                <div
                  className={cx("inline-flex items-start text-white", { "ml-10": index !== 0 && !isMobile })}
                  key={`${market.name}/${isLong}`}
                >
                  {isLong ? (
                    <img src="/images/long-executed.svg" width={20} />
                  ) : (
                    <img src="/images/short-executed.svg" width={20} />
                  )}
                  <p
                    className={cx(
                      { "text-[#FF303E]": !isLong },
                      "ml-4 mr-8 text-[14px] font-[500] leading-base text-white"
                    )}
                  >
                    {isLong ? t`Long` : t`Short`}
                  </p>
                </div>
                <div
                  className={cx(
                    "inline-flex items-center whitespace-nowrap text-[14px] font-[500] leading-base text-white"
                  )}
                >
                  <TokenIcon className="mr-5" symbol={market.indexToken.symbol} displaySize={20} />
                  <p>{getMarketIndexName(market)}</p>
                </div>
              </div>
            );
          })}
        </div>
      );

      return formattedMarketNames;
      // return (
      //   <Tooltip
      //     disableHandleStyle
      //     handleClassName="cursor-help"
      //     handle={formattedMarketNames}
      //     renderContent={() => {
      //       return claimAction.markets.map((market, index) => {
      //         const indexName = getMarketIndexName(market);
      //         const poolName = getMarketPoolName(market);
      //         const isLong = claimAction.isLongOrders[index];
      //         return (
      //           <div
      //             className="ClaimHistoryRow-tooltip-row inline-flex items-start text-white"
      //             key={`${market.name}/${isLong}`}
      //           >
      //             {isLong ? t`Long` : t`Short`} {indexName} <span className="subtext leading-1">[{poolName}]</span>
      //           </div>
      //         );
      //       });
      //     }}
      //   />
      // );
    }

    if (claimAction.eventName === ClaimType.SettleFundingFeeCancelled) {
      const indexName = getMarketIndexName(claimAction.markets[0]);
      return (
        <TooltipWithPortal
          disableHandleStyle
          handleClassName="cursor-help *:cursor-auto"
          handle={
            <MarketWithDirectionLabel
              bordered
              indexName={indexName}
              tokenSymbol={claimAction.markets[0].indexToken.symbol}
              isLong={claimAction.isLongOrders[0]}
            />
          }
          renderContent={() => {
            return claimAction.markets.map((market, index) => {
              const indexName = getMarketIndexName(market);
              const poolName = getMarketPoolName(market);
              const isLong = claimAction.isLongOrders[index];
              return (
                <div
                  className="ClaimHistoryRow-tooltip-row inline-flex items-start text-white"
                  key={`${market.name}/${isLong}`}
                >
                  {isLong ? t`Long` : t`Short`} {indexName} <span className="subtext leading-1">[{poolName}]</span>
                </div>
              );
            });
          }}
        />
      );
    }

    if (claimAction.eventName === ClaimType.SettleFundingFeeExecuted) {
      const indexName = getMarketIndexName(claimAction.markets[0]);

      // const positionName = (
      //   <MarketWithDirectionLabel
      //     indexName={indexName}
      //     tokenSymbol={claimAction.markets[0].indexToken.symbol}
      //     isLong={claimAction.isLongOrders[0]}
      //   />
      // );
      return (
        <>
          <div className={cx("inline-flex items-start text-white")}>
            {claimAction.isLongOrders[0] ? (
              <img src="/images/long-executed.svg" width={20} />
            ) : (
              <img src="/images/short-executed.svg" width={20} />
            )}
            <p
              className={cx(
                { "text-[#FF303E]": !claimAction.isLongOrders[0] },
                "ml-4 mr-8 text-[14px] font-[500] leading-base text-white"
              )}
            >
              {claimAction.isLongOrders[0] ? t`Long` : t`Short`}
            </p>
          </div>
          <div
            className={cx("inline-flex items-center whitespace-nowrap text-[14px] font-[500] leading-base text-white")}
          >
            <TokenIcon className="mr-5" symbol={claimAction.markets[0].indexToken.symbol} displaySize={20} />
            <p>{indexName}</p>
          </div>
        </>
      );
    }

    return null;
  }, [claimAction.eventName, claimAction.isLongOrders, claimAction.markets]);

  const sizeContent = useMemo(() => {
    if (
      claimAction.eventName === ClaimType.SettleFundingFeeCreated ||
      claimAction.eventName === ClaimType.SettleFundingFeeCancelled
    ) {
      return "-";
    }

    const amounts = claimAction.claimItems.map(
      ({ marketInfo: market, longTokenAmount, shortTokenAmount, longTokenAmountUsd, shortTokenAmountUsd }) => {
        const indexName = getMarketIndexName(market);
        const poolName = getMarketPoolName(market);

        return (
          <>
            {longTokenAmount > 0 && (
              <div>
                {formatTokenAmountWithUsd(
                  longTokenAmount,
                  longTokenAmountUsd,
                  market.longToken.symbol,
                  market.longToken.decimals
                )}
              </div>
            )}

            {shortTokenAmount > 0 && (
              <div>
                {formatTokenAmountWithUsd(
                  shortTokenAmount,
                  shortTokenAmountUsd,
                  market.shortToken.symbol,
                  market.shortToken.decimals
                )}
              </div>
            )}
          </>
        );
        return (
          <StatsTooltipRow
            textClassName="mb-5 whitespace-nowrap"
            key={market.marketTokenAddress}
            label={
              <div className="flex items-start text-white">
                <span>{indexName}</span>
                <span className="subtext leading-1">[{poolName}]</span>
              </div>
            }
            showDollar={false}
            value={
              <>
                {longTokenAmount > 0 && (
                  <div>
                    {formatTokenAmountWithUsd(
                      longTokenAmount,
                      longTokenAmountUsd,
                      market.longToken.symbol,
                      market.longToken.decimals
                    )}
                  </div>
                )}

                {shortTokenAmount > 0 && (
                  <div>
                    {formatTokenAmountWithUsd(
                      shortTokenAmount,
                      shortTokenAmountUsd,
                      market.shortToken.symbol,
                      market.shortToken.decimals
                    )}
                  </div>
                )}
              </>
            }
          />
        );
      }
    );

    const formattedTotalUsd = getFormattedTotalClaimAction(claimAction);

    return (
      <TooltipWithPortal
        tooltipClassName="ClaimHistoryRow-size-tooltip-portal"
        renderContent={() => <>{amounts}</>}
        handle={formattedTotalUsd}
      />
    );
  }, [claimAction]);
  return isMobile ? (
    <div
      style={{ borderColor: "#36363D" }}
      className="border-b-[1px] border-dotted p-[16px] last-of-type:border-b-[0]"
      data-qa="position-item"
    >
      <div className="flex flex-grow flex-col">
        <div className="flex-grow">
          <div className="flex items-center"></div>

          <div className="pt-[16px]">
            <div className="flex flex-col justify-center">
              <div className="mb-[4px] flex items-center">
                <span className={"TradeHistoryRow-action-handle text-[14px] font-[500]"}>
                  <Trans>Funding Fees</Trans>
                </span>
                <span className="ml-[8px] rounded-[12px] bg-[#242429] px-[12px] py-[4px] text-[12px] text-[#D3D3D4]">
                  {/* {msg.action.includes("Request") ? "Request" : "Executed"} */}
                  {/* {eventTitle} */}
                  {"Claim"}
                </span>
              </div>
              <span className="text-left text-[12px] font-[500] text-white opacity-40">{formattedTimestamp}</span>
            </div>
          </div>
          <div className="pt-[16px]">
            <p className="mb-[4px] text-left text-[10px]" style={{ color: "rgba(255, 255, 255, 0.24)" }}>{t`MARKET`}</p>
            {marketContent}
          </div>
          <div className="pt-[16px]">
            <p className="mb-[4px] text-left text-[10px]" style={{ color: "rgba(255, 255, 255, 0.24)" }}>{t`SIZE`}</p>
            <p className="text-[14px] font-[500] text-white opacity-60">{sizeContent}</p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <tr>
      <td>
        <div className="flex">
          {/* <div className="ClaimHistoryRow-action-handle">{_(eventTitleDescriptor)}</div> */}
          {/* <ExternalLink
            className="ClaimHistoryRow-external-link ml-5"
            href={`${getExplorerUrl(chainId)}tx/${claimAction.transactionHash}`}
          >
            <NewLink20ReactComponent />
          </ExternalLink> */}
        </div>
        {/* <TooltipWithPortal
          disableHandleStyle
          handle={<span className="ClaimHistoryRow-time muted">{formattedTimestamp}</span>}
          tooltipClassName="ClaimHistoryRow-tooltip-portal"
          renderContent={renderIsoTimestamp}
        /> */}
        <div className="ml-[8px] flex flex-col justify-center">
          <div className="mb-[4px] flex items-center">
            <span className={"TradeHistoryRow-action-handle text-[14px] font-[500]"}>
              <Trans>Funding Fees</Trans>
            </span>
            <span className="ml-[8px] rounded-[12px] bg-[#242429] px-[12px] py-[4px] text-[12px] text-[#D3D3D4]">
              {claimAction.eventName === "SettleFundingFeeCreated" ? "Request Settlement" : null}
              {claimAction.eventName === "SettleFundingFeeExecuted" ? "Settled" : null}
              {claimAction.eventName === "SettleFundingFeeCancelled" ? "Settlement Cancelled" : null}
            </span>
          </div>
          <span className="text-left text-[12px] font-[500] text-white opacity-40">{formattedTimestamp}</span>
        </div>
      </td>
      <td className="!text-right">{marketContent}</td>
      <td className="!text-right ClaimHistoryRow-size  text-[14px] font-[500] text-white opacity-60">{sizeContent}</td>
    </tr>
  );
}
