import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMedia } from "react-use";

import { useMarketsInfoData } from "context/SyntheticsStateContext/hooks/globalsHooks";
import {
  selectTradeboxChooseSuitableMarket,
  selectTradeboxGetMaxLongShortLiquidityPool,
  selectTradeboxMarketInfo,
  selectTradeboxTradeFlags,
  selectTradeboxTradeType,
} from "context/SyntheticsStateContext/selectors/tradeboxSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { PreferredTradeTypePickStrategy } from "domain/synthetics/markets/chooseSuitableMarket";
import { getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets/utils";
import {
  indexTokensFavoritesTabOptionLabels,
  indexTokensFavoritesTabOptions,
  useIndexTokensFavorites,
} from "domain/synthetics/tokens/useIndexTokensFavorites";
import { TradeType } from "domain/synthetics/trade";
import { Token } from "domain/tokens";
import { helperToast } from "lib/helperToast";
import { useLocalizedMap } from "lib/i18n";
import { USD_DECIMALS } from "config/factors";
import { formatAmountHuman, formatUsd } from "lib/numbers";
import { getByKey } from "lib/objects";

import FavoriteStar from "components/FavoriteStar/FavoriteStar";
import SearchInput from "components/SearchInput/SearchInput";
import { SortDirection, Sorter, useSorterHandlers } from "components/Sorter/Sorter";
import Tab from "components/Tab/Tab";
import TokenIcon from "components/TokenIcon/TokenIcon";
import {
  SELECTOR_BASE_MOBILE_THRESHOLD,
  SelectorBase,
  SelectorBaseMobileHeaderContent,
  useSelectorClose,
} from "../SelectorBase/SelectorBase";
import ModalWithPortal from "@/components/Modal/ModalWithPortal";

type Props = {
  selectedToken: Token | undefined;
  options: Token[] | undefined;
  oneRowLabels?: boolean;
};

export default function ChartTokenSelector(props: Props) {
  const { options, selectedToken, oneRowLabels } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const marketInfo = useSelector(selectTradeboxMarketInfo);
  const { isSwap } = useSelector(selectTradeboxTradeFlags);
  const poolName = marketInfo && !isSwap ? getMarketPoolName(marketInfo) : null;
  const isMobile = useMedia("(max-width: 700px)");
  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      var evtobj = e;

      if (evtobj.altKey && evtobj.key === "k") {
        setIsModalOpen(true);
      }
      if (evtobj.key == "27") {
        setIsModalOpen(false);
      }
    });
  }, []);

  const mobileContent = () =>
    selectedToken ? (
      <span
        onClick={() => setIsModalOpen(true)}
        className={cx("inline-flex whitespace-nowrap pl-0 text-[20px] font-bold", {
          "items-start": !oneRowLabels,
          "items-center": oneRowLabels,
        })}
      >
        <TokenIcon className="mr-8 mt-4" symbol={selectedToken.symbol} displaySize={40} importSize={24} />
        <div
          className={cx("mt-4 flex h-full justify-start", {
            "flex-col": !oneRowLabels,
            "flex-row items-center": oneRowLabels,
          })}
        >
          <span className="text-[16px] font-[600] text-white">
            {selectedToken.symbol} <span className="text-[#FFFFFF] opacity-30">{"- USD"}</span>
          </span>
          {poolName && (
            <span
              className={cx("text-[14px] font-normal text-[#FFFFFF] opacity-30", {
                "ml-8": oneRowLabels,
              })}
            >
              {/* [{poolName}] */}
              {t`Perpetuals`}
            </span>
          )}
        </div>
      </span>
    ) : (
      "..."
    );

  const desktopContent = () => (
    <div
      onClick={() => setIsModalOpen(true)}
      className="pointer mb-10 flex w-[500px] items-center justify-between rounded-[12px] bg-[#121214] pr-12 hover:bg-[#1B1B1F] active:bg-[#0E0E0F]"
    >
      <div className="flex items-center justify-start pl-12">{mobileContent()}</div>
      <div className="flex items-center">
        <KeyComponent content="⌘" classNames="mr-4 w-[24px]" />
        <KeyComponent content="K" classNames="w-[24px]" />
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? mobileContent() : desktopContent()}
      <ModalWithPortal className="Trade-markets-modal" setIsVisible={setIsModalOpen} isVisible={isModalOpen}>
        <MarketsList
          onClose={() => {
            close();
            setIsModalOpen(false);
          }}
          options={options}
        />
      </ModalWithPortal>
    </>
  );
}

type SortField = "longLiquidity" | "shortLiquidity" | "unspecified";

function MarketsList(props: { options: Token[] | undefined; onClose: () => void }) {
  const { options } = props;
  const { tab, setTab, favoriteTokens, setFavoriteTokens } = useIndexTokensFavorites();

  const isMobile = useMedia(`(max-width: ${SELECTOR_BASE_MOBILE_THRESHOLD}px)`);
  const isSmallMobile = useMedia("(max-width: 450px)");

  const close = useSelectorClose();

  const tradeType = useSelector(selectTradeboxTradeType);
  const { orderBy, direction, getSorterProps } = useSorterHandlers<SortField>();
  const [searchKeyword, setSearchKeyword] = useState("");
  const isSwap = tradeType === TradeType.Swap;

  const [tempSelection, setTempSelection] = useState<number>(0);

  const sortedTokens = useFilterSortTokens({ options, searchKeyword, tab, isSwap, favoriteTokens, direction, orderBy });

  const chooseSuitableMarket = useSelector(selectTradeboxChooseSuitableMarket);
  const marketsInfoData = useMarketsInfoData();

  const handleMarketSelect = useCallback(
    (tokenAddress: string, preferredTradeType?: PreferredTradeTypePickStrategy | undefined) => {
      setSearchKeyword("");
      close();
      props.onClose();

      const chosenMarket = chooseSuitableMarket(tokenAddress, preferredTradeType, tradeType);

      if (chosenMarket?.marketTokenAddress && chosenMarket.tradeType !== TradeType.Swap) {
        const marketInfo = getByKey(marketsInfoData, chosenMarket.marketTokenAddress);
        const nextTradeType = chosenMarket.tradeType;
        if (marketInfo) {
          const indexName = getMarketIndexName(marketInfo);
          const poolName = getMarketPoolName(marketInfo);
          helperToast.success(
            <Trans>
              <span>{nextTradeType === TradeType.Long ? t`Long` : t`Short`}</span>{" "}
              <div className="inline-flex">
                <span>{indexName}</span>
                <span className="subtext gm-toast leading-1">[{poolName}]</span>
              </div>{" "}
              <span>market selected</span>
            </Trans>
          );
        }
      }
    },
    [chooseSuitableMarket, close, marketsInfoData, tradeType]
  );

  const rowVerticalPadding = isMobile ? "py-8" : cx("py-4 group-last-of-type/row:pb-8");
  const rowHorizontalPadding = isSmallMobile ? cx("px-6 first-of-type:pl-15 last-of-type:pr-15") : "px-15";
  const thClassName = cx(
    "sticky top-0 !bg-[#121214] py-4 text-right text-[10px] font-[500] uppercase text-[#67677A] first-of-type:text-left",
    rowVerticalPadding,
    rowHorizontalPadding
  );
  const tdClassName = cx(
    "cursor-pointer text-right text-[14px] font-[500] text-[#9696A3] first-of-type:text-left",
    rowVerticalPadding,
    rowHorizontalPadding
  );

  const localizedTabOptionLabels = useLocalizedMap(indexTokensFavoritesTabOptionLabels);

  const handleSetValue = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKeyword(event.target.value);
    },
    [setSearchKeyword]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && sortedTokens && sortedTokens.length > 0) {
        const token = sortedTokens[0];
        handleMarketSelect(token.address);
      }
    },
    [sortedTokens, handleMarketSelect]
  );

  const handleTableKeyDown = (e) => {
    if (e.key === "Enter") {
      const token = sortedTokens![tempSelection];
      handleMarketSelect(token.address);
    }
    if (e.key === "ArrowUp" && tempSelection > 0) {
      // setIsModalOpen(true);
      let n = tempSelection - 1;
      console.log("HEREEEEEE", 38, n);
      setTempSelection(n);
    }
    if (e.key === "ArrowDown" && tempSelection !== sortedTokens!.length - 1) {
      let n = tempSelection + 1;
      console.log("HEREEEEEE", 40, tempSelection, n);
      setTempSelection(n);
      // setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (!sortedTokens?.length) return;
    // Attach the event listener to the window
    window.addEventListener("keydown", handleTableKeyDown);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleTableKeyDown);
    };
  }, [tempSelection, sortedTokens?.length]);

  const handleFavoriteClick = useCallback(
    (address: string) => {
      if (favoriteTokens?.includes(address)) {
        setFavoriteTokens((favoriteTokens || []).filter((item) => item !== address));
      } else {
        setFavoriteTokens([...(favoriteTokens || []), address]);
      }
    },
    [favoriteTokens, setFavoriteTokens]
  );

  return (
    <>
      {!isMobile && (
        <div
          className="absolute bottom-0 left-0 z-10 flex h-64 w-full items-center justify-between rounded-b-[12px] px-16  backdrop-blur-[100px]"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(18, 18, 20, 0.4)" }}
        >
          <div className="flex items-center">
            <KeyComponent content="↓" classNames="w-[24px]" />
            <KeyComponent content="↑" classNames="w-[24px] mx-8" />
            <p className="text-[14px] font-[500] text-white opacity-40">
              <Trans>Navigate</Trans>
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
            <KeyComponent content="return" classNames="w-[54px] mx-8" />
              <p className="text-[14px] font-[500] text-white opacity-40">
                <Trans>Open</Trans>
              </p>
            </div>
            <div className="flex items-center">
            <KeyComponent content="esc" classNames="w-[34px] mx-8" />
              <p className="text-[14px] font-[500] text-white opacity-40">
                <Trans>Close</Trans>
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex w-full items-center justify-between pb-16">
        <SearchInput
          className="mr-16 w-[85%]"
          value={searchKeyword}
          setValue={handleSetValue}
          onKeyDown={handleKeyDown}
        />
        <button
          // onClick={() => {close(); set}}
          onClick={props.onClose}
          style={{ width: 60 }}
          className="flex !h-[40px] !w-[40px] items-center justify-center rounded-[12px] bg-[#1B1B1F]"
        >
          <img src="/images/x.svg" />
        </button>
      </div>
      <div
        className={cx("Synths-ChartTokenSelector", {
          "w-[448px]": !isMobile && !isSwap,
        })}
      >
        {!isSwap && (
          <div className="historical-tabs-wrappper !mt-0 mb-16 pt-0">
            {indexTokensFavoritesTabOptions?.map((item, index) => {
              return (
                <button
                  key={index}
                  // @ts-ignore
                  onClick={() => setTab(item)}
                  className={cx("tab-btn !px-16", { active: tab === item })}
                >
                  <Trans>{localizedTabOptionLabels[item]}</Trans>
                </button>
              );
            })}
          </div>
        )}

        <div
          className={cx(
            {
              "overflow-x-auto pb-[50px]": !isMobile,
            },
            "!h-[444px] "
          )}
        >
          {isSwap || isMobile ? (
            <div autoFocus>
              {sortedTokens?.map((token, index) => (
                <MarketListItem
                  tempSelected={index === tempSelection}
                  key={token.address}
                  token={token}
                  isSwap={isSwap}
                  isSmallMobile={isSmallMobile}
                  isFavorite={favoriteTokens?.includes(token.address)}
                  onFavorite={handleFavoriteClick}
                  rowVerticalPadding={rowVerticalPadding}
                  rowHorizontalPadding={rowHorizontalPadding}
                  tdClassName={tdClassName}
                  onMarketSelect={handleMarketSelect}
                />
              ))}
            </div>
          ) : (
            <table className={cx("text-sm !h-[300px] w-full overflow-y-auto")}>
              <thead className="!bg-[#121214] py-4">
                <tr className="!bg-[#121214] py-4">
                  <th />
                  <th style={{ textAlign: "left" }} className={thClassName}>
                    <Trans>Market</Trans>
                  </th>
                  <>
                    <th className={thClassName}>
                      <Sorter {...getSorterProps("longLiquidity")}>
                        <Trans>LONG LIQ.</Trans>
                      </Sorter>
                    </th>
                    <th className={thClassName}>
                      <Sorter {...getSorterProps("shortLiquidity")}>
                        <Trans>SHORT LIQ.</Trans>
                      </Sorter>
                    </th>
                  </>
                </tr>
              </thead>

              <tbody>
                {sortedTokens?.map((token, index) => (
                  <MarketListItem
                    key={token.address}
                    token={token}
                    isSwap={isSwap}
                    isSmallMobile={isSmallMobile}
                    isFavorite={favoriteTokens?.includes(token.address)}
                    onFavorite={handleFavoriteClick}
                    rowVerticalPadding={rowVerticalPadding}
                    rowHorizontalPadding={rowHorizontalPadding}
                    tdClassName={tdClassName}
                    onMarketSelect={handleMarketSelect}
                    tempSelected={index === tempSelection}
                  />
                ))}
              </tbody>
            </table>
          )}
          {options && options.length > 0 && !sortedTokens?.length && (
            <div className="py-15 text-center text-gray-400 md:-mt-[100px]">
              <Trans>No markets matched.</Trans>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function useFilterSortTokens({
  options,
  searchKeyword,
  tab,
  isSwap,
  favoriteTokens,
  direction,
  orderBy,
}: {
  options: Token[] | undefined;
  searchKeyword: string;
  tab: string;
  isSwap: boolean;
  favoriteTokens: string[];
  direction: SortDirection;
  orderBy: SortField;
}) {
  const filteredTokens: Token[] | undefined = useMemo(
    () =>
      options?.filter((item) => {
        let textSearchMatch = false;
        if (!searchKeyword.trim()) {
          textSearchMatch = true;
        } else {
          textSearchMatch =
            item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            item.symbol.toLowerCase().includes(searchKeyword.toLowerCase());
        }

        const favoriteMatch = tab === "favorites" && !isSwap ? favoriteTokens?.includes(item.address) : true;

        return textSearchMatch && favoriteMatch;
      }),
    [favoriteTokens, isSwap, options, searchKeyword, tab]
  );

  const getMaxLongShortLiquidityPool = useSelector(selectTradeboxGetMaxLongShortLiquidityPool);

  const sortedTokens = useMemo(() => {
    if (isSwap || orderBy === "unspecified" || direction === "unspecified") {
      return filteredTokens;
    }

    const directionMultiplier = direction === "asc" ? 1 : -1;

    return filteredTokens?.slice().sort((a, b) => {
      const { maxLongLiquidityPool: aLongLiq, maxShortLiquidityPool: aShortLiq } = getMaxLongShortLiquidityPool(a);
      const { maxLongLiquidityPool: bLongLiq, maxShortLiquidityPool: bShortLiq } = getMaxLongShortLiquidityPool(b);

      if (orderBy === "longLiquidity") {
        const aLongLiquidity = aLongLiq?.maxLongLiquidity || 0n;
        const bLongLiquidity = bLongLiq?.maxLongLiquidity || 0n;

        return aLongLiquidity > bLongLiquidity ? directionMultiplier : -directionMultiplier;
      }

      if (orderBy === "shortLiquidity") {
        const aShortLiquidity = aShortLiq?.maxShortLiquidity || 0n;
        const bShortLiquidity = bShortLiq?.maxShortLiquidity || 0n;

        return aShortLiquidity > bShortLiquidity ? directionMultiplier : -directionMultiplier;
      }

      return 0;
    });
  }, [isSwap, direction, filteredTokens, getMaxLongShortLiquidityPool, orderBy]);

  return sortedTokens;
}

function MarketListItem({
  token,
  isSwap,
  isSmallMobile,
  isFavorite,
  onFavorite,
  rowVerticalPadding,
  rowHorizontalPadding,
  tdClassName,
  onMarketSelect,
  tempSelected,
}: {
  token: Token;
  isSwap: boolean;
  isSmallMobile: boolean;
  isFavorite?: boolean;
  onFavorite: (address: string) => void;
  rowVerticalPadding: string;
  rowHorizontalPadding: string;
  tdClassName: string;
  onMarketSelect: (address: string, preferredTradeType?: PreferredTradeTypePickStrategy | undefined) => void;
  tempSelected?: boolean;
}) {
  const getMaxLongShortLiquidityPool = useSelector(selectTradeboxGetMaxLongShortLiquidityPool);

  const { maxLongLiquidityPool, maxShortLiquidityPool } = getMaxLongShortLiquidityPool(token);

  let formattedMaxLongLiquidity = formatUsdWithMobile(!isSwap && maxLongLiquidityPool?.maxLongLiquidity, isSmallMobile);

  let maxShortLiquidityPoolFormatted = formatUsdWithMobile(
    !isSwap && maxShortLiquidityPool?.maxShortLiquidity,
    isSmallMobile
  );

  const handleFavoriteClick = useCallback(() => {
    onFavorite(token.address);
  }, [onFavorite, token.address]);

  const handleSelectLargePosition = useCallback(() => {
    onMarketSelect(token.address, "largestPosition");
  }, [onMarketSelect, token.address]);

  const handleSelectLong = useCallback(() => {
    onMarketSelect(token.address, TradeType.Long);
  }, [onMarketSelect, token.address]);

  const handleSelectShort = useCallback(() => {
    onMarketSelect(token.address, TradeType.Short);
  }, [onMarketSelect, token.address]);

  if (isSwap) {
    return (
      <div
        onClick={handleSelectLargePosition}
        key={token.symbol}
        className={cx("mb-8 flex !h-[48px] items-center rounded-[8px] px-8 hover:bg-[#242429]")}
      >
        <span className="inline-flex items-center text-[14px] font-[500] text-white">
          <TokenIcon
            className="ChartToken-list-icon -my-5 mr-8 h-[32px] w-[32px]"
            symbol={token.symbol}
            displaySize={16}
            importSize={24}
          />
          {token.symbol}
        </span>
      </div>
    );
  }
  return (
    <tr key={token.symbol} className={cx({ "!bg-[#242429]": tempSelected }, "group/row !h-[40px] hover:bg-[#242429]")}>
      <td
        className={cx("cursor-pointer rounded-l-[8px] pl-15 pr-4 text-center", rowVerticalPadding)}
        onClick={handleFavoriteClick}
      >
        <FavoriteStar isFavorite={isFavorite} />
      </td>
      <td
        className={cx("cursor-pointer pl-6", rowVerticalPadding, isSmallMobile ? "pr-6" : "pr-15")}
        onClick={handleSelectLargePosition}
      >
        <span className="inline-flex items-center text-[14px] font-[500] text-white">
          <TokenIcon
            className="ChartToken-list-icon -my-5 mr-8"
            symbol={token.symbol}
            displaySize={16}
            importSize={24}
          />
          {token.symbol} {!isSwap && "/ USD"}
        </span>
      </td>

      <td className={tdClassName} onClick={handleSelectLong}>
        {formattedMaxLongLiquidity}
      </td>
      <td className={tdClassName + " rounded-r-[8px]"} onClick={handleSelectShort}>
        {maxShortLiquidityPoolFormatted}
      </td>
    </tr>
  );
}

function formatUsdWithMobile(amount: bigint | undefined | false, isSmallMobile: boolean) {
  if (amount === undefined || amount === false) {
    return "";
  }

  if (isSmallMobile) {
    return formatAmountHuman(amount, USD_DECIMALS, true);
  }

  return formatUsd(amount)!;
}

const KeyComponent = ({ content, classNames = "" }: { content: string; classNames?: string }) => (
  <div
    style={{ boxShadow: "0px 2px 0px 0px rgba(255, 255, 255, 0.03)" }}
    className={cx(classNames, "flex h-[24px] items-center justify-center rounded-[4px] bg-[#252429]")}
  >
    <p className="text-center text-[10px] font-[500] text-white opacity-50">{content}</p>
  </div>
);
