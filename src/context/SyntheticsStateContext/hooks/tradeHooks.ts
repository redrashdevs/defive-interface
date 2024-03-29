import { TradeMode, TradeType } from "domain/synthetics/trade";
import { BigNumber } from "ethers";
import { useMemo } from "react";
import {
  TokenTypeForSwapRoute,
  createTradeFlags,
  makeSelectNextPositionValuesForIncrease,
  makeSelectSwapRoutes,
} from "../selectors/tradeSelectors";
import { useSelector } from "../utils";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";

export const useNextPositionValuesForIncrease = ({
  collateralTokenAddress,
  fixedAcceptablePriceImpactBps,
  initialCollateralTokenAddress,
  initialCollateralAmount,
  leverage,
  marketAddress,
  positionKey,
  strategy,
  indexTokenAddress,
  indexTokenAmount,
  tradeMode,
  tradeType,
  triggerPrice,
  tokenTypeForSwapRoute,
  overrideIsPnlInLeverage,
}: {
  initialCollateralTokenAddress: string | undefined;
  indexTokenAddress: string | undefined;
  positionKey: string | undefined;
  tradeMode: TradeMode;
  tradeType: TradeType;
  collateralTokenAddress: string | undefined;
  marketAddress: string | undefined;
  initialCollateralAmount: BigNumber;
  indexTokenAmount: BigNumber | undefined;
  leverage: BigNumber | undefined;
  triggerPrice: BigNumber | undefined;
  fixedAcceptablePriceImpactBps: BigNumber | undefined;
  strategy: "leverageByCollateral" | "leverageBySize" | "independent";
  tokenTypeForSwapRoute: TokenTypeForSwapRoute;
  overrideIsPnlInLeverage?: boolean;
}) => {
  const { isPnlInLeverage } = useSettings();
  const selector = useMemo(
    () =>
      makeSelectNextPositionValuesForIncrease({
        collateralTokenAddress,
        fixedAcceptablePriceImpactBps,
        initialCollateralTokenAddress,
        initialCollateralAmount,
        leverage,
        marketAddress,
        positionKey,
        increaseStrategy: strategy,
        indexTokenAddress,
        indexTokenAmount,
        tradeMode,
        tradeType,
        triggerPrice,
        tokenTypeForSwapRoute,
        isPnlInLeverage: overrideIsPnlInLeverage ?? isPnlInLeverage,
      }),
    [
      collateralTokenAddress,
      fixedAcceptablePriceImpactBps,
      indexTokenAddress,
      indexTokenAmount,
      initialCollateralAmount,
      initialCollateralTokenAddress,
      isPnlInLeverage,
      leverage,
      marketAddress,
      overrideIsPnlInLeverage,
      positionKey,
      strategy,
      tokenTypeForSwapRoute,
      tradeMode,
      tradeType,
      triggerPrice,
    ]
  );
  return useSelector(selector);
};

export const useSwapRoutes = (fromTokenAddress: string | undefined, toTokenAddress: string | undefined) => {
  const selector = useMemo(
    () => makeSelectSwapRoutes(fromTokenAddress, toTokenAddress),
    [fromTokenAddress, toTokenAddress]
  );
  return useSelector(selector);
};

export const useTradeFlags = ({ tradeType, tradeMode }: { tradeType: TradeType; tradeMode: TradeMode }) => {
  return useMemo(() => createTradeFlags(tradeType, tradeMode), [tradeType, tradeMode]);
};
