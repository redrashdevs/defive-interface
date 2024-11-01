import type { MessageDescriptor } from "@lingui/core";
import { msg, t, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import React, { Fragment, useCallback, useMemo } from "react";
import cx from "classnames";

import { getExplorerUrl } from "config/chains";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { ClaimCollateralAction, ClaimType } from "domain/synthetics/claimHistory";
import { getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets";
import { formatTokenAmountWithUsd } from "lib/numbers";
import { getFormattedTotalClaimAction } from "./getFormattedTotalClaimAction";

import ExternalLink from "components/ExternalLink/ExternalLink";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import TokenIcon from "components/TokenIcon/TokenIcon";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";

import {
  formatTradeActionTimestamp,
  formatTradeActionTimestampISO,
} from "../../TradeHistory/TradeHistoryRow/utils/shared";

import NewLink20ReactComponent from "img/ic_new_link_20.svg?react";
import { useMedia } from "react-use";

export type ClaimCollateralHistoryRowProps = {
  claimAction: ClaimCollateralAction;
};

export const claimCollateralEventTitles: Record<ClaimCollateralAction["eventName"], MessageDescriptor> = {
  [ClaimType.ClaimFunding]: msg`Claim Funding Fees`,
  [ClaimType.ClaimPriceImpact]: msg`Claim Price Impact Rebates`,
};

export function ClaimCollateralHistoryRow(p: ClaimCollateralHistoryRowProps) {
  const { claimAction } = p;

  const isMobile = useMedia("(max-width: 600px)");
  const marketNamesJoined = useMemo(() => {
    return (
      <div className="flex items-center leading-2">
        {claimAction.claimItems.map(({ marketInfo }, index) => (
          <React.Fragment key={index}>
            {index !== 0 && ", "}
            <div
              className={cx(
                "inline-flex items-center whitespace-nowrap text-[14px] font-[500] leading-base text-white",
                { "ml-5": index !== 0 }
              )}
            >
              <TokenIcon className="mr-5" symbol={marketInfo.indexToken.symbol} displaySize={20} />
              <p>{getMarketIndexName(marketInfo)}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }, [claimAction.claimItems]);

  const formattedTimestamp = useMemo(() => formatTradeActionTimestamp(claimAction.timestamp), [claimAction.timestamp]);

  const renderIsoTimestamp = useCallback(() => {
    return formatTradeActionTimestampISO(claimAction.timestamp);
  }, [claimAction.timestamp]);

  const sizeContent = useMemo(() => {
    const formattedTotalUsd = getFormattedTotalClaimAction(claimAction);

    return (
      // <TooltipWithPortal
      //   tooltipClassName="ClaimHistoryRow-size-tooltip-portal"
      //   renderContent={() => <SizeTooltip claimAction={claimAction} />}
      //   handle={formattedTotalUsd}
      // />
      formattedTotalUsd
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
            {marketNamesJoined}
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
        {/* <div className="flex">
          <div className="ClaimHistoryRow-action-handle">{eventTitle}</div>
          <ExternalLink
            className="ClaimHistoryRow-external-link ml-5"
            href={`${getExplorerUrl(chainId)}tx/${claimAction.transactionHash}`}
          >
            <NewLink20ReactComponent />
          </ExternalLink>
        </div> */}
        {/* <TooltipWithPortal
          disableHandleStyle
          handle={<span className="ClaimHistoryRow-time muted cursor-help">{formattedTimestamp}</span>}
          tooltipClassName="ClaimHistoryRow-tooltip-portal cursor-help *:cursor-auto"
          renderContent={renderIsoTimestamp}
        /> */}
        <div className="ml-[8px] flex flex-col justify-center">
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
      </td>
      <td>{marketNamesJoined}</td>
      <td className="ClaimHistoryRow-size text-[14px] font-[500] text-white opacity-60">{sizeContent}</td>
    </tr>
  );
}

function SizeTooltip({ claimAction }: { claimAction: ClaimCollateralAction }) {
  return (
    <>
      {claimAction.claimItems.map(
        ({ marketInfo: market, longTokenAmount, shortTokenAmount, longTokenAmountUsd, shortTokenAmountUsd }) => {
          const indexName = getMarketIndexName(market);
          const poolName = getMarketPoolName(market);
          return (
            <Fragment key={market.indexTokenAddress}>
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
            </Fragment>
          );
        }
      )}
    </>
  );
}
