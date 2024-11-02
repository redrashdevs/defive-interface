import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import { useCallback, useMemo } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { MdClose } from "react-icons/md";

import { getWrappedToken } from "config/tokens";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { useEditingOrderKeyState } from "context/SyntheticsStateContext/hooks/orderEditorHooks";
import { useOrderErrors } from "context/SyntheticsStateContext/hooks/orderHooks";
import { selectChainId, selectMarketsInfoData } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets";
import {
  OrderInfo,
  OrderType,
  PositionOrderInfo,
  SwapOrderInfo,
  isDecreaseOrderType,
  isIncreaseOrderType,
  isLimitIncreaseOrderType,
  isLimitOrderType,
  isLimitSwapOrderType,
} from "domain/synthetics/orders";
import { PositionsInfoData, getTriggerNameByOrderType } from "domain/synthetics/positions";
import { adaptToV1TokenInfo, convertToTokenAmount, convertToUsd } from "domain/synthetics/tokens";
import { getMarkPrice } from "domain/synthetics/trade";
import { getExchangeRate, getExchangeRateDisplay } from "lib/legacy";
import { USD_DECIMALS } from "config/factors";
import { calculatePriceDecimals, formatAmount, formatTokenAmount, formatUsd } from "lib/numbers";
import { getSwapPathMarketFullNames, getSwapPathTokenSymbols } from "../TradeHistory/TradeHistoryRow/utils/swap";

import Button from "components/Button/Button";
import Checkbox from "components/Checkbox/Checkbox";
import { MarketWithDirectionLabel } from "components/MarketWithDirectionLabel/MarketWithDirectionLabel";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import TokenIcon from "components/TokenIcon/TokenIcon";
import Tooltip from "components/Tooltip/Tooltip";
import { SwapMarketLabel } from "../../SwapMarketLabel/SwapMarketLabel";
import { ExchangeTd, ExchangeTr } from "../OrderList/ExchangeTable";

import { makeSelectMarketPriceDecimals } from "context/SyntheticsStateContext/selectors/statsSelectors";
import "./OrderItem.scss";

type Props = {
  order: OrderInfo;
  onToggleOrder?: () => void;
  onCancelOrder?: () => void;
  isSelected?: boolean;
  isCanceling?: boolean;
  hideActions?: boolean;
  isLarge: boolean;
  positionsInfoData?: PositionsInfoData;
  setRef?: (el: HTMLElement | null, orderKey: string) => void;
};

export function OrderItem(p: Props) {
  const { showDebugValues } = useSettings();

  const [, setEditingOrderKeyWithArg] = useEditingOrderKeyState();

  const setEditingOrderKey = useCallback(() => {
    setEditingOrderKeyWithArg(p.order.key);
  }, [p.order.key, setEditingOrderKeyWithArg]);

  return p.isLarge ? (
    <OrderItemLarge
      order={p.order}
      hideActions={p.hideActions}
      showDebugValues={showDebugValues}
      onToggleOrder={p.onToggleOrder}
      setEditingOrderKey={setEditingOrderKey}
      onCancelOrder={p.onCancelOrder}
      isCanceling={p.isCanceling}
      isSelected={p.isSelected}
      setRef={p.setRef}
    />
  ) : (
    <OrderItemSmall
      order={p.order}
      showDebugValues={showDebugValues}
      hideActions={p.hideActions}
      onCancelOrder={p.onCancelOrder}
      setEditingOrderKey={setEditingOrderKey}
      isSelected={p.isSelected}
      onToggleOrder={p.onToggleOrder}
      setRef={p.setRef}
    />
  );
}

function Title({ order, showDebugValues }: { order: OrderInfo; showDebugValues: boolean | undefined }) {
  const chainId = useSelector(selectChainId);

  if (isLimitSwapOrderType(order.orderType)) {
    if (showDebugValues) {
      return (
        <Tooltip
          disableHandleStyle
          handle={<TitleWithIcon bordered order={order} />}
          position="bottom-start"
          handleClassName="no-underline"
          content={
            <>
              <StatsTooltipRow
                label={"Key"}
                value={<div className="debug-key muted">{order.key}</div>}
                showDollar={false}
              />
              <StatsTooltipRow
                label={"Amount"}
                value={<div className="debug-key muted">{order.minOutputAmount.toString()}</div>}
                showDollar={false}
              />
            </>
          }
        />
      );
    }

    return <TitleWithIcon order={order} />;
  }

  const positionOrder = order as PositionOrderInfo;
  const isCollateralSwap =
    positionOrder.shouldUnwrapNativeToken ||
    positionOrder.initialCollateralToken.address !== positionOrder.targetCollateralToken.address;

  const wrappedToken = getWrappedToken(chainId);

  function getCollateralText() {
    const collateralUsd = convertToUsd(
      positionOrder.initialCollateralDeltaAmount,
      positionOrder.initialCollateralToken.decimals,
      positionOrder.initialCollateralToken.prices.minPrice
    );

    const targetCollateralAmount = convertToTokenAmount(
      collateralUsd,
      positionOrder.targetCollateralToken.decimals,
      positionOrder.targetCollateralToken.prices.minPrice
    );

    const tokenAmountText = formatTokenAmount(
      targetCollateralAmount,
      positionOrder.targetCollateralToken?.decimals,
      positionOrder.targetCollateralToken.isNative ? wrappedToken.symbol : positionOrder.targetCollateralToken.symbol
    );

    return `${tokenAmountText}`;
  }

  return (
    <Tooltip
      disableHandleStyle
      handle={<TitleWithIcon bordered order={order} />}
      handleClassName="no-underline"
      position="bottom-start"
      content={
        <>
          <StatsTooltipRow label={t`Collateral`} value={getCollateralText()} showDollar={false} />

          {isCollateralSwap && (
            <div className="OrderItem-tooltip-row">
              <Trans>
                {formatTokenAmount(
                  positionOrder.initialCollateralDeltaAmount,
                  positionOrder.initialCollateralToken.decimals,
                  positionOrder.initialCollateralToken[positionOrder.shouldUnwrapNativeToken ? "baseSymbol" : "symbol"]
                )}{" "}
                will be swapped to{" "}
                {positionOrder.targetCollateralToken.isNative
                  ? wrappedToken.symbol
                  : positionOrder.targetCollateralToken.symbol}{" "}
                on order execution.
              </Trans>
            </div>
          )}

          {showDebugValues && (
            <div className="OrderItem-tooltip-row">
              <StatsTooltipRow
                label={"Key"}
                value={<div className="debug-key muted">{positionOrder.key}</div>}
                showDollar={false}
              />
            </div>
          )}
        </>
      }
    />
  );
}

export function TitleWithIcon({ order, bordered }: { order: OrderInfo; bordered?: boolean }) {
  if (isLimitSwapOrderType(order.orderType)) {
    const { initialCollateralToken, targetCollateralToken, minOutputAmount, initialCollateralDeltaAmount } = order;

    const fromTokenText = formatTokenAmount(initialCollateralDeltaAmount, initialCollateralToken.decimals, "");
    const fromTokenIcon = <TokenIcon symbol={initialCollateralToken.symbol} displaySize={18} importSize={24} />;

    const toTokenText = formatTokenAmount(minOutputAmount, targetCollateralToken.decimals, "");
    const toTokenIcon = <TokenIcon symbol={targetCollateralToken.symbol} displaySize={18} importSize={24} />;

    return (
      <div
        className={cx(
          "inline-flex flex-wrap gap-y-8 whitespace-pre-wrap text-[12px] font-[500] text-white opacity-60",
          {
            // "cursor-help *:border-b *:border-dashed *:border-b-gray-400": bordered,
          }
        )}
      >
        <Trans>
          <span>{fromTokenText} </span>
          {fromTokenIcon}
          <span> to </span>
          <span>{toTokenText} </span>
          {toTokenIcon}
        </Trans>
      </div>
    );
  }

  const { sizeDeltaUsd } = order;
  const sizeText = formatUsd(sizeDeltaUsd * (isLimitIncreaseOrderType(order.orderType) ? 1n : -1n), {
    displayPlus: true,
  });

  return <span className={cx(" text-[12px] font-[500] text-white opacity-60", {})}>{sizeText}</span>;
}

function MarkPrice({ order }: { order: OrderInfo }) {
  const markPrice = useMemo(() => {
    if (isLimitSwapOrderType(order.orderType)) {
      return undefined;
    }

    const positionOrder = order as PositionOrderInfo;

    return getMarkPrice({
      prices: positionOrder.indexToken.prices,
      isIncrease: isIncreaseOrderType(positionOrder.orderType),
      isLong: positionOrder.isLong,
    });
  }, [order]);

  const positionOrder = order as PositionOrderInfo;
  const priceDecimals = useSelector(makeSelectMarketPriceDecimals(positionOrder.marketInfo?.indexTokenAddress));

  const markPriceFormatted = useMemo(() => {
    return formatUsd(markPrice, { displayDecimals: priceDecimals });
  }, [markPrice, priceDecimals]);

  if (isLimitSwapOrderType(order.orderType)) {
    const { markSwapRatioText } = getSwapRatioText(order);

    return markSwapRatioText;
  } else {
    const positionOrder = order as PositionOrderInfo;

    return (
      <Tooltip
        handle={markPriceFormatted}
        handleClassName="text-right text-[12px] font-[500] text-white !no-underline opacity-60"
        position="bottom-end"
        renderContent={() => {
          return (
            <Trans>
              <p>
                The order will be executed when the oracle price is {positionOrder.triggerThresholdType}{" "}
                {formatUsd(positionOrder.triggerPrice, { displayDecimals: priceDecimals })}.
              </p>
              <br />
              <p>
                Note that there may be rare cases where the order cannot be executed, for example, if the chain is down
                and no oracle reports are produced or if the price impact exceeds your acceptable price.
              </p>
            </Trans>
          );
        }}
      />
    );
  }
}

function TriggerPrice({ order, hideActions }: { order: OrderInfo; hideActions: boolean | undefined }) {
  if (isLimitSwapOrderType(order.orderType)) {
    const swapOrder = order as SwapOrderInfo;
    const toAmount = swapOrder.minOutputAmount;
    const toToken = order.targetCollateralToken;
    const toAmountText = formatTokenAmount(toAmount, toToken?.decimals, toToken?.symbol);
    const { swapRatioText } = getSwapRatioText(order);

    return (
      <>
        {!hideActions ? (
          <Tooltip
            position="bottom-end"
            handleClassName="!text-right"
            handle={swapRatioText}
            renderContent={() =>
              t`You will receive at least ${toAmountText} if this order is executed. This price is being updated in real time based on swap fees and price impact.`
            }
          />
        ) : (
          swapRatioText
        )}
      </>
    );
  } else {
    const positionOrder = order as PositionOrderInfo;
    const priceDecimals =
      calculatePriceDecimals(positionOrder?.indexToken?.prices?.minPrice) || positionOrder?.indexToken?.priceDecimals;
    return (
      <Tooltip
        handle={
          <span className="!text-right text-[12px] font-[500] text-white no-underline opacity-60">{`${positionOrder.triggerThresholdType} ${formatUsd(
            positionOrder.triggerPrice,
            {
              displayDecimals: priceDecimals,
            }
          )}`}</span>
        }
        handleClassName="!no-underline"
        position="bottom-end"
        renderContent={() => (
          <>
            <StatsTooltipRow
              label={t`Acceptable Price`}
              value={
                positionOrder.orderType === OrderType.StopLossDecrease
                  ? "NA"
                  : `${positionOrder.triggerThresholdType} ${formatUsd(positionOrder.acceptablePrice, {
                      displayDecimals: priceDecimals,
                    })}`
              }
              showDollar={false}
            />
          </>
        )}
      />
    );
  }
}

function OrderItemLarge({
  order,
  setRef,
  hideActions,
  onToggleOrder,
  showDebugValues,
  setEditingOrderKey,
  onCancelOrder,
  isCanceling,
  isSelected,
}: {
  order: OrderInfo;
  setRef?: (el: HTMLElement | null, orderKey: string) => void;
  hideActions: boolean | undefined;
  showDebugValues: boolean | undefined;
  onToggleOrder: undefined | (() => void);
  setEditingOrderKey: undefined | (() => void);
  onCancelOrder: undefined | (() => void);
  isCanceling: boolean | undefined;
  isSelected: boolean | undefined;
}) {
  const marketInfoData = useSelector(selectMarketsInfoData);
  const isSwap = isLimitSwapOrderType(order.orderType);
  const { indexName, poolName, tokenSymbol } = useMemo(() => {
    const marketInfo = marketInfoData?.[order.marketAddress];

    if (!marketInfo || isSwap)
      return {
        indexName: "...",
        tokenSymbol: "...",
      };
    return {
      indexName: getMarketIndexName(marketInfo),
      poolName: getMarketPoolName(marketInfo),
      tokenSymbol: marketInfo.indexToken.symbol,
    };
  }, [isSwap, marketInfoData, order.marketAddress]);

  const { swapPathTokenSymbols, swapPathMarketFullNames } = useMemo(() => {
    if (!isSwap) return {};
    const swapPathTokenSymbols = getSwapPathTokenSymbols(marketInfoData, order.initialCollateralToken, order.swapPath);
    const swapPathMarketFullNames = getSwapPathMarketFullNames(marketInfoData, order.swapPath);
    return { swapPathTokenSymbols, swapPathMarketFullNames };
  }, [isSwap, marketInfoData, order.initialCollateralToken, order.swapPath]);

  const handleSetRef = useCallback(
    (el: HTMLElement | null) => {
      setRef && setRef(el, order.key);
    },
    [order.key, setRef]
  );

  return (
    <ExchangeTr ref={handleSetRef}>
      {!hideActions && onToggleOrder && (
        <ExchangeTd className="cursor-pointer" onClick={onToggleOrder}>
          <Checkbox isChecked={isSelected} setIsChecked={onToggleOrder} />
        </ExchangeTd>
      )}
      <ExchangeTd>
        {isSwap ? (
          <Tooltip
            handle={
              <span
                className={cx("text-left text-[12px] font-[500] text-white", {
                  // "cursor-help border-b border-dashed border-b-gray-400": bordered,
                })}
              >
                {swapPathTokenSymbols?.at(0) ? (
                  <TokenIcon
                    symbol={swapPathTokenSymbols?.at(0)!}
                    displaySize={20}
                    className="relative z-10  h-[16px] w-[16px]"
                  />
                ) : (
                  "..."
                )}
                {swapPathTokenSymbols?.at(-1) ? (
                  <TokenIcon
                    symbol={swapPathTokenSymbols?.at(-1)!}
                    displaySize={20}
                    className="-ml-10 mr-5 h-[16px] w-[16px]"
                  />
                ) : (
                  "..."
                )}
                {swapPathTokenSymbols?.at(0)}/{swapPathTokenSymbols?.at(-1)}
                <span
                  className="ml-4 rounded-[12px] px-8 py-2 text-[12px] text-[#FFCA11]"
                  style={{ background: "rgba(255, 202, 17, 0.16)" }}
                >
                  <Trans>Long</Trans>
                </span>
              </span>
            }
            content={
              <>
                {swapPathMarketFullNames?.map((market, index) => (
                  <span key={market.indexName}>
                    {index > 0 && " → "}
                    <span>{market.indexName}</span>
                    <span className="subtext leading-1">[{market.poolName}]</span>
                  </span>
                ))}
              </>
            }
            disableHandleStyle
          />
        ) : (
          <Tooltip
            handle={
              <div className={cx("inline text-[12px] font-[500] leading-base text-white", {})}>
                {/* <span className={cx(isLong ? "text-green-500" : "text-red-500")}>{isLong ? t`Long` : t`Short`}</span> */}
                <TokenIcon className="mr-5 h-[16px] w-[16px]" displaySize={20} symbol={tokenSymbol} importSize={40} />
                <span>{indexName}</span>
                {order.isLong ? (
                  <span
                    className="positive ml-4 rounded-[12px] px-8 py-2 text-[12px]"
                    style={{ background: "rgba(51, 172, 66, 0.16)" }}
                  >
                    <Trans>Long</Trans>
                  </span>
                ) : (
                  <span
                    className="negative ml-4 rounded-[12px] px-8 py-2 text-[12px]"
                    style={{ background: "rgba(255, 48, 62, 0.32)" }}
                  >
                    <Trans>Short</Trans>
                  </span>
                )}
              </div>
            }
            content={
              <StatsTooltipRow
                label={t`Market`}
                value={
                  <div className="flex items-center">
                    <span>{indexName && indexName}</span>
                    <span className="">{poolName && `[${poolName}]`}</span>
                  </div>
                }
                showDollar={false}
              />
            }
            disableHandleStyle
          />
        )}
      </ExchangeTd>
      <ExchangeTd>
        <OrderItemTypeLabel order={order} />
      </ExchangeTd>
      <ExchangeTd className="text-right">
        <Title order={order} showDebugValues={showDebugValues} />
      </ExchangeTd>

      <ExchangeTd className="text-right">
        <TriggerPrice order={order} hideActions={hideActions} />
      </ExchangeTd>
      <ExchangeTd>
        <MarkPrice order={order} />
      </ExchangeTd>
      {!hideActions && (
        <ExchangeTd>
          <div className="flex items-center">
            <button className="cursor-pointer p-6 text-gray-300 hover:text-white" onClick={setEditingOrderKey}>
              <AiOutlineEdit title={t`Edit order`} fontSize={16} />
            </button>
            {onCancelOrder && (
              <button
                className="cursor-pointer p-6 text-gray-300 hover:text-white disabled:cursor-wait"
                disabled={isCanceling}
                onClick={onCancelOrder}
              >
                <MdClose title={t`Close order`} fontSize={16} />
              </button>
            )}
          </div>
        </ExchangeTd>
      )}
    </ExchangeTr>
  );
}

function OrderItemSmall({
  showDebugValues,
  order,
  setEditingOrderKey,
  onCancelOrder,
  hideActions,
  isSelected,
  onToggleOrder,
  setRef,
}: {
  showDebugValues: boolean;
  order: OrderInfo;
  hideActions: boolean | undefined;
  setEditingOrderKey: undefined | (() => void);
  onCancelOrder: undefined | (() => void);
  isSelected: boolean | undefined;
  onToggleOrder: undefined | (() => void);
  setRef?: (el: HTMLElement | null, orderKey: string) => void;
}) {
  const marketInfoData = useSelector(selectMarketsInfoData);

  const title = useMemo(() => {
    if (isLimitSwapOrderType(order.orderType)) {
      const swapPathTokenSymbols = getSwapPathTokenSymbols(
        marketInfoData,
        order.initialCollateralToken,
        order.swapPath
      );

      return <SwapMarketLabel fromSymbol={swapPathTokenSymbols?.at(0)} toSymbol={swapPathTokenSymbols?.at(-1)} />;
    }

    const marketInfo = marketInfoData?.[order.marketAddress];

    if (!marketInfo) {
      return "...";
    }

    const indexName = getMarketIndexName(marketInfo);

    const tokenSymbol = marketInfoData?.[order.marketAddress]?.indexToken.symbol;

    return <MarketWithDirectionLabel isLong={order.isLong} indexName={indexName} tokenSymbol={tokenSymbol} />;
  }, [
    marketInfoData,
    order.initialCollateralToken,
    order.isLong,
    order.marketAddress,
    order.orderType,
    order.swapPath,
  ]);

  const handleSetRef = useCallback(
    (el: HTMLElement | null) => {
      setRef && setRef(el, order.key);
    },
    [order.key, setRef]
  );

  return (
    <div style={{borderBottom: '1px dotted #36363D'}} className="w-full px-16 py-16 last-of-type:!border-0" ref={handleSetRef}>
      <div>
        <div className="flex cursor-pointer items-center" onClick={onToggleOrder}>
          {title}
          {order.isLong ? (
            <span
              className="positive mx-6 rounded-[12px] px-8 py-2 text-[12px]"
              style={{ background: "rgba(51, 172, 66, 0.16)" }}
            >
              <Trans>Long</Trans>
            </span>
          ) : (
            <span
              className="negative mx-6 rounded-[12px] px-8 py-2 text-[12px]"
              style={{ background: "rgba(255, 48, 62, 0.32)" }}
            >
              <Trans>Short</Trans>
            </span>
          )}
          {isLimitSwapOrderType(order.orderType) ? (
            <span
              className="mx-6 rounded-[12px] px-8 py-2 text-[12px] text-[#FFCA11]"
              style={{ background: "rgba(255, 202, 17, 0.16)" }}
            >
              <Trans>Long</Trans>
            </span>
          ) : null}
          <OrderItemTypeLabel isSmall order={order} />
        </div>
        <div className="mt-16 grid grid-cols-3 gap-4">
          <div>
            <p className="font-500 text-[10px] text-white opacity-30">
              <Trans>Size</Trans>
            </p>
            <Title order={order} showDebugValues={showDebugValues} />
          </div>
          <div>
            <p className="font-500 text-[10px] text-white opacity-30">
              <Trans>Trigger Price</Trans>
            </p>
            <TriggerPrice order={order} hideActions={hideActions} />
          </div>
          <div>
            <p className="font-500 text-[10px] text-white opacity-30">
              <Trans>Mark Price</Trans>
            </p>
            <MarkPrice order={order} />
          </div>
        </div>
      </div>
      {!hideActions && (
        <div className="App-card-actions">
          <div className="App-card-divider"></div>
          <div className="remove-top-margin">
            <Button variant="secondary" className="mr-15 mt-15" onClick={setEditingOrderKey}>
              <Trans>Edit</Trans>
            </Button>

            {onCancelOrder && (
              <Button variant="secondary" className="mt-15" onClick={onCancelOrder}>
                <Trans>Cancel</Trans>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getSwapRatioText(order: OrderInfo) {
  if (!isLimitOrderType(order.orderType)) return {};

  const fromToken = order.initialCollateralToken;
  const toToken = order.targetCollateralToken;

  const fromTokenInfo = fromToken ? adaptToV1TokenInfo(fromToken) : undefined;
  const toTokenInfo = toToken ? adaptToV1TokenInfo(toToken) : undefined;

  const triggerRatio = (order as SwapOrderInfo).triggerRatio;

  const markExchangeRate =
    fromToken && toToken
      ? getExchangeRate(adaptToV1TokenInfo(fromToken), adaptToV1TokenInfo(toToken), false)
      : undefined;

  const ratioDecimals = calculatePriceDecimals(triggerRatio?.ratio);
  const swapRatioText = `${formatAmount(
    triggerRatio?.ratio,
    USD_DECIMALS,
    ratioDecimals,
    true
  )} ${triggerRatio?.smallestToken.symbol} / ${triggerRatio?.largestToken.symbol}`;

  const markSwapRatioText = getExchangeRateDisplay(markExchangeRate, fromTokenInfo, toTokenInfo);

  return { swapRatioText, markSwapRatioText };
}

function OrderItemTypeLabel({ order, isSmall }: { order: OrderInfo; isSmall?: boolean }) {
  const { errors, level } = useOrderErrors(order.key);

  const handle = isDecreaseOrderType(order.orderType) ? getTriggerNameByOrderType(order.orderType) : t`Limit`;

  if (errors.length === 0) {
    return (
      <span className={cx(" rounded-[12px] bg-[#242429] px-12 py-4 text-[12px] font-[500] text-white")}>{handle}</span>
    );
  }

  return (
    <Tooltip
      disableHandleStyle
      handle={
        <span className={cx("cursor-help rounded-[12px] bg-[#242429] px-12 py-4 text-[12px] font-[500] text-white")}>
          {handle}
        </span>
      }
      content={
        errors.length ? (
          <>
            {errors.map((error) => (
              <div key={error.key}>
                <span
                  className={cx({
                    "text-red-500": error!.level === "error",
                    "text-yellow-500": error!.level === "warning",
                  })}
                >
                  {error.msg}
                </span>
              </div>
            ))}
          </>
        ) : null
      }
    />
  );
}
