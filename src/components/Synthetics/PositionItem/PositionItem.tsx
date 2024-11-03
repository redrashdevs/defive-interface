import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import { useCallback, useMemo } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { FaAngleRight } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { MdClose } from "react-icons/md";
import { useMedia } from "react-use";

import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { usePositionsConstants } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { useEditingOrderKeyState } from "context/SyntheticsStateContext/hooks/orderEditorHooks";
import { useCancelOrder, usePositionOrdersWithErrors } from "context/SyntheticsStateContext/hooks/orderHooks";
import { selectShowPnlAfterFees } from "context/SyntheticsStateContext/selectors/settingsSelectors";
import {
  selectTradeboxCollateralTokenAddress,
  selectTradeboxMarketAddress,
  selectTradeboxTradeType,
} from "context/SyntheticsStateContext/selectors/tradeboxSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { getBorrowingFeeRateUsd, getFundingFeeRateUsd } from "domain/synthetics/fees";
import { getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets";
import { OrderErrors, PositionOrderInfo, isDecreaseOrderType, isIncreaseOrderType } from "domain/synthetics/orders";
import {
  PositionInfo,
  formatEstimatedLiquidationTime,
  formatLeverage,
  formatLiquidationPrice,
  getEstimatedLiquidationTimeInHours,
  getTriggerNameByOrderType,
} from "domain/synthetics/positions";
import { TradeMode, TradeType, getTriggerThresholdType } from "domain/synthetics/trade";
import { CHART_PERIODS } from "lib/legacy";
import { formatDeltaUsd, formatPercentage, formatTokenAmount, formatUsd } from "lib/numbers";
import { getPositiveOrNegativeClass } from "lib/utils";

import Button from "components/Button/Button";
import PositionDropdown from "components/Exchange/PositionDropdown";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import TokenIcon from "components/TokenIcon/TokenIcon";
import Tooltip from "components/Tooltip/Tooltip";

import { makeSelectMarketPriceDecimals } from "context/SyntheticsStateContext/selectors/statsSelectors";
import "./PositionItem.scss";
import { getNormalizedTokenSymbol } from "@/config/tokens";

export type Props = {
  position: PositionInfo;
  hideActions?: boolean;
  showPnlAfterFees: boolean;
  onClosePositionClick?: () => void;
  onEditCollateralClick?: () => void;
  onShareClick: () => void;
  onSelectPositionClick?: (tradeMode?: TradeMode) => void;
  isLarge: boolean;
  openSettings: () => void;
  onOrdersClick?: (key?: string) => void;
  onCancelOrder?: (orderKey: string) => void;
};

export function PositionItem(p: Props) {
  const { showDebugValues } = useSettings();
  const savedShowPnlAfterFees = useSelector(selectShowPnlAfterFees);
  const currentTradeType = useSelector(selectTradeboxTradeType);
  const currentMarketAddress = useSelector(selectTradeboxMarketAddress);
  const currentCollateralAddress = useSelector(selectTradeboxCollateralTokenAddress);
  const displayedPnl = savedShowPnlAfterFees ? p.position.pnlAfterFees : p.position.pnl;
  const displayedPnlPercentage = savedShowPnlAfterFees ? p.position.pnlAfterFeesPercentage : p.position.pnlPercentage;
  const isMobile = useMedia("(max-width: 1100px)");
  const { minCollateralUsd } = usePositionsConstants();
  const isCurrentTradeTypeLong = currentTradeType === TradeType.Long;
  const isCurrentMarket =
    currentMarketAddress === p.position.marketAddress &&
    currentCollateralAddress === p.position.collateralTokenAddress &&
    isCurrentTradeTypeLong === p.position.isLong;

  const marketDecimals = useSelector(makeSelectMarketPriceDecimals(p.position.marketInfo.indexTokenAddress));

  function renderNetValue() {
    return (
      <Tooltip
        handle={formatUsd(p.position.netValue)}
        position={p.isLarge ? "bottom-start" : "bottom-end"}
        renderContent={() => (
          <div>
            {p.position.uiFeeUsd > 0
              ? t`Net Value: Initial Collateral + PnL - Borrow Fee - Negative Funding Fee - Close Fee - UI Fee`
              : t`Net Value: Initial Collateral + PnL - Borrow Fee - Negative Funding Fee - Close Fee`}
            <br />
            <br />
            <StatsTooltipRow
              label={t`Initial Collateral`}
              value={formatUsd(p.position.collateralUsd) || "..."}
              showDollar={false}
            />
            <StatsTooltipRow
              label={t`PnL`}
              value={formatDeltaUsd(p.position?.pnl) || "..."}
              showDollar={false}
              textClassName={getPositiveOrNegativeClass(p.position.pnl)}
            />
            <StatsTooltipRow
              label={t`Accrued Borrow Fee`}
              value={formatUsd(p.position.pendingBorrowingFeesUsd) || "..."}
              showDollar={false}
              textClassName={cx({
                "text-red-500": p.position.pendingBorrowingFeesUsd !== 0n,
              })}
            />
            <StatsTooltipRow
              label={t`Accrued Negative Funding Fee`}
              value={formatUsd(-p.position.pendingFundingFeesUsd) || "..."}
              showDollar={false}
              textClassName={cx({
                "text-red-500": p.position.pendingFundingFeesUsd !== 0n,
              })}
            />
            <StatsTooltipRow
              label={t`Close Fee`}
              showDollar={false}
              value={formatUsd(-p.position.closingFeeUsd) || "..."}
              textClassName="text-red-500"
            />
            {p.position.uiFeeUsd > 0 && (
              <StatsTooltipRow
                label={t`UI Fee`}
                showDollar={false}
                value={formatUsd(-p.position.uiFeeUsd)}
                textClassName="text-red-500"
              />
            )}
            <br />
            <StatsTooltipRow
              label={t`PnL After Fees`}
              value={formatDeltaUsd(p.position.pnlAfterFees, p.position.pnlAfterFeesPercentage)}
              showDollar={false}
              textClassName={getPositiveOrNegativeClass(p.position.pnlAfterFees)}
            />
          </div>
        )}
      />
    );
  }

  function renderCollateral() {
    return (
      <>
        <div className={cx("position-list-collateral", { isSmall: !p.isLarge })}>
          <Tooltip
            handle={<span data-qa="position-collateral-value">{formatUsd(p.position.remainingCollateralUsd)}</span>}
            position={p.isLarge ? "bottom-start" : "bottom-end"}
            className="PositionItem-collateral-tooltip"
            handleClassName={cx({ negative: p.position.hasLowCollateral })}
            renderContent={() => {
              const fundingFeeRateUsd = getFundingFeeRateUsd(
                p.position.marketInfo,
                p.position.isLong,
                p.position.sizeInUsd,
                CHART_PERIODS["1d"]
              );
              const borrowingFeeRateUsd = getBorrowingFeeRateUsd(
                p.position.marketInfo,
                p.position.isLong,
                p.position.sizeInUsd,
                CHART_PERIODS["1d"]
              );
              return (
                <>
                  {p.position.hasLowCollateral && (
                    <div>
                      <Trans>
                        WARNING: This position has a low amount of collateral after deducting fees, deposit more
                        collateral to reduce the position's liquidation risk.
                      </Trans>
                      <br />
                      <br />
                    </div>
                  )}
                  <StatsTooltipRow
                    label={t`Initial Collateral`}
                    value={
                      <>
                        <div>
                          {formatTokenAmount(
                            p.position.collateralAmount,
                            p.position.collateralToken.decimals,
                            p.position.collateralToken.symbol,
                            {
                              useCommas: true,
                            }
                          )}{" "}
                          ({formatUsd(p.position.collateralUsd)})
                        </div>
                      </>
                    }
                    showDollar={false}
                  />
                  <br />
                  <StatsTooltipRow
                    label={t`Accrued Borrow Fee`}
                    showDollar={false}
                    value={formatUsd(-p.position.pendingBorrowingFeesUsd) || "..."}
                    textClassName={cx({
                      "text-red-500": p.position.pendingBorrowingFeesUsd !== 0n,
                    })}
                  />
                  <StatsTooltipRow
                    label={t`Accrued Negative Funding Fee`}
                    showDollar={false}
                    value={formatDeltaUsd(-p.position.pendingFundingFeesUsd) || "..."}
                    textClassName={cx({
                      "text-red-500": p.position.pendingFundingFeesUsd !== 0n,
                    })}
                  />
                  <StatsTooltipRow
                    label={t`Accrued Positive Funding Fee`}
                    showDollar={false}
                    value={formatDeltaUsd(p.position.pendingClaimableFundingFeesUsd) || "..."}
                    textClassName={cx({
                      "text-green-500": p.position.pendingClaimableFundingFeesUsd > 0,
                    })}
                  />
                  <br />
                  <StatsTooltipRow
                    showDollar={false}
                    label={t`Current Borrow Fee / Day`}
                    value={formatUsd(-borrowingFeeRateUsd)}
                    textClassName={cx({
                      "text-red-500": borrowingFeeRateUsd > 0,
                    })}
                  />
                  <StatsTooltipRow
                    showDollar={false}
                    label={t`Current Funding Fee / Day`}
                    value={formatDeltaUsd(fundingFeeRateUsd)}
                    textClassName={getPositiveOrNegativeClass(fundingFeeRateUsd)}
                  />
                  <br />
                  <Trans>Use the Edit Collateral icon to deposit or withdraw collateral.</Trans>
                  <br />
                  <br />
                  <Trans>
                    Negative Funding Fees are settled against the collateral automatically and will influence the
                    liquidation price. Positive Funding Fees can be claimed under Claimable Funding after realizing any
                    action on the position.
                  </Trans>
                </>
              );
            }}
          />

          {!p.position.isOpening && !p.hideActions && p.onEditCollateralClick && (
            <span className="edit-icon" onClick={p.onEditCollateralClick} data-qa="position-edit-button">
              <AiOutlineEdit fontSize={16} />
            </span>
          )}
        </div>

        <div className="Exchange-list-info-label Position-collateral-amount muted">
          {`(${formatTokenAmount(
            p.position.remainingCollateralAmount,
            p.position.collateralToken?.decimals,
            p.position.collateralToken?.symbol,
            {
              useCommas: true,
            }
          )})`}
        </div>
      </>
    );
  }

  function renderLiquidationPrice() {
    let liqPriceWarning: string | undefined;
    const estimatedLiquidationHours = getEstimatedLiquidationTimeInHours(p.position, minCollateralUsd);

    if (p.position.liquidationPrice === undefined) {
      if (!p.position.isLong && p.position.collateralAmount >= p.position.sizeInTokens) {
        liqPriceWarning = t`Since your position's Collateral is ${p.position.collateralToken.symbol} with a value larger than the Position Size, the Collateral value will increase to cover any negative PnL.`;
      } else if (
        p.position.isLong &&
        p.position.collateralToken.isStable &&
        p.position.collateralUsd >= p.position.sizeInUsd
      ) {
        liqPriceWarning = t`Since your position's Collateral is ${p.position.collateralToken.symbol} with a value larger than the Position Size, the Collateral value will cover any negative PnL.`;
      }
    }

    const getLiqPriceTooltipContent = () => (
      <>
        {liqPriceWarning && <div>{liqPriceWarning}</div>}
        {estimatedLiquidationHours ? (
          <div>
            <div>
              {!liqPriceWarning && "Liquidation Price is influenced by Fees, Collateral value, and Price Impact."}
            </div>
            <br />
            <StatsTooltipRow
              label={"Estimated time to Liquidation"}
              value={formatEstimatedLiquidationTime(estimatedLiquidationHours)}
              showDollar={false}
            />
            <br />
            <div>
              Estimation based on current Borrow and Funding Fees rates reducing position's Collateral over time,
              excluding any price movement.
            </div>
          </div>
        ) : (
          ""
        )}
      </>
    );

    // if (liqPriceWarning || estimatedLiquidationHours) {
    //   return (
    //     <Tooltip
    //       handle={
    //         formatLiquidationPrice(p.position.liquidationPrice, {
    //           displayDecimals: marketDecimals,
    //         }) || "..."
    //       }
    //       position="bottom-end"
    //       handleClassName={cx({
    //         "LiqPrice-soft-warning": estimatedLiquidationHours && estimatedLiquidationHours < 24 * 7,
    //         "LiqPrice-hard-warning": estimatedLiquidationHours && estimatedLiquidationHours < 24,
    //       })}
    //       renderContent={getLiqPriceTooltipContent}
    //     />
    //   );
    // }

    return (
      <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
        {p.position.liquidationPrice
          ? formatLiquidationPrice(p.position.liquidationPrice, {
              displayDecimals: marketDecimals,
            })?.split(".")[0]
          : "$0"}
        .
        <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
          {p.position.liquidationPrice
            ? formatLiquidationPrice(p.position.liquidationPrice, {
                displayDecimals: marketDecimals,
              })?.split(".")[1]
            : "00"}
        </span>
      </span>
    );
  }

  function renderLarge() {
    const indexName = getMarketIndexName(p.position.marketInfo);
    const poolName = getMarketPoolName(p.position.marketInfo);

    const qaAttr = `position-item-${indexName}-${poolName}-${p.position.isLong ? "Long" : "Short"}`;

    return (
      <tr
        data-qa={qaAttr}
        className={cx("Exchange-list-item", {
          "Exchange-list-item-active": isCurrentMarket,
        })}
      >
        <td className="clickable" data-qa="position-handle" onClick={() => p.onSelectPositionClick?.()}>
          {/* title */}
          {/* <div className="Exchange-list-title">
            <Tooltip
              handle={
                <>
                  <TokenIcon
                    className="PositionList-token-icon"
                    symbol={p.position.marketInfo.indexToken.symbol}
                    displaySize={20}
                    importSize={24}
                  />
                  {p.position.marketInfo.indexToken.symbol}
                </>
              }
              position="bottom-start"
              renderContent={() => (
                <div>
                  <StatsTooltipRow
                    label={t`Market`}
                    value={
                      <div className="flex items-center">
                        <span>{indexName && indexName}</span>
                        <span className="subtext leading-1">{poolName && `[${poolName}]`}</span>
                      </div>
                    }
                    showDollar={false}
                  />

                  <br />

                  <div>
                    <Trans>
                      Click on the Position to select its market, then use the trade box to increase your Position Size,
                      or to set Take-Profit / Stop-Loss Orders.
                    </Trans>
                    <br />
                    <br />
                    <Trans>Use the "Close" button to reduce your Position Size.</Trans>
                  </div>

                  {showDebugValues && (
                    <>
                      <br />
                      <StatsTooltipRow
                        label={"Key"}
                        value={<div className="debug-key muted">{p.position.contractKey}</div>}
                        showDollar={false}
                      />
                    </>
                  )}
                </div>
              )}
            />
            
          </div> */}

          <div className="flex h-full items-start">
            <p className="text-white">{p.position.marketInfo.indexToken.symbol}</p>{" "}
            <span
              style={{ background: p.position.isLong ? "rgba(51, 172, 66, 0.16)" : "rgba(255, 48, 62, 0.16)" }}
              className={cx("mx-12 rounded-12 px-8 py-2", {
                positive: p.position.isLong,
                negative: !p.position.isLong,
              })}
            >
              {p.position.isLong ? t`Long` : t`Short`}
            </span>
            <span
              className="muted Position-leverage rounded-[24px] px-8 py-2"
              style={{ color: "rgba(211, 211, 212, 1)", background: "rgba(36, 36, 41, 1)" }}
            >
              {formatLeverage(p.position.leverage) || "..."}&nbsp;
            </span>
          </div>
          {p.position.pendingUpdate && <ImSpinner2 data-qa="position-loading" className="spin position-loading-icon" />}
        </td>
        <td className="!text-right">
          {/* netValue */}
          {p.position.isOpening ? (
            t`Opening...`
          ) : (
            <>
              {/* {renderNetValue()} */}

              <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                {p.position.netValue ? formatUsd(p.position.netValue, { maxThreshold: null })?.split(".")[0] : "$0"}.
                <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                  {p.position.netValue ? formatUsd(p.position.netValue, { maxThreshold: null })?.split(".")[1] : "00"}
                </span>
              </span>
              {displayedPnl !== undefined && (
                <div
                  onClick={p.openSettings}
                  style={{ fontSize: 12 }}
                  className={cx("Exchange-list-info-label Position-pnl cursor-pointer", {
                    positive: displayedPnl > 0,
                    negative: displayedPnl < 0,
                    muted: displayedPnl == 0n,
                  })}
                >
                  ({formatPercentage(displayedPnlPercentage)})
                </div>
              )}
            </>
          )}
        </td>
        <td className="!text-right">
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
            {p.position.sizeInUsd ? formatUsd(p.position.sizeInUsd, { maxThreshold: null })?.split(".")[0] : "$0"}.
            <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
              {p.position.sizeInUsd ? formatUsd(p.position.sizeInUsd, { maxThreshold: null })?.split(".")[1] : "00"}
            </span>
          </span>
          {/* <PositionItemOrdersLarge positionKey={p.position.key} onOrdersClick={p.onOrdersClick} /> */}
        </td>
        <td className="!text-right">
          {/* collateral */}
          <div>
            {/* {renderCollateral()} */}
            <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
              {p.position.remainingCollateralUsd
                ? formatUsd(p.position.remainingCollateralUsd, { maxThreshold: null })?.split(".")[0]
                : "$0"}
              .
              <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                {p.position.remainingCollateralUsd
                  ? formatUsd(p.position.remainingCollateralUsd, { maxThreshold: null })?.split(".")[1]
                  : "00"}
              </span>
            </span>
            <br />
            <span className="mt-4" style={{ color: "rgba(255, 255, 255, 0.24)" }}>
              {`(${formatTokenAmount(
                p.position.remainingCollateralAmount,
                p.position.collateralToken?.decimals,
                p.position.collateralToken?.symbol,
                {
                  useCommas: true,
                }
              )})`}
            </span>
          </div>
        </td>
        <td className="!text-right">
          {/* entryPrice */}
          {p.position.isOpening ? (
            t`Opening...`
          ) : (
            <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
              {p.position.entryPrice
                ? formatUsd(p.position.entryPrice, {
                    displayDecimals: marketDecimals,
                  })?.split(".")[0]
                : "$0"}
              .
              <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                {p.position.entryPrice
                  ? formatUsd(p.position.entryPrice, {
                      displayDecimals: marketDecimals,
                    })?.split(".")[1]
                  : "00"}
              </span>
            </span>
          )}
        </td>
        <td className="!text-right">
          {/* markPrice */}
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
            {p.position.markPrice
              ? formatUsd(p.position.markPrice, {
                  displayDecimals: marketDecimals,
                })?.split(".")[0]
              : "$0"}
            .
            <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
              {p.position.markPrice
                ? formatUsd(p.position.markPrice, {
                    displayDecimals: marketDecimals,
                  })?.split(".")[1]
                : "00"}
            </span>
          </span>
        </td>
        <td className="!text-right">
          {/* liqPrice */}
          {renderLiquidationPrice()}
        </td>
        <td className="!text-right">
          {/* Close */}
          {!p.position.isOpening && !p.hideActions && (
            <button
              className="Exchange-list-action"
              onClick={p.onClosePositionClick}
              disabled={p.position.sizeInUsd == 0n}
              data-qa="position-close-button"
            >
              <Trans>Close</Trans>
            </button>
          )}
        </td>
        <td>
          {!p.position.isOpening && !p.hideActions && (
            <PositionDropdown
              handleEditCollateral={p.onEditCollateralClick}
              handleMarketSelect={() => p.onSelectPositionClick?.()}
              handleMarketIncreaseSize={() => p.onSelectPositionClick?.(TradeMode.Market)}
              handleShare={p.onShareClick}
              handleLimitIncreaseSize={() => p.onSelectPositionClick?.(TradeMode.Limit)}
              handleTriggerClose={() => p.onSelectPositionClick?.(TradeMode.Trigger)}
            />
          )}
        </td>
      </tr>
    );
  }

  function renderSmall() {
    const indexName = getMarketIndexName(p.position.marketInfo);
    const poolName = getMarketPoolName(p.position.marketInfo);
    return (
      <div
        style={{ borderColor: "#36363D" }}
        className="border-b-[1px] border-dotted p-[16px] last-of-type:border-b-[0]"
        data-qa="position-item"
      >
        <div className="flex flex-grow flex-col">
          <div className="flex-grow">
            <div className="flex items-center">
              <TokenIcon displaySize={16} symbol={getNormalizedTokenSymbol(p.position.marketInfo.indexToken.symbol)} />
              <p className="ml-4 text-[16px] text-white">{p.position.marketInfo.indexToken.symbol}</p>{" "}
              <span
                style={{ background: p.position.isLong ? "rgba(51, 172, 66, 0.16)" : "rgba(255, 48, 62, 0.16)" }}
                className={cx("mx-12 rounded-12 px-8 py-2 text-[14px]", {
                  positive: p.position.isLong,
                  negative: !p.position.isLong,
                })}
              >
                {p.position.isLong ? t`Long` : t`Short`}
              </span>
              <span
                className="muted Position-leverage rounded-[24px] px-8 py-2 text-[14px]"
                style={{ color: "rgba(211, 211, 212, 1)", background: "rgba(36, 36, 41, 1)" }}
              >
                {formatLeverage(p.position.leverage) || "..."}&nbsp;
              </span>
            </div>

            <div className="-gap-2 mt-[16px] grid grid-cols-3">
              <div className="">
                <p
                  className="mb-[4px] text-left text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.24)" }}
                >{t`SIZE`}</p>
                <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                  {p.position.sizeInUsd ? formatUsd(p.position.sizeInUsd, { maxThreshold: null })?.split(".")[0] : "$0"}
                  .
                  <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                    {p.position.sizeInUsd
                      ? formatUsd(p.position.sizeInUsd, { maxThreshold: null })?.split(".")[1]
                      : "00"}
                  </span>
                </span>
              </div>
              <div className="">
                <p
                  className="mb-[4px] text-left text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.24)" }}
                >{t`COLLATERAL`}</p>
                <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                  {p.position.remainingCollateralUsd
                    ? formatUsd(p.position.remainingCollateralUsd, { maxThreshold: null })?.split(".")[0]
                    : "$0"}
                  .
                  <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                    {p.position.remainingCollateralUsd
                      ? formatUsd(p.position.remainingCollateralUsd, { maxThreshold: null })?.split(".")[1]
                      : "00"}
                  </span>
                </span>
                <br />
                <span className="mt-4 text-[12px]" style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                  {`(${formatTokenAmount(
                    p.position.remainingCollateralAmount,
                    p.position.collateralToken?.decimals,
                    p.position.collateralToken?.symbol,
                    {
                      useCommas: true,
                    }
                  )})`}
                </span>
              </div>
              <div className="">
                <p
                  className="mb-[4px] text-left text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.24)" }}
                >{t`NET VAL`}</p>
                <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                  {p.position.netValue ? formatUsd(p.position.netValue, { displayDecimals: 2 })?.split(".")[0] : "$0"}.
                  <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                    {p.position.netValue ? formatUsd(p.position.netValue, { displayDecimals: 2 })?.split(".")[1] : "00"}
                  </span>
                </span>
              </div>
              <div className="pt-[16px]">
                <p
                  className="mb-[4px] text-left text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.24)" }}
                >{t`ENTRY PRICE`}</p>
                {p.position.isOpening ? (
                  <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>{t`Opening...`}</span>
                ) : (
                  <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                    {p.position.entryPrice
                      ? formatUsd(p.position.entryPrice, {
                          displayDecimals: marketDecimals,
                        })?.split(".")[0]
                      : "$0"}
                    .
                    <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                      {p.position.entryPrice
                        ? formatUsd(p.position.entryPrice, {
                            displayDecimals: marketDecimals,
                          })?.split(".")[1]
                        : "00"}
                    </span>
                  </span>
                )}
              </div>
              <div className="pt-[16px]">
                <p
                  className="mb-[4px] text-left text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.24)" }}
                >{t`MARK PRICE`}</p>
                <span className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                  {p.position.markPrice
                    ? formatUsd(p.position.markPrice, {
                        displayDecimals: marketDecimals,
                      })?.split(".")[0]
                    : "$0"}
                  .
                  <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                    {p.position.markPrice
                      ? formatUsd(p.position.markPrice, {
                          displayDecimals: marketDecimals,
                        })?.split(".")[1]
                      : "00"}
                  </span>
                </span>
              </div>
              <div className="pt-[16px]">
                <p
                  className="mb-[4px] text-left text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.24)" }}
                >{t`LIQ. PRICE `}</p>
                <span className="text-[12px]">{renderLiquidationPrice()}</span>
              </div>
            </div>

            {/* <div className="App-card-divider" />
            <div className="App-card-content">
              {showDebugValues && (
                <div className="App-card-row">
                  <div className="label">Key</div>
                  <div className="debug-key muted">{p.position.contractKey}</div>
                </div>
              )}
              <div className="App-card-row">
                <div className="label">
                  <Trans>Market</Trans>
                </div>
                <div onClick={() => p.onSelectPositionClick?.()}>
                  <div className="flex items-start">
                    <span>{indexName && indexName}</span>
                    <span className="subtext">{poolName && `[${poolName}]`}</span>
                  </div>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Net Value</Trans>
                </div>
                <div>{renderNetValue()}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>PnL</Trans>
                </div>
                <div>
                  <span
                    className={cx("Exchange-list-info-label Position-pnl cursor-pointer", {
                      positive: displayedPnl > 0,
                      negative: displayedPnl < 0,
                      muted: displayedPnl == 0n,
                    })}
                    onClick={p.openSettings}
                  >
                    {formatDeltaUsd(displayedPnl, displayedPnlPercentage)}
                  </span>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Size</Trans>
                </div>
                <div>{formatUsd(p.position.sizeInUsd)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Collateral</Trans>
                </div>
                <div>{renderCollateral()}</div>
              </div>
            </div>
            <div className="App-card-divider" />
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Entry Price</Trans>
                </div>
                <div>
                  {formatUsd(p.position.entryPrice, {
                    displayDecimals: marketDecimals,
                  })}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Mark Price</Trans>
                </div>
                <div>
                  {formatUsd(p.position.markPrice, {
                    displayDecimals: marketDecimals,
                  })}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Liq. Price</Trans>
                </div>
                <div>{renderLiquidationPrice()}</div>
              </div>
            </div>
            <div className="App-card-divider" />
            <div className="flex flex-wrap gap-15">
              <div className="label">
                <Trans>Orders</Trans>
              </div>
              <div className="flex-grow">
                <PositionItemOrdersSmall positionKey={p.position.key} onOrdersClick={p.onOrdersClick} />
              </div>
            </div> */}
          </div>
          {/* {!p.hideActions && (
            <footer>
              <div className="App-card-divider" />
              <div className="Position-item-action">
                <div className="Position-item-buttons">
                  <Button variant="secondary" disabled={p.position.sizeInUsd == 0n} onClick={p.onClosePositionClick}>
                    <Trans>Close</Trans>
                  </Button>
                  <Button variant="secondary" disabled={p.position.sizeInUsd == 0n} onClick={p.onEditCollateralClick}>
                    <Trans>Edit Collateral</Trans>
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={p.position.sizeInUsd == 0n}
                    onClick={() => {
                      // TODO: remove after adding trigger functionality to Modal
                      window.scrollTo({ top: isMobile ? 500 : 0 });
                      p.onSelectPositionClick?.(TradeMode.Trigger);
                    }}
                  >
                    <Trans>TP/SL</Trans>
                  </Button>
                </div>
                <div>
                  {!p.position.isOpening && !p.hideActions && (
                    <PositionDropdown
                      handleMarketSelect={() => p.onSelectPositionClick?.()}
                      handleMarketIncreaseSize={() => p.onSelectPositionClick?.(TradeMode.Market)}
                      handleShare={p.onShareClick}
                      handleLimitIncreaseSize={() => p.onSelectPositionClick?.(TradeMode.Limit)}
                    />
                  )}
                </div>
              </div>
            </footer>
          )} */}
        </div>
      </div>
    );
  }

  return p.isLarge ? renderLarge() : renderSmall();
}

function PositionItemOrdersSmall({
  positionKey,
  onOrdersClick,
}: {
  positionKey: string;
  onOrdersClick?: (key?: string) => void;
}) {
  const ordersWithErrors = usePositionOrdersWithErrors(positionKey);

  if (ordersWithErrors.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {ordersWithErrors.map((params) => (
        <PositionItemOrder key={params.order.key} onOrdersClick={onOrdersClick} {...params} />
      ))}
    </div>
  );
}

function PositionItemOrdersLarge({
  positionKey,
  onOrdersClick,
}: {
  isSmall?: boolean;
  positionKey: string;
  onOrdersClick?: (key?: string) => void;
}) {
  const ordersWithErrors = usePositionOrdersWithErrors(positionKey);

  const [ordersErrorList, ordersWarningsList] = useMemo(() => {
    const ordersErrorList = ordersWithErrors.filter(({ orderErrors }) => orderErrors.level === "error");
    const ordersWarningsList = ordersWithErrors.filter(({ orderErrors }) => orderErrors.level === "warning");
    return [ordersErrorList, ordersWarningsList];
  }, [ordersWithErrors]);

  if (ordersWithErrors.length === 0) return null;

  return (
    <div>
      <Tooltip
        className="Position-list-active-orders"
        handle={
          <Trans>
            Orders{" "}
            <span
              className={cx({
                "text-red-500": ordersErrorList.length > 0,
                "text-yellow-500": !ordersErrorList.length && ordersWarningsList.length > 0,
              })}
            >
              ({ordersWithErrors.length})
            </span>
          </Trans>
        }
        position="bottom-start"
        handleClassName={cx([
          "Exchange-list-info-label",
          "Exchange-position-list-orders",
          "clickable",
          "text-gray-300",
        ])}
        maxAllowedWidth={370}
        tooltipClassName="!z-10 w-[370px]"
        content={
          <div className="flex max-h-[350px] cursor-auto flex-col gap-8 overflow-y-auto leading-base">
            <div className="font-bold">
              <Trans>Active Orders</Trans>
            </div>
            {ordersWithErrors.map((params) => (
              <PositionItemOrder key={params.order.key} onOrdersClick={onOrdersClick} {...params} />
            ))}
          </div>
        }
      />
    </div>
  );
}

function PositionItemOrder({
  order,
  orderErrors,
  onOrdersClick,
}: {
  order: PositionOrderInfo;
  orderErrors: OrderErrors;
  onOrdersClick?: (key?: string) => void;
}) {
  const [, setEditingOrderKey] = useEditingOrderKeyState();
  const [isCancelling, cancel] = useCancelOrder(order.key);
  const handleOrdersClick = useCallback(() => {
    onOrdersClick?.(order.key);
  }, [onOrdersClick, order.key]);

  const errors = orderErrors.errors;

  const handleEditClick = useCallback(() => {
    setEditingOrderKey(order.key);
  }, [order.key, setEditingOrderKey]);

  return (
    <div key={order.key}>
      <div className="flex items-start justify-between gap-6">
        <Button
          variant="secondary"
          className="!block w-full !bg-slate-100 !bg-opacity-15 !p-6 hover:!bg-opacity-20 active:!bg-opacity-25"
          onClick={handleOrdersClick}
        >
          <div className="flex items-center justify-between">
            <PositionItemOrderText order={order} />
            <FaAngleRight fontSize={16} className="ml-5" />
          </div>
        </Button>
        <Button
          variant="secondary"
          className="!bg-slate-100 !bg-opacity-15 !p-6 hover:!bg-opacity-20 active:!bg-opacity-25"
          onClick={handleEditClick}
        >
          <AiOutlineEdit fontSize={16} />
        </Button>
        <Button
          variant="secondary"
          className="!bg-slate-100 !bg-opacity-15 !p-6 hover:!bg-opacity-20 active:!bg-opacity-25"
          disabled={isCancelling}
          onClick={cancel}
        >
          <MdClose fontSize={16} />
        </Button>
      </div>

      {errors.length !== 0 && (
        <div className="mt-8 flex flex-col gap-8 text-start">
          {errors.map((err) => (
            <div
              key={err.key}
              className={cx("hyphens-auto [overflow-wrap:anywhere]", {
                "text-red-500": err.level === "error",
                "text-yellow-500": err.level === "warning",
              })}
            >
              {err.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PositionItemOrderText({ order }: { order: PositionOrderInfo }) {
  const triggerThresholdType = getTriggerThresholdType(order.orderType, order.isLong);
  const isIncrease = isIncreaseOrderType(order.orderType);

  return (
    <div key={order.key} className="text-start">
      {isDecreaseOrderType(order.orderType) ? getTriggerNameByOrderType(order.orderType, true) : t`Limit`}:{" "}
      {triggerThresholdType}{" "}
      {formatUsd(order.triggerPrice, {
        displayDecimals: order.indexToken?.priceDecimals,
      })}
      :{" "}
      <span>
        {isIncrease ? "+" : "-"}
        {formatUsd(order.sizeDeltaUsd)}
      </span>
    </div>
  );
}
