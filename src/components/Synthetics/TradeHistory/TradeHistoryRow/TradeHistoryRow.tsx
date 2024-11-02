import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Address } from "viem";

import { isSwapOrderType } from "domain/synthetics/orders";
import { PositionTradeAction, SwapTradeAction, TradeAction } from "domain/synthetics/tradeHistory";

import { getExplorerUrl } from "config/chains";
import { useMarketsInfoData } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";

import { buildAccountDashboardUrl } from "pages/AccountDashboard/AccountDashboard";
import { formatPositionMessage } from "./utils/position";
import { TooltipContent, TooltipString } from "./utils/shared";
import { formatSwapMessage } from "./utils/swap";

import ExternalLink from "components/ExternalLink/ExternalLink";
import { MarketWithDirectionLabel } from "components/MarketWithDirectionLabel/MarketWithDirectionLabel";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { SwapMarketLabel } from "components/SwapMarketLabel/SwapMarketLabel";
import TokenIcon from "components/TokenIcon/TokenIcon";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";

import NewLink20ReactComponent from "img/ic_new_link_20.svg?react";

import "./TradeHistoryRow.scss";
import { useMedia } from "react-use";

type Props = {
  tradeAction: TradeAction;
  minCollateralUsd: bigint;
  shouldDisplayAccount?: boolean;
  showDebugValues?: boolean;
};

function LineSpan({ span }: { span: TooltipString }) {
  if (span === undefined) {
    return null;
  }

  if (typeof span === "string") {
    return <span>{span}</span>;
  }

  return (
    <span
      className={cx({
        "text-red-500": span.state === "error",
        "text-green-500": span.state === "success",
        muted: span.state === "muted",
      })}
    >
      {span.text}
    </span>
  );
}

function LineSpans({ spans }: { spans: TooltipString[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <LineSpan key={i} span={span} />
      ))}
    </>
  );
}

function TooltipContentComponent({ content }: { content: TooltipContent }) {
  return (
    <div className="TradeHistoryRow-tooltip">
      {content.map((line, i) => {
        if (line === undefined) {
          return null;
        }

        if (line === "") {
          return <br key={i} />;
        }

        if (typeof line === "string") {
          return <div key={i}>{line}</div>;
        }

        if (Array.isArray(line)) {
          return (
            <div key={i}>
              <LineSpans spans={line} />
            </div>
          );
        }

        if ("key" in line && "value" in line) {
          return <StatsTooltipRow key={i} label={line.key} value={<LineSpan span={line.value} />} showDollar={false} />;
        }

        return (
          <div key={i}>
            <LineSpan span={line} />
          </div>
        );
      })}
    </div>
  );
}

const PRICE_TOOLTIP_WIDTH = 400;

export function TradeHistoryRow({ minCollateralUsd, tradeAction, shouldDisplayAccount, showDebugValues }: Props) {
  const chainId = useSelector(selectChainId);
  const isMobile = useMedia(`(max-width: 700px)`);
  const marketsInfoData = useMarketsInfoData();

  const msg = useMemo(() => {
    if (isSwapOrderType(tradeAction.orderType!)) {
      return formatSwapMessage(tradeAction as SwapTradeAction, marketsInfoData);
    }

    return formatPositionMessage(tradeAction as PositionTradeAction, minCollateralUsd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwapOrderType(tradeAction.orderType!) && marketsInfoData, minCollateralUsd.toString(), tradeAction.id]);

  const renderTimestamp = useCallback(() => msg.timestampISO, [msg.timestampISO]);

  const renderMarketContent = useCallback(() => {
    if (msg.indexName) {
      return (
        <StatsTooltipRow
          label={t`Market`}
          value={
            <div className="flex items-center">
              <span>{msg.indexName!}</span>
              <span className="subtext leading-1">[{msg.poolName!}]</span>
            </div>
          }
          showDollar={false}
        />
      );
    }

    return (
      <>
        {msg.fullMarketNames?.map((market, index) => (
          <span key={market.indexName}>
            {index > 0 && " → "}
            <span>{market.indexName}</span>
            <span className="subtext leading-1">[{market.poolName}]</span>
          </span>
        ))}
      </>
    );
  }, [msg.fullMarketNames, msg.indexName, msg.poolName]);

  const renderPriceContent = useCallback(
    () => <TooltipContentComponent content={msg.priceComment} />,
    [msg.priceComment]
  );

  const renderActionTooltipContent = useCallback(
    () => <TooltipContentComponent content={msg.actionComment!} />,
    [msg.actionComment]
  );

  const marketTooltipHandle = useMemo(
    () =>
      msg.swapFromTokenSymbol ? (
        <SwapMarketLabel fromSymbol={msg.swapFromTokenSymbol!} toSymbol={msg.swapToTokenSymbol!} />
      ) : (
        <div className="cursor-help">
          <MarketWithDirectionLabel
            indexName={msg.indexName!}
            isLong={msg.isLong!}
            tokenSymbol={msg.indexTokenSymbol!}
          />
        </div>
      ),
    [msg.indexName, msg.indexTokenSymbol, msg.isLong, msg.swapFromTokenSymbol, msg.swapToTokenSymbol]
  );

  return isMobile ? (
    <div
      style={{ borderColor: "#36363D" }}
      className="border-b-[1px] border-dotted p-[16px] last-of-type:border-b-[0]"
      data-qa="position-item"
    >
      <div className="flex flex-grow flex-col">
        <div className="flex-grow">
          <div className="flex items-center">
            {msg.swapFromTokenSymbol ? (
              msg.action.includes("Request") ? (
                <img src="/images/short-requested.svg" width={40} />
              ) : (
                <img src="/images/swap-executed.svg" width={40} />
              )
            ) : msg.isLong ? (
              msg.action.includes("Request") ? (
                <img src="/images/long-requested.svg" width={40} />
              ) : (
                <img src="/images/long-executed.svg" width={40} />
              )
            ) : msg.action.includes("Request") ? (
              <img src="/images/short-requested.svg" width={40} />
            ) : (
              <img src="/images/short-executed.svg" width={40} />
            )}
            {/* {msg.actionComment ? (
              <TooltipWithPortal
                className={cx("TradeHistoryRow-action-handle")}
                handleClassName={cx("TradeHistoryRow-action-handle", {
                  "text-red-500 !decoration-red-500/50": msg.isActionError,
                })}
                handle={msg.action}
                renderContent={renderActionTooltipContent}
              />
            ) : ( */}
            <div className="ml-[8px] flex flex-col justify-center">
              <div className="mb-[4px] flex items-center whitespace-nowrap">
                <span
                  className={cx(" TradeHistoryRow-action-handle whitespace-nowrap text-[14px] font-[500]", {
                    negative: msg.isActionError,
                  })}
                >
                  {msg.swapFromTokenSymbol ? t`Swap` : msg.isLong ? t`Long` : t`Short`}
                </span>
                <span className=" ml-[8px] whitespace-nowrap rounded-[12px] bg-[#242429] px-[12px] py-[4px] text-[12px] text-[#D3D3D4]">
                  {msg.action.includes("Request") ? "Request" : "Executed"}
                </span>
              </div>
              <span className="text-left text-[12px] font-[500] text-white opacity-40">{msg.timestamp}</span>
            </div>
            {/* )} */}
            {/* <ExternalLink
              className="TradeHistoryRow-external-link ml-5"
              href={`${getExplorerUrl(chainId)}tx/${tradeAction.transaction.hash}`}
            >
              <NewLink20ReactComponent />
            </ExternalLink> */}
          </div>

          <div className="-gap-2 mt-[16px] grid grid-cols-2">
            <div className={cx({ "col-span-2": !!msg.swapFromTokenSymbol })}>
              <p
                className="mb-[4px] text-left text-[10px]"
                style={{ color: "rgba(255, 255, 255, 0.24)" }}
              >{t`MARKET`}</p>
              {marketTooltipHandle}
            </div>
            <div className={cx({ "col-span-2 pt-[16px]": !!msg.swapFromTokenSymbol })}>
              <p className="mb-[4px] text-left text-[10px]" style={{ color: "rgba(255, 255, 255, 0.24)" }}>{t`SIZE`}</p>
              {msg.swapFromTokenSymbol ? (
                <div className="flex items-center">
                  <Trans>
                    <TokenIcon className="mr-4" symbol={msg.swapFromTokenSymbol!} displaySize={18} importSize={24} />
                    <span className="whitespace-nowrap text-[12px] font-[500] text-white opacity-60">
                      {msg.swapFromTokenAmount} {msg.swapFromTokenSymbol!}
                    </span>
                    <img src="/images/arrow-narrow-right.svg" />
                    <TokenIcon className="mr-4" symbol={msg.swapToTokenSymbol!} displaySize={18} importSize={24} />
                    <span className="whitespace-nowrap text-[12px] font-[500] text-white opacity-60">
                      {msg.swapToTokenAmount} {msg.swapToTokenSymbol}
                    </span>
                  </Trans>
                </div>
              ) : (
                <span className="text-[12px] font-[500] text-white opacity-60">{msg.size}</span>
              )}
            </div>
            <div className="pt-[16px]">
              <p
                className="mb-[4px] text-left text-[10px]"
                style={{ color: "rgba(255, 255, 255, 0.24)" }}
              >{t`NET VAL`}</p>
              <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                {msg.price}
              </span>
            </div>

            <div className="pt-[16px]">
              <p
                className="mb-[4px] text-left text-[10px]"
                style={{ color: "rgba(255, 255, 255, 0.24)" }}
              >{t`LIQ. PRICE `}</p>
              {!msg.pnl ? (
                <span className="text-left text-[12px] text-gray-300">-</span>
              ) : (
                <span
                  className={cx(" text-left text-[12px]", {
                    negative: msg.pnlState === "error",
                    positive: msg.pnlState === "success",
                  })}
                >
                  {msg.pnl}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <>
      <tr
        className={cx("TradeHistoryRow", {
          debug: showDebugValues,
        })}
      >
        <td>
          <div className="flex items-center">
            {msg.swapFromTokenSymbol ? (
              msg.action.includes("Request") ? (
                <img src="/images/short-requested.svg" width={40} />
              ) : (
                <img src="/images/swap-executed.svg" width={40} />
              )
            ) : msg.isLong ? (
              msg.action.includes("Request") ? (
                <img src="/images/long-requested.svg" width={40} />
              ) : (
                <img src="/images/long-executed.svg" width={40} />
              )
            ) : msg.action.includes("Request") ? (
              <img src="/images/short-requested.svg" width={40} />
            ) : (
              <img src="/images/short-executed.svg" width={40} />
            )}
            {/* {msg.actionComment ? (
              <TooltipWithPortal
                className={cx("TradeHistoryRow-action-handle")}
                handleClassName={cx("TradeHistoryRow-action-handle", {
                  "text-red-500 !decoration-red-500/50": msg.isActionError,
                })}
                handle={msg.action}
                renderContent={renderActionTooltipContent}
              />
            ) : ( */}
            <div className="ml-[8px] flex flex-col justify-center">
              <div className="mb-[4px] flex items-center">
                <span
                  className={cx("TradeHistoryRow-action-handle text-[14px] font-[500]", {
                    negative: msg.isActionError,
                  })}
                >
                  {msg.swapFromTokenSymbol ? t`Swap` : msg.isLong ? t`Long` : t`Short`}
                </span>
                <span className="ml-[8px] rounded-[12px] bg-[#242429] px-[12px] py-[4px] text-[12px] text-[#D3D3D4]">
                  {msg.action.includes("Request") ? "Request" : "Executed"}
                </span>
              </div>
              <span className="text-left text-[12px] font-[500] text-white opacity-40">{msg.timestamp}</span>
            </div>
            {/* )} */}
            {/* <ExternalLink
              className="TradeHistoryRow-external-link ml-5"
              href={`${getExplorerUrl(chainId)}tx/${tradeAction.transaction.hash}`}
            >
              <NewLink20ReactComponent />
            </ExternalLink> */}
          </div>
          {/* <TooltipWithPortal
            disableHandleStyle
            handle={<span className="TradeHistoryRow-time muted cursor-help">{msg.timestamp}</span>}
            tooltipClassName="TradeHistoryRow-tooltip-portal cursor-help *:cursor-auto"
            renderContent={renderTimestamp}
          />
          {shouldDisplayAccount && (
            <Link
              className="TradeHistoryRow-account muted underline"
              to={buildAccountDashboardUrl(tradeAction.account as Address, undefined, 2)}
            >
              {tradeAction.account}
            </Link>
          )} */}
        </td>
        <td className="!text-right">
          {/* <TooltipWithPortal
            disableHandleStyle
            tooltipClassName="cursor-help *:cursor-auto"
            handle={marketTooltipHandle}
            renderContent={renderMarketContent}
          /> */}
          {marketTooltipHandle}
        </td>
        <td className="whitesppace-nowrap !text-right text-[12px] font-[500] text-white">
          {msg.swapFromTokenSymbol ? (
            <div className="flex items-center">
              <Trans>
                <TokenIcon className="mr-4" symbol={msg.swapFromTokenSymbol!} displaySize={18} importSize={24} />
                <span className="text-[12px] font-[500] text-white opacity-60">
                  {msg.swapFromTokenAmount} {msg.swapFromTokenSymbol!}
                </span>
                <img src="/images/arrow-narrow-right.svg" />
                <TokenIcon className="mr-4" symbol={msg.swapToTokenSymbol!} displaySize={18} importSize={24} />
                <span className="text-[12px] font-[500] text-white opacity-60">
                  {msg.swapToTokenAmount} {msg.swapToTokenSymbol}
                </span>
              </Trans>
            </div>
          ) : (
            <span className="text-[12px] font-[500] text-white opacity-60">{msg.size}</span>
          )}
        </td>
        <td className="text-[12px] !text-right font-[500] text-white opacity-60">
          {/* <TooltipWithPortal
            tooltipClassName="TradeHistoryRow-price-tooltip-portal"
            handle={msg.price}
            position="bottom-end"
            renderContent={renderPriceContent}
            maxAllowedWidth={PRICE_TOOLTIP_WIDTH}
          /> */}
          {msg.price}
        </td>
        <td className="TradeHistoryRow-pnl-fees !text-right">
          {!msg.pnl ? (
            <span className="text-left text-gray-300">-</span>
          ) : (
            <span
              className={cx(" text-left", {
                "text-red-500": msg.pnlState === "error",
                "text-green-500": msg.pnlState === "success",
              })}
            >
              {msg.pnl}
            </span>
          )}
        </td>
      </tr>
      {showDebugValues && (
        <tr>
          <td colSpan={4}>
            <div className="muted">Order Key: {tradeAction.orderKey}</div>
          </td>
        </tr>
      )}
    </>
  );
}
