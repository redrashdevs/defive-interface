import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import AddressView from "components/AddressView/AddressView";
import Pagination from "components/Pagination/Pagination";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { formatAmount, formatUsd } from "lib/numbers";
import { useDebounce } from "lib/useDebounce";
import { ReactNode, memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import SearchInput from "components/SearchInput/SearchInput";
import { TopAccountsMobileSkeleton, TopAccountsSkeleton } from "components/Skeleton/Skeleton";
import { TooltipPosition } from "components/Tooltip/Tooltip";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";
import {
  useLeaderboardAccountsRanks,
  useLeaderboardCurrentAccount,
  useLeaderboardIsCompetition,
  useLeaderboardTimeframeTypeState,
} from "context/SyntheticsStateContext/hooks/leaderboardHooks";
import { CompetitionType, LeaderboardAccount, RemoteData } from "domain/synthetics/leaderboard";
import { MIN_COLLATERAL_USD_IN_LEADERBOARD } from "domain/synthetics/leaderboard/constants";
import { USD_DECIMALS } from "config/factors";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { bigMath } from "lib/bigmath";
import { useMedia } from "react-use";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { Link } from "react-router-dom";
import { buildAccountDashboardUrl } from "@/pages/AccountDashboard/AccountDashboard";
import { Address } from "viem";
import { shortenAddress } from "@/lib/legacy";

function getRowClassname(rank: number | null, competition: CompetitionType | undefined, pinned: boolean) {
  if (pinned) return cx("LeaderboardRankRow-Pinned", "Table_tr");
  if (rank === null) return "Table_tr";
  return rank <= 3 ? cx(`LeaderboardRankRow-${rank}`, "Table_tr") : "Table_tr";
}

function getWinnerRankClassname(rank: number | null, competition: CompetitionType | undefined) {
  if (rank === null) return undefined;
  if (rank <= 3) return `LeaderboardRank-${rank}`;
  if (competition && rank <= 18) return "LeaderboardRank-4";

  return undefined;
}

type LeaderboardAccountField = keyof LeaderboardAccount;

export function LeaderboardAccountsTable({
  search,
  accounts,
  activeCompetition,
  sortingEnabled = true,
}: {
  accounts: RemoteData<LeaderboardAccount>;
  activeCompetition: CompetitionType | undefined;
  sortingEnabled?: boolean;
  search?: string;
}) {
  const currentAccount = useLeaderboardCurrentAccount();
  const perPage = 20;
  const { isLoading, data } = accounts;
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<LeaderboardAccountField>("totalQualifyingPnl");
  const [direction, setDirection] = useState<number>(1);
  const handleColumnClick = useCallback(
    (key: string) => {
      if (key === "wins") {
        setOrderBy(orderBy === "wins" ? "losses" : "wins");
        setDirection(1);
      } else if (key === orderBy) {
        setDirection((d: number) => -1 * d);
      } else {
        setOrderBy(key as LeaderboardAccountField);
        setDirection(1);
      }
    },
    [orderBy]
  );
  const isCompetitions = Boolean(activeCompetition);
  const isMobile = useMedia("(max-width: 400px)");

  useLayoutEffect(() => {
    if (!isCompetitions) return;

    if (activeCompetition === "notionalPnl") {
      setOrderBy("totalQualifyingPnl");
      setDirection(1);
    }
    if (activeCompetition === "pnlPercentage") {
      setOrderBy("pnlPercentage");
      setDirection(1);
    }
  }, [activeCompetition, isCompetitions]);

  // const [search, setSearch] = useState("");
  // const setValue = useCallback((e) => setSearch(e.target.value), []);
  // const handleKeyDown = useCallback(() => null, []);
  const ranks = useLeaderboardAccountsRanks();
  const term = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [term]);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const key = orderBy;

      if (typeof a[key] === "bigint" && typeof b[key] === "bigint") {
        return direction * ((a[key] as bigint) > (b[key] as bigint) ? -1 : 1);
      } else if (typeof a[key] === "number" && typeof b[key] === "number") {
        return direction * (a[key] > b[key] ? -1 : 1);
      } else {
        return 1;
      }
    });
  }, [data, direction, orderBy]);

  const filteredStats = useMemo(() => {
    const q = term.toLowerCase().trim();
    return sorted.filter((a) => a.account.toLowerCase().indexOf(q) >= 0);
  }, [sorted, term]);

  const indexFrom = (page - 1) * perPage;
  const activeRank = activeCompetition === "pnlPercentage" ? ranks.pnlPercentage : ranks.pnl;
  const rowsData = useMemo(
    () =>
      filteredStats.slice(indexFrom, indexFrom + perPage).map((leaderboardAccount, i) => ({
        account: leaderboardAccount,
        index: i,
        rank: activeRank.get(leaderboardAccount.account) ?? null,
      })),
    [activeRank, filteredStats, indexFrom]
  );
  const pinnedRowData = useMemo(() => {
    if (!currentAccount) return undefined;
    if (term) return undefined;

    const rank = activeRank.get(currentAccount.account) ?? null;
    return {
      account: currentAccount,
      index: 0,
      rank,
    };
  }, [activeRank, currentAccount, term]);
  const pageCount = Math.ceil(filteredStats.length / perPage);

  const getSortableClass = useCallback(
    (key: LeaderboardAccountField) =>
      sortingEnabled
        ? cx(
            orderBy === key || (key === "wins" && orderBy === "losses")
              ? direction > 0
                ? "sorted-asc"
                : "sorted-desc"
              : "sortable"
          )
        : undefined,
    [direction, orderBy, sortingEnabled]
  );

  const content = isLoading ? (
    <TopAccountsSkeleton count={perPage} />
  ) : (
    <>
      {pinnedRowData && (
        <TableRow
          account={pinnedRowData.account}
          index={-1}
          pinned
          rank={pinnedRowData.rank}
          activeCompetition={activeCompetition}
        />
      )}
      {rowsData.length ? (
        rowsData.map(({ account, index, rank }) => {
          return (
            <TableRow
              key={account.account}
              account={account}
              index={index}
              pinned={false}
              rank={rank}
              activeCompetition={activeCompetition}
            />
          );
        })
      ) : (
        <EmptyRow />
      )}
    </>
  );

  const contentMobile = isLoading ? (
    <TopAccountsMobileSkeleton count={perPage} />
  ) : rowsData.length ? (
    rowsData.map(({ account, index, rank }) => {
      return (
        <Link
          target="_blank"
          className="Leaderboard-mobile-row"
          to={buildAccountDashboardUrl(account.account as Address, undefined, 2)}
        >
          <div className="left-column">
            <div className="flex items-center">
              <p className="rank">{rank}</p>
              <div className="relative">
                <Jazzicon diameter={40} seed={jsNumberForAddress(account.account)} />
                {rank === 1 ? <p className="absolute -bottom-6 -right-6 text-[24px]">🥇</p> : null}
                {rank === 2 ? <p className="absolute -bottom-6 -right-6 text-[24px]">🥈</p> : null}
                {rank === 3 ? <p className="absolute -bottom-6 -right-6 text-[24px]">🥉</p> : null}
              </div>
            </div>
            <p className="address">{shortenAddress(account.account.replace(/^0x/, ""), 10, 0)}</p>
          </div>
          <div className="right-column h-full">
            <div>
              <p
                className={
                  getSignedValueClassName(account.totalQualifyingPnl) === "neutral"
                    ? ""
                    : getSignedValueClassName(account.totalQualifyingPnl)
                }
                style={{
                  color: account.totalQualifyingPnl === 0n ? "rgba(255, 255, 255, 0.64)" : undefined,
                }}
              >
                ${formatDelta(account.totalQualifyingPnl, { signed: true }).split(".")[0]}.
                <span
                  style={{
                    color:
                      account.totalQualifyingPnl === 0n
                        ? "rgba(255, 255, 255, 0.24)"
                        : account.totalQualifyingPnl < 0
                          ? "rgba(255, 48, 62, .24)"
                          : "rgba(51, 172, 66, 0.24)",
                  }}
                >
                  {formatDelta(account.totalQualifyingPnl, { signed: true }).split(".")[1]}
                </span>
              </p>
              <span
                className={getSignedValueClassName(account.pnlPercentage) + " px-6 py-1"}
                style={{
                  background:
                    account.pnlPercentage === 0n
                      ? "transparent"
                      : account.totalQualifyingPnl < 0
                        ? "rgba(255, 48, 62, .24)"
                        : "rgba(51, 172, 66, 0.24)",
                  color: account.pnlPercentage === 0n ? "rgba(255, 255, 255, 0.24)" : undefined,
                  borderRadius: 10,
                }}
              >
                {formatDelta(account.pnlPercentage, { signed: true, postfix: "%", decimals: 2 })}
              </span>
            </div>
            <p className="text-14" style={{ color: "rgba(255, 255, 255, 0.24)" }}>
              AVG.LVG.
              <span
                style={{ color: "rgba(255, 255, 255, 0.64)" }}
              >{`${formatAmount(account.averageLeverage ?? 0n, 4, 2)}x`}</span>
            </p>
          </div>
        </Link>
      );
    })
  ) : (
    <div className="flex h-[300px] w-full items-center justify-center">
      <p>
        <Trans>No results found</Trans>
      </p>
    </div>
  );

  return (
    <div>
      {/* <div className="TableBox__head">
        <SearchInput
          placeholder={t`Search Address`}
          className="LeaderboardSearch"
          value={search}
          setValue={setValue}
          onKeyDown={handleKeyDown}
          size="s"
        />
      </div> */}
      {!isMobile ? (
        <div className="TableBox">
          <table className={cx("Exchange-list", "App-box", "Table", "bg-black")} style={{ background: "#000" }}>
            <tbody>
              <tr className="Exchange-list-header">
                <TableHeaderCell
                  title={"RANK"}
                  width={6}
                  // tooltip={t`Only addresses with over ${formatUsd(MIN_COLLATERAL_USD_IN_LEADERBOARD, {
                  //   displayDecimals: 0,
                  // })} in "Capital Used" are ranked.`}
                  // tooltipPosition="bottom-start"
                  columnName="rank"
                />
                <TableHeaderCell title={t`Address`} width={12} tooltipPosition="bottom-end" columnName="account" />
                <TableHeaderCell
                  title={t`PnL ($)`}
                  width={6}
                  isRight
                  tooltip={t`The total realized and unrealized profit and loss for the period, including fees and price impact.`}
                  tooltipPosition="bottom-end"
                  onClick={handleColumnClick}
                  columnName="totalQualifyingPnl"
                  className={getSortableClass("totalQualifyingPnl")}
                />
                <TableHeaderCell
                  title={t`PnL (%)`}
                  width={6}
                  isRight
                  tooltip={
                    <Trans>
                      The PnL ($) compared to the capital used.
                      <br />
                      <br />
                      The capital used is calculated as the highest value of [
                      <i>sum of collateral of open positions - realized PnL + period start pending PnL</i>].
                    </Trans>
                  }
                  tooltipPosition="bottom-end"
                  onClick={handleColumnClick}
                  columnName="pnlPercentage"
                  className={getSortableClass("pnlPercentage")}
                />
                <TableHeaderCell
                  title={t`Avg. Size`}
                  width={6}
                  isRight
                  tooltip={t`Average position size.`}
                  tooltipPosition="bottom-end"
                  onClick={handleColumnClick}
                  columnName="averageSize"
                  className={getSortableClass("averageSize")}
                />
                <TableHeaderCell
                  title={t`Avg. Lev.`}
                  width={4}
                  isRight
                  tooltip={t`Average leverage used.`}
                  tooltipPosition="bottom-end"
                  onClick={handleColumnClick}
                  columnName="averageLeverage"
                  className={getSortableClass("averageLeverage")}
                />
                <TableHeaderCell
                  title={t`Win/Loss`}
                  width={4}
                  tooltip={t`Wins and losses for fully closed positions.`}
                  tooltipPosition="bottom-end"
                  onClick={handleColumnClick}
                  columnName="wins"
                  isRight
                  className={cx("text-right", getSortableClass("wins"))}
                />
              </tr>
              {content}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ marginLeft: -16, marginRight: -16 }}>{contentMobile}</div>
      )}
      <div className="TableBox__footer">
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}

const TableHeaderCell = memo(
  ({
    breakpoint,
    columnName,
    title,
    className,
    onClick,
    tooltip,
    tooltipPosition,
    width,
    isRight,
  }: {
    title: string;
    className?: string;
    tooltip?: ReactNode;
    tooltipPosition?: TooltipPosition;
    onClick?: (columnName: string) => void;
    columnName: string;
    width?: number | ((breakpoint?: string) => number);
    breakpoint?: string;
    isRight?: boolean;
  }) => {
    const style =
      width !== undefined
        ? {
            width: `${typeof width === "function" ? width(breakpoint) : width}%`,
          }
        : undefined;

    const handleClick = useCallback(() => onClick?.(columnName), [columnName, onClick]);
    const stopPropagation = useCallback((e) => e.stopPropagation(), []);
    const renderContent = useCallback(() => <div onClick={stopPropagation}>{tooltip}</div>, [stopPropagation, tooltip]);

    return (
      <th onClick={handleClick} className={cx("TableHeader", className)} style={style}>
        {/* {tooltip ? (
          <TooltipWithPortal
            handle={<span className="TableHeaderTitle">{title}</span>}
            position={tooltipPosition || "bottom"}
            className="TableHeaderTooltip"
            renderContent={renderContent}
          />
        ) : ( */}
        <div className={cx("flex w-full items-center  whitespace-nowrap", { "justify-end": isRight })}>
          <span className="TableHeaderMainTitle">{title}</span>
          <span className="TableHeaderTitle"></span>
        </div>
        {/* )} */}
      </th>
    );
  }
);

const TableRow = memo(
  ({
    account,
    pinned,
    rank,
    activeCompetition,
    index,
  }: {
    account: LeaderboardAccount;
    index: number;
    pinned: boolean;
    rank: number | null;
    activeCompetition: CompetitionType | undefined;
  }) => {
    const renderWinsLossesTooltipContent = useCallback(() => {
      const winRate = `${((account.wins / (account.wins + account.losses)) * 100).toFixed(2)}%`;
      return (
        <div>
          <StatsTooltipRow label={t`Total Trades`} showDollar={false} value={account.wins + account.losses} />
          {account.wins + account.losses > 0 ? (
            <StatsTooltipRow label={t`Win Rate`} showDollar={false} value={winRate} />
          ) : null}
        </div>
      );
    }, [account.losses, account.wins]);

    const renderPnlTooltipContent = useCallback(() => <LeaderboardPnlTooltipContent account={account} />, [account]);

    return (
      <tr className={getRowClassname(rank, activeCompetition, pinned)} key={account.account}>
        <TableCell className="rank">
          <span className={getWinnerRankClassname(rank, activeCompetition)}>
            <RankInfo rank={rank} hasSomeCapital={account.totalQualifyingPnl !== 0n} />
          </span>
        </TableCell>
        <TableCell>
          <AddressView size={20} address={account.account} breakpoint="XL" />
        </TableCell>
        <TableCell className="!text-right">
          {/* <TooltipWithPortal
            handle={
              <span className={getSignedValueClassName(account.totalQualifyingPnl)}>
                {formatDelta(account.totalQualifyingPnl, { signed: true, prefix: "$" })}
              </span>
            }
            position={index > 7 ? "top" : "bottom"}
            className="whitespace-nowrap"
            renderContent={renderPnlTooltipContent}
          /> */}
          <span
            className={
              getSignedValueClassName(account.totalQualifyingPnl) === "neutral"
                ? ""
                : getSignedValueClassName(account.totalQualifyingPnl)
            }
            style={{
              color: account.totalQualifyingPnl === 0n ? "rgba(255, 255, 255, 0.64)" : undefined,
            }}
          >
            ${formatDelta(account.totalQualifyingPnl, { signed: true }).split(".")[0]}.
            <span
              style={{
                color:
                  account.totalQualifyingPnl === 0n
                    ? "rgba(255, 255, 255, 0.24)"
                    : account.totalQualifyingPnl < 0
                      ? "rgba(255, 48, 62, .24)"
                      : "rgba(51, 172, 66, 0.24)",
              }}
            >
              {formatDelta(account.totalQualifyingPnl, { signed: true }).split(".")[1]}
            </span>
          </span>
        </TableCell>
        <TableCell className="!text-right">
          {/* <TooltipWithPortal
            handle={
              <span className={getSignedValueClassName(account.pnlPercentage)}>
                {formatDelta(account.pnlPercentage, { signed: true, postfix: "%", decimals: 2 })}
              </span>
            }
            position={index > 7 ? "top" : "bottom"}
            className="whitespace-nowrap"
            renderContent={() => (
              <StatsTooltipRow
                label={t`Capital Used`}
                showDollar={false}
                value={<span>{formatUsd(account.maxCapital)}</span>}
              />
            )}
          /> */}
          <span
            className={getSignedValueClassName(account.pnlPercentage) + " px-6 py-1"}
            style={{
              background:
                account.pnlPercentage === 0n
                  ? "transparent"
                  : account.totalQualifyingPnl < 0
                    ? "rgba(255, 48, 62, .24)"
                    : "rgba(51, 172, 66, 0.24)",
              color: account.pnlPercentage === 0n ? "rgba(255, 255, 255, 0.24)" : undefined,
              borderRadius: 10,
            }}
          >
            {formatDelta(account.pnlPercentage, { signed: true, postfix: "%", decimals: 2 })}
          </span>
        </TableCell>
        <TableCell className="!text-right">
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
            {account.averageSize ? formatUsd(account.averageSize)?.split(".")[0] : "$0"}.
          </span>
          <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
            {account.averageSize ? formatUsd(account.averageSize)?.split(".")[1] : "00"}
          </span>
        </TableCell>
        <TableCell className="!text-right">
          <span
            style={{ color: "rgba(255, 255, 255, 0.64)" }}
          >{`${formatAmount(account.averageLeverage ?? 0n, 4, 2)}x`}</span>
        </TableCell>
        <TableCell className="text-right">
          {/* <TooltipWithPortal
            handle={`${account.wins}/${account.losses}`}
            renderContent={renderWinsLossesTooltipContent}
          /> */}
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>{`${account.wins}/${account.losses}`}</span>
        </TableCell>
      </tr>
    );
  }
);

const TableCell = memo(({ children, className }: { children: ReactNode; className?: string }) => {
  return <td className={className}>{children}</td>;
});

const EmptyRow = memo(() => {
  return (
    <tr className="Table_tr">
      <td colSpan={7} className="Table_no-results-row">
        <Trans>No results found</Trans>
      </td>
    </tr>
  );
});

const RankInfo = memo(({ rank, hasSomeCapital }: { rank: number | null; hasSomeCapital: boolean }) => {
  const isCompetition = useLeaderboardIsCompetition();

  const message = useMemo(() => {
    if (rank !== null) return null;

    let msg = t`You have not traded during the selected period.`;
    if (hasSomeCapital)
      msg = t`You have yet to reach the minimum "Capital Used" of ${formatUsd(MIN_COLLATERAL_USD_IN_LEADERBOARD, {
        displayDecimals: 0,
      })} to qualify for the rankings.`;
    else if (isCompetition) msg = t`You do not have any eligible trade during the competition window.`;
    return msg;
  }, [hasSomeCapital, isCompetition, rank]);
  const tooltipContent = useCallback(() => message, [message]);

  if (rank === null) return <p>{t`NA`}</p>;

  return <span>{rank}</span>;
});

const LeaderboardPnlTooltipContent = memo(({ account }: { account: LeaderboardAccount }) => {
  const [isPnlAfterFees] = useLocalStorageSerializeKey("leaderboardPnlAfterFees", true);
  const [type] = useLeaderboardTimeframeTypeState();
  const isCompetition = useLeaderboardIsCompetition();
  const shouldShowStartValues = isCompetition || type !== "all";

  const realizedFees = useMemo(() => account.realizedFees * -1n, [account.realizedFees]);
  const realizedPnl = useMemo(
    () => (isPnlAfterFees ? account.realizedPnl + realizedFees + account.realizedPriceImpact : account.realizedPnl),
    [account.realizedPnl, account.realizedPriceImpact, isPnlAfterFees, realizedFees]
  );

  const unrealizedFees = useMemo(() => account.unrealizedFees * -1n, [account.unrealizedFees]);
  const unrealizedPnl = useMemo(
    () => (isPnlAfterFees ? account.unrealizedPnl + unrealizedFees : account.unrealizedPnl),
    [account.unrealizedPnl, isPnlAfterFees, unrealizedFees]
  );

  const startUnrealizedFees = useMemo(() => account.startUnrealizedFees * -1n, [account.startUnrealizedFees]);
  const startUnrealizedPnl = useMemo(
    () => (isPnlAfterFees ? account.startUnrealizedPnl + startUnrealizedFees : account.startUnrealizedPnl),
    [account.startUnrealizedPnl, isPnlAfterFees, startUnrealizedFees]
  );

  return (
    <div>
      <StatsTooltipRow
        label={t`Realized PnL`}
        showDollar={false}
        value={
          <span className={getSignedValueClassName(realizedPnl)}>
            {formatDelta(realizedPnl, { signed: true, prefix: "$" })}
          </span>
        }
      />
      <StatsTooltipRow
        label={t`Unrealized PnL`}
        showDollar={false}
        value={
          <span className={getSignedValueClassName(unrealizedPnl)}>
            {formatDelta(unrealizedPnl, { signed: true, prefix: "$" })}
          </span>
        }
      />
      {shouldShowStartValues && (
        <StatsTooltipRow
          label={t`Start Unrealized PnL`}
          showDollar={false}
          value={
            <span className={getSignedValueClassName(startUnrealizedPnl)}>
              {formatDelta(startUnrealizedPnl, { signed: true, prefix: "$" })}
            </span>
          }
        />
      )}
      {!isPnlAfterFees && (
        <>
          <br />
          <StatsTooltipRow
            label={t`Realized Fees`}
            showDollar={false}
            value={
              <span className={getSignedValueClassName(realizedFees)}>
                {formatDelta(realizedFees, { signed: true, prefix: "$" })}
              </span>
            }
          />
          <StatsTooltipRow
            label={t`Unrealized Fees`}
            showDollar={false}
            value={
              <span className={getSignedValueClassName(unrealizedFees)}>
                {formatDelta(unrealizedFees, { signed: true, prefix: "$" })}
              </span>
            }
          />
          {shouldShowStartValues && (
            <StatsTooltipRow
              label={t`Start Unrealized Fees`}
              showDollar={false}
              value={
                <span className={getSignedValueClassName(startUnrealizedFees)}>
                  {formatDelta(startUnrealizedFees, { signed: true, prefix: "$" })}
                </span>
              }
            />
          )}
          <br />
          <StatsTooltipRow
            label={t`Realized Price Impact`}
            showDollar={false}
            value={
              <span className={getSignedValueClassName(account.realizedPriceImpact)}>
                {formatDelta(account.realizedPriceImpact, { signed: true, prefix: "$" })}
              </span>
            }
          />
        </>
      )}
    </div>
  );
});

function formatDelta(
  delta: bigint,
  {
    decimals = USD_DECIMALS,
    displayDecimals = 2,
    useCommas = true,
    ...p
  }: {
    decimals?: number;
    displayDecimals?: number;
    useCommas?: boolean;
    prefixoid?: string;
    signed?: boolean;
    prefix?: string;
    postfix?: string;
  } = {}
) {
  return `${p.prefixoid ? `${p.prefixoid} ` : ""}${p.signed ? (delta === 0n ? "" : delta > 0 ? "+" : "-") : ""}${
    p.prefix || ""
  }${formatAmount(p.signed ? bigMath.abs(delta) : delta, decimals, displayDecimals, useCommas)}${p.postfix || ""}`;
}

function getSignedValueClassName(num: bigint) {
  return num === 0n ? "neutral" : num < 0 ? "negative" : "positive";
}
