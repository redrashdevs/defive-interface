import { t, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import formatDate from "date-fns/format";
import { useCallback, useEffect, useState } from "react";

import { getExplorerUrl } from "config/chains";
import { CLAIMS_HISTORY_PER_PAGE } from "config/ui";
import { useAccount } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { ClaimAction, ClaimType, useClaimCollateralHistory } from "domain/synthetics/claimHistory";
import { downloadAsCsv } from "lib/csv";
import { useDateRange, useNormalizeDateRange } from "lib/dates";
import { formatTokenAmount } from "lib/numbers";
import { EMPTY_ARRAY } from "lib/objects";

import Button from "components/Button/Button";
import Pagination from "components/Pagination/Pagination";
import usePagination from "components/Referrals/usePagination";
import { ClaimsHistorySkeleton } from "components/Skeleton/Skeleton";
import { DateRangeSelect } from "components/Synthetics/DateRangeSelect/DateRangeSelect";
import { MarketFilter } from "components/Synthetics/TableMarketFilter/MarketFilter";
import { ClaimHistoryRow } from "./ClaimHistoryRow/ClaimHistoryRow";
import { ActionFilter } from "./filters/ActionFilter";

import { formatTradeActionTimestamp } from "../TradeHistory/TradeHistoryRow/utils/shared";
import { claimCollateralEventTitles } from "./ClaimHistoryRow/ClaimCollateralHistoryRow";
import { claimFundingFeeEventTitles } from "./ClaimHistoryRow/ClaimFundingFeesHistoryRow";

import downloadIcon from "img/ic_download_simple.svg";

import "./ClaimsHistory.scss";
import { useMedia } from "react-use";

const CLAIMS_HISTORY_PREFETCH_SIZE = 100;

export function ClaimsHistory({ shouldShowPaginationButtons }: { shouldShowPaginationButtons: boolean }) {
  const chainId = useSelector(selectChainId);
  const account = useAccount();

  const [startDate, endDate, setDateRange] = useDateRange();
  const [eventNameFilter, setEventNameFilter] = useState<string[]>([]);
  const [marketAddressesFilter, setMarketAddressesFilter] = useState<string[]>([]);

  const [fromTxTimestamp, toTxTimestamp] = useNormalizeDateRange(startDate, endDate);

  const {
    claimActions,
    pageIndex,
    setPageIndex,
    isLoading: isHistoryLoading,
  } = useClaimCollateralHistory(chainId, {
    pageSize: CLAIMS_HISTORY_PREFETCH_SIZE,
    fromTxTimestamp: fromTxTimestamp,
    toTxTimestamp: toTxTimestamp,
    eventName: eventNameFilter,
    marketAddresses: marketAddressesFilter,
  });
  const isConnected = Boolean(account);
  const isLoading = isConnected && isHistoryLoading;

  const isMobile = useMedia("(max-width: 600px)");
  const { currentPage, setCurrentPage, getCurrentData, pageCount } = usePagination(
    String(account),
    claimActions || EMPTY_ARRAY,
    CLAIMS_HISTORY_PER_PAGE
  );
  const currentPageData = getCurrentData();

  const isEmpty = !account || !claimActions || claimActions?.length === 0;
  const hasFilters = Boolean(startDate || endDate || eventNameFilter.length || marketAddressesFilter.length);

  useEffect(() => {
    if (!pageCount || !currentPage) return;
    const totalPossiblePages = (CLAIMS_HISTORY_PREFETCH_SIZE * pageIndex) / CLAIMS_HISTORY_PER_PAGE;
    const doesMoreDataExist = pageCount >= totalPossiblePages;
    const isCloseToEnd = pageCount && pageCount < currentPage + 2;

    if (doesMoreDataExist && isCloseToEnd) {
      setPageIndex((prevIndex) => prevIndex + 1);
    }
  }, [currentPage, pageCount, pageIndex, setPageIndex]);

  const handleCsvDownload = useDownloadAsCsv(claimActions);

  console.log(isEmpty, account, claimActions)

  return (
    <>
      <div className="ClaimHistory-Wrapper">
        <div
          className="flex flex-wrap items-center justify-between gap-y-8 border-b-[1px] border-dotted px-[16px] py-[8px]"
          style={{ borderColor: "rgba(54, 54, 61, 1)" }}
        >
          <div className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.24)" }}>
            <Trans>Claims History</Trans>
          </div>
          <div className="ClaimsHistory-controls-right">
            <div className="ClaimsHistory-filters">
              <DateRangeSelect startDate={startDate} endDate={endDate} onChange={setDateRange} />
            </div>
            <button onClick={handleCsvDownload} className="px-12">
              <div className="flex items-center">
                <img src="/images/download.svg" />
                <p className="ml-4 text-[12px] font-[500] text-white opacity-60">CSV</p>
              </div>
            </button>
          </div>
        </div>
        <div className="ClaimsHistory-horizontal-scroll-container">
          {isMobile ? (
            isLoading ? (
              <ClaimsHistorySkeleton />
            ) : (
              currentPageData.map((claimAction) => <ClaimHistoryRow key={claimAction.id} claimAction={claimAction} />)
            )
          ) : (
            <table className="Exchange-list ClaimsHistory-table">
              <colgroup>
                <col className="ClaimsHistory-action-column" />
                <col className="ClaimsHistory-market-column" />
                <col className="ClaimsHistory-size-column" />
              </colgroup>
              <thead className="ClaimsHistory-header">
                <tr>
                  <th>
                    {/* <ActionFilter value={eventNameFilter} onChange={setEventNameFilter} /> */}
                    <Trans>ACTION</Trans>
                  </th>
                  <th className="!text-right">
                    {/* <MarketFilter excludeSpotOnly value={marketAddressesFilter} onChange={setMarketAddressesFilter} /> */}
                    <Trans>MARKET</Trans>
                  </th>
                  <th className="!text-right ClaimsHistory-price-header">
                    <Trans>Size</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <ClaimsHistorySkeleton />
                ) : (
                  currentPageData.map((claimAction) => (
                    <ClaimHistoryRow key={claimAction.id} claimAction={claimAction} />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {isEmpty && !isLoading && !hasFilters && (
          <div className="TradeHistorySynthetics-padded-cell h-[140px] flex-col flex items-center justify-center text-[14px] font-[600] text-[#36363D]">
            <img src="/images/empty-record.svg" />
            <Trans>No Claim History</Trans>
          </div>
        )}

        {isEmpty && hasFilters && (
          <div className="ClaimsHistory-fake-row">
            <Trans>No claims match the selected filters</Trans>
          </div>
        )}
      </div>

      {shouldShowPaginationButtons && (
        <Pagination page={currentPage} pageCount={pageCount} onPageChange={(page) => setCurrentPage(page)} />
      )}
    </>
  );
}

function useDownloadAsCsv(claimActions?: ClaimAction[]) {
  const chainId = useSelector(selectChainId);
  const { _ } = useLingui();

  const handleCsvDownload = useCallback(() => {
    if (!claimActions) {
      return;
    }

    const fullFormattedData = claimActions.flatMap((claimAction) => {
      if (claimAction.type === "collateral") {
        let action: string = _(claimCollateralEventTitles[claimAction.eventName]);

        return claimAction.claimItems.flatMap((claimItem) => {
          return [
            claimItem.longTokenAmount > 0 && {
              explorerUrl: getExplorerUrl(chainId) + `tx/${claimAction.transactionHash}`,
              timestamp: formatTradeActionTimestamp(claimAction.timestamp, false),
              action: action,
              market: claimItem.marketInfo.name,
              size: formatTokenAmount(
                claimItem.longTokenAmount,
                claimItem.marketInfo.longToken.decimals,
                claimItem.marketInfo.longToken.symbol
              ),
            },
            claimItem.shortTokenAmount > 0 && {
              explorerUrl: getExplorerUrl(chainId) + `tx/${claimAction.transactionHash}`,
              timestamp: formatTradeActionTimestamp(claimAction.timestamp, false),
              action: action,
              market: claimItem.marketInfo.name,
              size: formatTokenAmount(
                claimItem.shortTokenAmount,
                claimItem.marketInfo.shortToken.decimals,
                claimItem.marketInfo.shortToken.symbol
              ),
            },
          ].filter(Boolean);
        });
      }

      let action: string = _(claimFundingFeeEventTitles[claimAction.eventName]);
      return claimAction.markets.map((market, index) => ({
        explorerUrl: getExplorerUrl(chainId) + `tx/${claimAction.transactionHash}`,
        timestamp: formatTradeActionTimestamp(claimAction.timestamp, false),
        action: action,
        market: (claimAction.isLongOrders[index] ? t`Long` : t`Short`) + " " + market.name,
        size:
          claimAction.eventName === ClaimType.SettleFundingFeeCreated
            ? "-"
            : formatTokenAmount(
                claimAction.amounts[index],
                claimAction.tokens[index].decimals,
                claimAction.tokens[index].symbol
              ),
      }));
    });

    const timezone = formatDate(new Date(), "z");

    downloadAsCsv("claims-history", fullFormattedData, [], {
      timestamp: t`Date` + ` (${timezone})`,
      action: t`Action`,
      market: t`Market`,
      size: t`Size`,
      explorerUrl: t`Transaction ID`,
    });
  }, [chainId, claimActions, _]);

  return handleCsvDownload;
}
