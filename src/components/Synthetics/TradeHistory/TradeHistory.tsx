import { Trans } from "@lingui/macro";
import { useEffect, useMemo, useState } from "react";

import type { Address } from "viem";

import { TRADE_HISTORY_PER_PAGE } from "config/ui";
import { useShowDebugValues } from "context/SyntheticsStateContext/hooks/settingsHooks";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { OrderType } from "domain/synthetics/orders/types";
import { usePositionsConstantsRequest } from "domain/synthetics/positions/usePositionsConstants";
import { TradeActionType, useTradeHistory } from "domain/synthetics/tradeHistory";
import { useDateRange, useNormalizeDateRange } from "lib/dates";

import Button from "components/Button/Button";
import Pagination from "components/Pagination/Pagination";
import usePagination from "components/Referrals/usePagination";
import { TradesHistoryMobileSkeleton, TradesHistorySkeleton } from "components/Skeleton/Skeleton";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";

import { DateRangeSelect } from "../DateRangeSelect/DateRangeSelect";
import { MarketFilterLongShort, MarketFilterLongShortItemData } from "../TableMarketFilter/MarketFilterLongShort";
import { ActionFilter } from "./filters/ActionFilter";
import { TradeHistoryRow } from "./TradeHistoryRow/TradeHistoryRow";
import { buildAccountDashboardUrl } from "pages/AccountDashboard/AccountDashboard";

import { useDownloadAsCsv } from "./useDownloadAsCsv";

import downloadIcon from "img/ic_download_simple.svg";
import PnlAnalysisIcon from "img/ic_pnl_analysis_20.svg?react";

import "./TradeHistorySynthetics.scss";
import { useMedia } from "react-use";

const TRADE_HISTORY_PREFETCH_SIZE = 100;
const ENTITIES_PER_PAGE = TRADE_HISTORY_PER_PAGE;

type Props = {
  shouldShowPaginationButtons: boolean;
  account: Address | null | undefined;
  forAllAccounts?: boolean;
  hideDashboardLink?: boolean;
};

export function TradeHistory(p: Props) {
  const { shouldShowPaginationButtons, forAllAccounts, account, hideDashboardLink = false } = p;
  const chainId = useSelector(selectChainId);
  const showDebugValues = useShowDebugValues();
  const [startDate, endDate, setDateRange] = useDateRange();
  const [marketsDirectionsFilter, setMarketsDirectionsFilter] = useState<MarketFilterLongShortItemData[]>([]);
  const [actionFilter, setActionFilter] = useState<
    {
      orderType: OrderType;
      eventName: TradeActionType;
      isDepositOrWithdraw: boolean;
    }[]
  >([]);

  const [fromTxTimestamp, toTxTimestamp] = useNormalizeDateRange(startDate, endDate);

  const {
    positionsConstants: { minCollateralUsd },
  } = usePositionsConstantsRequest(chainId);

  const {
    tradeActions,
    isLoading: isHistoryLoading,
    pageIndex: tradeActionsPageIndex,
    setPageIndex: setTradeActionsPageIndex,
  } = useTradeHistory(chainId, {
    account,
    forAllAccounts,
    pageSize: TRADE_HISTORY_PREFETCH_SIZE,
    fromTxTimestamp,
    toTxTimestamp,
    marketsDirectionsFilter,
    orderEventCombinations: actionFilter,
  });

  const isMobile = useMedia(`(max-width: 700px)`);
  const isConnected = Boolean(account);
  const isLoading = (forAllAccounts || isConnected) && (minCollateralUsd === undefined || isHistoryLoading);

  const isEmpty = !isLoading && !tradeActions?.length;
  const { currentPage, setCurrentPage, getCurrentData, pageCount } = usePagination(
    [account, forAllAccounts].toString(),
    tradeActions,
    ENTITIES_PER_PAGE
  );
  const currentPageData = getCurrentData();
  const hasFilters = Boolean(startDate || endDate || marketsDirectionsFilter.length || actionFilter.length);

  const pnlAnalysisButton = useMemo(() => {
    if (!account || hideDashboardLink) {
      return null;
    }

    const url = buildAccountDashboardUrl(account, chainId, 2);

    return (
      <Button variant="secondary" slim to={url}>
        <PnlAnalysisIcon className="mr-8 h-16 text-white" />
        <Trans>PnL Analysis</Trans>
      </Button>
    );
  }, [account, chainId, hideDashboardLink]);

  useEffect(() => {
    if (!pageCount || !currentPage) return;
    const totalPossiblePages = (TRADE_HISTORY_PREFETCH_SIZE * tradeActionsPageIndex) / TRADE_HISTORY_PER_PAGE;
    const doesMoreDataExist = pageCount >= totalPossiblePages;
    const isCloseToEnd = pageCount && pageCount < currentPage + 2;

    if (doesMoreDataExist && isCloseToEnd) {
      setTradeActionsPageIndex((prevIndex) => prevIndex + 1);
    }
  }, [currentPage, pageCount, tradeActionsPageIndex, setTradeActionsPageIndex]);

  const [isCsvDownloading, handleCsvDownload] = useDownloadAsCsv({
    account,
    forAllAccounts,
    fromTxTimestamp,
    toTxTimestamp,
    marketsDirectionsFilter,
    orderEventCombinations: actionFilter,
    minCollateralUsd: minCollateralUsd,
  });

  return (
    <div className="TradeHistorySynthetics">
      <div className="trader-wrapper w-full max-[962px]:!-mr-[--default-container-padding] max-[800px]:!-mr-[--default-container-padding-mobile]">
        <div
          className="flex flex-wrap items-center justify-between gap-y-8 border-b-[1px] border-dotted px-[16px] py-[8px]"
          style={{ borderColor: "rgba(54, 54, 61, 1)" }}
        >
          <div className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.24)" }}>
            <Trans>Trade History</Trans>
          </div>
          <div className="TradeHistorySynthetics-controls-right">
            {pnlAnalysisButton}
            <div className="TradeHistorySynthetics-filters">
              <DateRangeSelect
                handleClassName="no-underline"
                startDate={startDate}
                endDate={endDate}
                onChange={setDateRange}
              />
            </div>
            <button disabled={isCsvDownloading} onClick={handleCsvDownload} className="px-12">
              <div className="flex items-center">
                <img src="/images/download.png" />
                <p className="ml-4 text-[12px] font-[500] text-white opacity-60">CSV</p>
              </div>
            </button>
          </div>
        </div>
        <div className="TradeHistorySynthetics-horizontal-scroll-container">
          {isMobile ? (
            isLoading ? (
              <TradesHistoryMobileSkeleton withTimestamp={forAllAccounts} />
            ) : (
              currentPageData.map((tradeAction) => (
                <TradeHistoryRow
                  key={tradeAction.id}
                  tradeAction={tradeAction}
                  minCollateralUsd={minCollateralUsd!}
                  showDebugValues={showDebugValues}
                  shouldDisplayAccount={forAllAccounts}
                />
              ))
            )
          ) : (
            <table className="Exchange-list TradeHistorySynthetics-table">
              <colgroup>
                <col className="TradeHistorySynthetics-action-column" />
                <col className="TradeHistorySynthetics-market-column" />
                <col className="TradeHistorySynthetics-size-column" />
                <col className="TradeHistorySynthetics-price-column" />
                <col className="TradeHistorySynthetics-pnl-fees-column" />
              </colgroup>
              <thead className="TradeHistorySynthetics-header">
                <tr>
                  <th>
                    {/* <ActionFilter value={actionFilter} onChange={setActionFilter} /> */}
                    <Trans>ACTION</Trans>
                  </th>
                  <th>
                    {/* <MarketFilterLongShort
                    withPositions="all"
                    value={marketsDirectionsFilter}
                    onChange={setMarketsDirectionsFilter}
                  /> */}
                    <Trans>MARKET</Trans>
                  </th>
                  <th>
                    <Trans>Size</Trans>
                  </th>
                  <th>
                    <Trans>Price</Trans>
                  </th>
                  <th className="text-start">
                    {/* <TooltipWithPortal content={<Trans>Realized PnL after fees and price impact.</Trans>}> */}
                    <Trans>RPnL ($)</Trans>
                    {/* </TooltipWithPortal> */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TradesHistorySkeleton withTimestamp={forAllAccounts} />
                ) : (
                  currentPageData.map((tradeAction) => (
                    <TradeHistoryRow
                      key={tradeAction.id}
                      tradeAction={tradeAction}
                      minCollateralUsd={minCollateralUsd!}
                      showDebugValues={showDebugValues}
                      shouldDisplayAccount={forAllAccounts}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {isEmpty && hasFilters && (
          <div className="TradeHistorySynthetics-padded-cell h-[140px] flex-col flex items-center justify-center text-[14px] font-[600] text-[#36363D]">
            <img src="/images/empty-record.svg" />
            <Trans>No trades match the selected filters</Trans>
          </div>
        )}
        {isEmpty && !isLoading && !hasFilters && (
          <div className="TradeHistorySynthetics-padded-cell h-[140px] flex-col flex items-center justify-center text-[14px] font-[600] text-[#36363D]">
            <img src="/images/empty-record.svg" />
            <Trans>No Trade History</Trans>
          </div>
        )}
      </div>

      {shouldShowPaginationButtons && (
        <Pagination page={currentPage} pageCount={pageCount} onPageChange={(page) => setCurrentPage(page)} />
      )}
    </div>
  );
}
