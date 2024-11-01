import { t } from "@lingui/macro";
import cx from "classnames";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { BiChevronDown } from "react-icons/bi";

import { MarketInfo, getMarketIndexName } from "domain/synthetics/markets";
import { TokenData, TokensData, convertToUsd } from "domain/synthetics/tokens";
import {
  indexTokensFavoritesTabOptionLabels,
  indexTokensFavoritesTabOptions,
  useIndexTokensFavorites,
} from "domain/synthetics/tokens/useIndexTokensFavorites";
import { useLocalizedMap } from "lib/i18n";
import { importImage } from "lib/legacy";
import { formatTokenAmount, formatUsd } from "lib/numbers";
import { getByKey } from "lib/objects";

import FavoriteStar from "components/FavoriteStar/FavoriteStar";
import SearchInput from "components/SearchInput/SearchInput";
import Tab from "components/Tab/Tab";
import Modal from "../Modal/Modal";
import TooltipWithPortal from "../Tooltip/TooltipWithPortal";

import "./MarketSelector.scss";
import { Menu } from "@headlessui/react";

type Props = {
  label?: string;
  className?: string;
  selectedIndexName?: string;
  markets: MarketInfo[];
  marketTokensData?: TokensData;
  showBalances?: boolean;
  selectedMarketLabel?: ReactNode | string;
  isSideMenu?: boolean;
  getMarketState?: (market: MarketInfo) => MarketState | undefined;
  onSelectMarket: (indexName: string, market: MarketInfo) => void;
};

type MarketState = {
  disabled?: boolean;
  message?: string;
};

type MarketOption = {
  indexName: string;
  marketInfo: MarketInfo;
  balance: bigint;
  balanceUsd: bigint;
  state?: MarketState;
};

export function MarketSelector({
  selectedIndexName,
  className,
  selectedMarketLabel,
  label,
  markets,
  isSideMenu,
  marketTokensData,
  showBalances,
  onSelectMarket,
  getMarketState,
}: Props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { tab, setTab, favoriteTokens, setFavoriteTokens } = useIndexTokensFavorites();
  const localizedTabOptionLabels = useLocalizedMap(indexTokensFavoritesTabOptionLabels);

  const marketsOptions: MarketOption[] = useMemo(() => {
    const optionsByIndexName: { [indexName: string]: MarketOption } = {};

    markets
      .filter((market) => !market.isDisabled)
      .forEach((marketInfo) => {
        const indexName = getMarketIndexName(marketInfo);
        const marketToken = getByKey(marketTokensData, marketInfo.marketTokenAddress);

        const gmBalance = marketToken?.balance;
        const gmBalanceUsd = convertToUsd(marketToken?.balance, marketToken?.decimals, marketToken?.prices.minPrice);
        const state = getMarketState?.(marketInfo);

        const option = optionsByIndexName[indexName];

        if (option) {
          option.balance = option.balance + (gmBalance ?? 0n);
          option.balanceUsd = option.balanceUsd + (gmBalanceUsd ?? 0n);
        }

        optionsByIndexName[indexName] = optionsByIndexName[indexName] || {
          indexName,
          marketInfo,
          balance: gmBalance ?? 0n,
          balanceUsd: gmBalanceUsd ?? 0n,
          state,
        };
      });

    return Object.values(optionsByIndexName);
  }, [getMarketState, marketTokensData, markets]);

  const marketInfo = marketsOptions.find((option) => option.indexName === selectedIndexName)?.marketInfo;

  const filteredOptions = marketsOptions.filter((option) => {
    const textSearchMatch =
      option.indexName.toLowerCase().indexOf(searchKeyword.toLowerCase()) > -1 ||
      (!option.marketInfo.isSpotOnly &&
        option.marketInfo.indexToken.name.toLowerCase().indexOf(searchKeyword.toLowerCase()) > -1);

    const favoriteMatch = tab === "favorites" ? favoriteTokens?.includes(option.marketInfo.indexToken.address) : true;

    return textSearchMatch && favoriteMatch;
  });

  function onSelectOption(option: MarketOption) {
    onSelectMarket(option.indexName, option.marketInfo);
    setIsModalVisible(false);
  }

  const _handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (filteredOptions.length > 0) {
        onSelectOption(filteredOptions[0]);
      }
    }
  };

  const handleFavoriteClick = useCallback(
    (address: string) => {
      if (favoriteTokens.includes(address)) {
        setFavoriteTokens(favoriteTokens.filter((item) => item !== address));
      } else {
        setFavoriteTokens([...favoriteTokens, address]);
      }
    },
    [favoriteTokens, setFavoriteTokens]
  );

  return (
    <div className={cx("TokenSelector", "MarketSelector", { "side-menu": isSideMenu }, className)}>
      <Modal
        qa="market-selector-modal"
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
        label={label}
        headerContent={
          <SearchInput
            className="mt-15"
            value={searchKeyword}
            setValue={(e) => setSearchKeyword(e.target.value)}
            placeholder={t`Search Market`}
            onKeyDown={_handleKeyDown}
          />
        }
      >
        <Tab
          options={indexTokensFavoritesTabOptions}
          optionLabels={localizedTabOptionLabels}
          type="inline"
          option={tab}
          setOption={setTab}
        />

        <div className="TokenSelector-tokens">
          {filteredOptions.map((option, marketIndex) => (
            <MarketListItem
              key={option.marketInfo.marketTokenAddress}
              {...option}
              showBalances={showBalances}
              marketToken={getByKey(marketTokensData, option.marketInfo.marketTokenAddress)}
              isFavorite={favoriteTokens?.includes(option.marketInfo.indexToken.address)}
              isInFirstHalf={marketIndex < filteredOptions.length / 2}
              onSelectOption={onSelectOption}
              onFavoriteClick={handleFavoriteClick}
            />
          ))}
        </div>
      </Modal>
      {/* {selectedMarketLabel ? (
        <div className="TokenSelector-box" onClick={() => setIsModalVisible(true)} data-qa="market-selector">
          {selectedMarketLabel}
          <BiChevronDown className="TokenSelector-caret" />
        </div>
      ) : (
        <div className="TokenSelector-box" onClick={() => setIsModalVisible(true)} data-qa="market-selector">
          {marketInfo ? getMarketIndexName(marketInfo) : "..."}
          <BiChevronDown className="TokenSelector-caret" />
        </div>
      )} */}
      <Menu>
        <Menu.Button as="div">
          {selectedMarketLabel ? (
            <div className="TokenSelector-box" data-qa="market-selector">
              {selectedMarketLabel}
              <BiChevronDown className="TokenSelector-caret" />
            </div>
          ) : (
            <div className="TokenSelector-box" data-qa="market-selector">
              {marketInfo ? getMarketIndexName(marketInfo) : "..."}
              <BiChevronDown className="TokenSelector-caret" />
            </div>
          )}
        </Menu.Button>
        <Menu.Items as="div" className="menu-items wallet-dd h-[200px] !w-[160px] !px-4">
          <div className=" h-full overflow-y-auto pb-8">
            {filteredOptions.map((option, marketIndex) => {
              const assetImage = importImage(
                `ic_${option.marketInfo.isSpotOnly ? "swap" : option.marketInfo.indexToken.symbol.toLowerCase()}_40.svg`
              );
              return (
                <Menu.Item key={option.indexName + marketIndex}>
                  <div
                    className={cx(
                      "flex h-[32px] items-center justify-between rounded-[6px] px-4 hover:bg-[#D9D9D9]",
                      {}
                    )}
                    onClick={() => onSelectOption(option)}
                  >
                    {/* {tokenState.disabled && tokenState.message && (
                <TooltipWithPortal
                  className="TokenSelector-tooltip"
                  handle={<div className="TokenSelector-tooltip-backing" />}
                  position={tokenIndex < filteredTokens.length / 2 ? "bottom" : "top"}
                  disableHandleStyle
                  closeOnDoubleClick
                  fitHandleWidth
                  renderContent={() => tokenState.message}
                />
              )} */}
                    <div className="Token-info">
                      {/* <TokenIcon symbol={mar} className="token-logo" displaySize={40} importSize={40} /> */}

                      <img src={assetImage} alt={option.indexName} className="token-logo" />
                      <div className="Token-symbol">
                        <div className="Token-t text-left text-[14px] font-[500] text-[#121214]">
                          {option.indexName}
                        </div>
                        {/* <span className="text-accent">{token.name}</span> */}
                      </div>
                    </div>
                    <div className="Token-balance  !text-right text-[12px] !text-[#000] !opacity-60">
                      {showBalances &&
                        option.balance !== undefined &&
                        (option.balance > 0
                          ? formatTokenAmount(
                              option.balance,
                              getByKey(marketTokensData, option.marketInfo.marketTokenAddress)?.decimals,
                              "",
                              {
                                useCommas: true,
                              }
                            )
                          : "-")}
                      {/* <span className="text-accent">
                    {mintAmount && <div>Mintable: {formatAmount(mintAmount, token.decimals, 2, true)} USDG</div>}
                    {showMintingCap && !mintAmount && <div>-</div>}
                    {!showMintingCap && showBalances && balanceUsd !== undefined && balanceUsd > 0 && (
                      <div>${formatAmount(balanceUsd, 30, 2, true)}</div>
                    )}
                  </span> */}
                    </div>
                  </div>
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Menu>
    </div>
  );
}

function MarketListItem(props: {
  marketInfo: MarketInfo;
  marketToken?: TokenData;
  balance: bigint;
  balanceUsd: bigint;
  indexName: string;
  state?: MarketState;
  isFavorite: boolean;
  isInFirstHalf: boolean;
  showBalances?: boolean;
  onFavoriteClick: (address: string) => void;
  onSelectOption: (option: MarketOption) => void;
}) {
  const {
    marketInfo,
    balance,
    balanceUsd,
    indexName,
    state = {},
    marketToken,
    isFavorite,
    isInFirstHalf,
    showBalances,
    onFavoriteClick,
    onSelectOption,
  } = props;
  const assetImage = importImage(
    `ic_${marketInfo.isSpotOnly ? "swap" : marketInfo.indexToken.symbol.toLowerCase()}_40.svg`
  );

  const handleFavoriteClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onFavoriteClick(marketInfo.indexToken.address);
    },
    [marketInfo.indexToken.address, onFavoriteClick]
  );

  const handleClick = useCallback(() => {
    if (state.disabled) {
      return;
    }

    onSelectOption({
      marketInfo,
      indexName,
      balance,
      balanceUsd,
      state,
    });
  }, [balance, balanceUsd, indexName, marketInfo, onSelectOption, state]);

  return (
    <div
      className={cx("TokenSelector-token-row", { disabled: state.disabled })}
      onClick={handleClick}
      data-qa={`market-selector-${indexName}`}
    >
      {state.disabled && state.message && (
        <TooltipWithPortal
          className="TokenSelector-tooltip"
          handle={<div className="TokenSelector-tooltip-backing" />}
          position={isInFirstHalf ? "bottom" : "top"}
          disableHandleStyle
          closeOnDoubleClick
          fitHandleWidth
          renderContent={() => state.message}
        />
      )}
      <div className="Token-info">
        <img src={assetImage} alt={indexName} className="token-logo" />
        <div className="Token-symbol">
          <div className="Token-text">{indexName}</div>
        </div>
      </div>
      <div className="Token-balance">
        {showBalances && balance !== undefined && (
          <div className="Token-text">
            {balance > 0
              ? formatTokenAmount(balance, marketToken?.decimals, "", {
                  useCommas: true,
                })
              : "-"}
          </div>
        )}
        <span className="text-accent">
          {(showBalances && balanceUsd !== undefined && balanceUsd > 0 && <div>{formatUsd(balanceUsd)}</div>) || null}
        </span>
      </div>
      <div
        className="favorite-star flex cursor-pointer items-center rounded-4 p-9 text-16 hover:bg-cold-blue-700 active:bg-cold-blue-500"
        onClick={handleFavoriteClick}
      >
        <FavoriteStar isFavorite={isFavorite} />
      </div>
    </div>
  );
}
