import { t } from "@lingui/macro";
import { useCallback, useState } from "react";

import { HIGH_PRICE_IMPACT_BPS } from "config/factors";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { useMarketsInfoData, useTokensData, useUiFeeFactor } from "context/SyntheticsStateContext/hooks/globalsHooks";
import {
  selectChainId,
  selectGasLimits,
  selectGasPrice,
} from "context/SyntheticsStateContext/selectors/globalSelectors";
import { selectShiftAvailableMarkets } from "context/SyntheticsStateContext/selectors/shiftSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { MarketInfo, getMarketIndexName } from "domain/synthetics/markets";
import { useMarketTokensData } from "domain/synthetics/markets/useMarketTokensData";
import { useGmTokensFavorites } from "domain/synthetics/tokens/useGmTokensFavorites";
import useSortedPoolsWithIndexToken from "domain/synthetics/trade/useSortedPoolsWithIndexToken";
import { bigMath } from "lib/bigmath";
import { formatAmountFree, formatDeltaUsd, formatTokenAmount, formatUsd } from "lib/numbers";
import { getByKey } from "lib/objects";
import { Mode, Operation } from "../types";

import { useUpdateByQueryParams } from "../useUpdateByQueryParams";
import { useShiftAmounts } from "./useShiftAmounts";
import { useShiftAvailableRelatedMarkets } from "./useShiftAvailableRelatedMarkets";
import { useShiftFees } from "./useShiftFees";
import { useShiftSubmitState } from "./useShiftSubmitState";
import { useUpdateMarkets } from "./useUpdateMarkets";
import { useUpdateTokens } from "./useUpdateTokens";

import Button from "components/Button/Button";
import BuyInputSection from "components/BuyInputSection/BuyInputSection";
import { ExchangeInfo } from "components/Exchange/ExchangeInfo";
import { PoolSelector } from "components/MarketSelector/PoolSelector";
import { NetworkFeeRow } from "components/Synthetics/NetworkFeeRow/NetworkFeeRow";
import { GmConfirmationBox } from "../../GmConfirmationBox/GmConfirmationBox";
import { GmFees } from "../../GmFees/GmFees";
import { HighPriceImpactRow } from "../HighPriceImpactRow";
import { Swap } from "../Swap";
import cx from "classnames";

export function GmShiftBox({
  selectedMarketAddress,
  onSelectMarket,

  onSetMode,
  onSetOperation,
}: {
  selectedMarketAddress: string | undefined;
  onSelectMarket: (marketAddress: string) => void;
  onSetMode: (mode: Mode) => void;
  onSetOperation: (operation: Operation) => void;
}) {
  const [expandFees, setExpandFees] = useState(false);
  const [toMarketAddress, setToMarketAddress] = useState<string | undefined>(undefined);
  const [selectedMarketText, setSelectedMarketText] = useState("");
  const [toMarketText, setToMarketText] = useState("");
  const gmTokenFavoritesContext = useGmTokensFavorites();
  const [focusedInput, setFocusedInput] = useState<"selectedMarket" | "toMarket" | undefined>(undefined);
  const [isConfirmationBoxVisible, setIsConfirmationBoxVisible] = useState(false);
  const [isHighPriceImpactAccepted, setIsHighPriceImpactAccepted] = useState(false);

  const chainId = useSelector(selectChainId);
  const uiFeeFactor = useUiFeeFactor();
  const gasLimits = useSelector(selectGasLimits);
  const gasPrice = useSelector(selectGasPrice);
  const marketsInfoData = useMarketsInfoData();
  const tokensData = useTokensData();
  const { marketTokensData: depositMarketTokensData } = useMarketTokensData(chainId, { isDeposit: true });
  const { marketsInfo: sortedMarketsInfoByIndexToken } = useSortedPoolsWithIndexToken(
    marketsInfoData,
    depositMarketTokensData
  );
  const shiftAvailableMarkets = useSelector(selectShiftAvailableMarkets);
  const shiftAvailableRelatedMarkets = useShiftAvailableRelatedMarkets(
    marketsInfoData,
    sortedMarketsInfoByIndexToken,
    selectedMarketAddress
  );
  const { shouldDisableValidationForTesting } = useSettings();

  const selectedMarketInfo = getByKey(marketsInfoData, selectedMarketAddress);
  const selectedIndexName = selectedMarketInfo ? getMarketIndexName(selectedMarketInfo) : "...";
  const selectedToken = getByKey(depositMarketTokensData, selectedMarketAddress);
  const toMarketInfo = getByKey(marketsInfoData, toMarketAddress);
  const toIndexName = toMarketInfo ? getMarketIndexName(toMarketInfo) : "...";
  const toToken = getByKey(depositMarketTokensData, toMarketAddress);

  const amounts = useShiftAmounts({
    selectedMarketInfo,
    selectedToken,
    toMarketInfo,
    toToken,
    selectedMarketText,
    toMarketText,
    focusedInput,
    uiFeeFactor,
  });

  const { fees, executionFee } = useShiftFees({ gasLimits, gasPrice, tokensData, amounts, chainId });

  const isHighPriceImpact =
    (fees?.swapPriceImpact?.deltaUsd ?? 0) < 0 &&
    bigMath.abs(fees?.swapPriceImpact?.bps ?? 0n) >= HIGH_PRICE_IMPACT_BPS;

  const noAmountSet = amounts?.fromTokenAmount === undefined;
  const balanceNotEqualToAmount = selectedToken?.balance !== amounts?.fromTokenAmount;
  const hasBalance = selectedToken?.balance !== undefined && selectedToken.balance > 0n;
  const selectedTokenShowMaxButton = hasBalance && (noAmountSet || balanceNotEqualToAmount);

  const selectedTokenDollarAmount =
    amounts?.fromTokenUsd !== undefined && amounts.fromTokenUsd > 0n ? formatUsd(amounts.fromTokenUsd) : "";
  const toTokenShowDollarAmount =
    amounts?.toTokenUsd !== undefined && amounts.toTokenUsd > 0n ? formatUsd(amounts.toTokenUsd) : "";

  const submitState = useShiftSubmitState({
    selectedMarketInfo,
    selectedToken,
    amounts,
    toMarketInfo,
    toToken,
    fees,
    isHighPriceImpact,
    isHighPriceImpactAccepted,
    setIsConfirmationBoxVisible,
    shouldDisableValidationForTesting,
  });

  useUpdateMarkets({
    marketsInfoData,
    selectedMarketAddress,
    shiftAvailableMarkets,
    onSelectMarket,
    toMarketAddress,
    toMarketInfo,
    selectedMarketInfo,
    setToMarketAddress,
  });

  useUpdateTokens({ amounts, selectedToken, toToken, focusedInput, setToMarketText, setSelectedMarketText });

  useUpdateByQueryParams({
    operation: Operation.Shift,
    onSelectMarket,
    setMode: onSetMode,
    setOperation: onSetOperation,
  });

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitState.onSubmit();
    },
    [submitState]
  );

  const handleClearValues = useCallback(() => {
    setSelectedMarketText("");
    setToMarketText("");
  }, []);

  const handleSelectedTokenClickMax = useCallback(() => {
    if (!selectedToken || selectedToken.balance === undefined) return;
    setFocusedInput("selectedMarket");
    setSelectedMarketText(formatAmountFree(selectedToken.balance, selectedToken.decimals));
  }, [selectedToken]);
  const handleSelectedTokenInputValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setSelectedMarketText(event.target.value),
    []
  );
  const handleSelectedTokenFocus = useCallback(() => setFocusedInput("selectedMarket"), []);
  const handleSelectedTokenSelectMarket = useCallback(
    (marketInfo: MarketInfo): void => {
      onSelectMarket(marketInfo.marketTokenAddress);
      handleClearValues();
    },
    [handleClearValues, onSelectMarket]
  );

  const handleToTokenInputValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setToMarketText(event.target.value),
    []
  );
  const handleToTokenFocus = useCallback(() => setFocusedInput("toMarket"), []);
  const handleToTokenSelectMarket = useCallback(
    (marketInfo: MarketInfo): void => {
      setToMarketAddress(marketInfo.marketTokenAddress);
      handleClearValues();
    },
    [handleClearValues]
  );

  const handleSubmittedOrClosed = useCallback(() => {
    setIsConfirmationBoxVisible(false);
  }, []);

  return (
    <>
      <form className="flex flex-col" onSubmit={handleFormSubmit}>
        <BuyInputSection
          topLeftLabel={t`Pay`}
          topLeftValue={selectedTokenDollarAmount}
          topRightLabel={t`Balance`}
          topRightValue={formatTokenAmount(selectedToken?.balance, selectedToken?.decimals, "", {
            useCommas: true,
          })}
          onClickTopRightLabel={handleSelectedTokenClickMax}
          showMaxButton={selectedTokenShowMaxButton}
          onClickMax={handleSelectedTokenClickMax}
          inputValue={selectedMarketText}
          onInputValueChange={handleSelectedTokenInputValueChange}
          onFocus={handleSelectedTokenFocus}
        >
          <PoolSelector
            selectedMarketAddress={selectedMarketAddress}
            markets={shiftAvailableMarkets}
            onSelectMarket={handleSelectedTokenSelectMarket}
            selectedIndexName={selectedIndexName}
            showAllPools
            isSideMenu
            showIndexIcon
            showBalances
            marketTokensData={depositMarketTokensData}
            {...gmTokenFavoritesContext}
          />
        </BuyInputSection>
        {/* <Swap /> */}
        <BuyInputSection
          topLeftLabel={t`Receive`}
          topLeftValue={toTokenShowDollarAmount}
          topRightLabel={t`Balance`}
          topRightValue={formatTokenAmount(toToken?.balance, toToken?.decimals, "", {
            useCommas: true,
          })}
          inputValue={toMarketText}
          onInputValueChange={handleToTokenInputValueChange}
          onFocus={handleToTokenFocus}
        >
          <PoolSelector
            selectedMarketAddress={toMarketAddress}
            markets={shiftAvailableRelatedMarkets}
            onSelectMarket={handleToTokenSelectMarket}
            selectedIndexName={toIndexName}
            showAllPools
            isSideMenu
            showIndexIcon
            showBalances
            marketTokensData={depositMarketTokensData}
            {...gmTokenFavoritesContext}
          />
        </BuyInputSection>
        <ExchangeInfo className={isHighPriceImpact ? undefined : "mb-10"} dividerClassName="App-card-divider">
          {/* <ExchangeInfo.Group>
            <GmFees
              isDeposit={true}
              totalFees={fees?.totalFees}
              swapPriceImpact={fees?.swapPriceImpact}
              uiFee={fees?.uiFee}
              shiftFee={fees?.shiftFee}
            />
            <NetworkFeeRow executionFee={executionFee} />
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
                className={cx("rotate-0 transition duration-300 ease-in-out", { "rotate-180": expandFees })}
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
              {fees?.shiftFee ? (
                <div className="flex items-center justify-between">
                  <p className="fee-title">{t`SHIFT FEE`}</p>
                  <div className="flex items-center">
                    <p className="negative fee-content">
                      {formatDeltaUsd(fees.shiftFee.deltaUsd, fees.shiftFee.bps!)!}
                    </p>
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
              isSingle={false}
            />
          )}
        </ExchangeInfo>

        <button
          className={cx(
            { "hover:bg-[#fff] active:bg-[#CCCCCC]": !submitState.isDisabled },
            "mt-4 !h-[40px] w-full !rounded-[12px] bg-[#F2F0ED] text-[14px] font-[600] !text-[#000] text-[#3E3E3E]"
          )}
          type="submit"
          disabled={submitState.isDisabled}
        >
          {submitState.text}
        </button>
      </form>

      <GmConfirmationBox
        isVisible={isConfirmationBoxVisible}
        fromMarketToken={selectedToken}
        fromMarketTokenAmount={amounts?.fromTokenAmount ?? 0n}
        fromMarketTokenUsd={amounts?.fromTokenUsd ?? 0n}
        marketToken={toToken}
        marketTokenAmount={amounts?.toTokenAmount ?? 0n}
        marketTokenUsd={amounts?.toTokenUsd ?? 0n}
        fees={fees!}
        error={submitState.error}
        operation={Operation.Shift}
        executionFee={executionFee}
        onSubmitted={handleSubmittedOrClosed}
        onClose={handleSubmittedOrClosed}
        shouldDisableValidation={shouldDisableValidationForTesting}
      />
    </>
  );
}
