import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import AddressView from "components/AddressView/AddressView";
import Pagination from "components/Pagination/Pagination";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { useDebounce } from "lib/useDebounce";
import { ReactNode, memo, useCallback, useEffect, useMemo, useState } from "react";

import SearchInput from "components/SearchInput/SearchInput";
import { TopAccountsMobileSkeleton, TopPositionsSkeleton } from "components/Skeleton/Skeleton";
import TokenIcon from "components/TokenIcon/TokenIcon";
import { TooltipPosition } from "components/Tooltip/Tooltip";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";
import { useTokenInfo } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { useLeaderboardIsCompetition } from "context/SyntheticsStateContext/hooks/leaderboardHooks";
import { useMarketInfo } from "context/SyntheticsStateContext/hooks/marketHooks";
import {
  selectPositionConstants,
  selectUserReferralInfo,
} from "context/SyntheticsStateContext/selectors/globalSelectors";
import { makeSelectMarketPriceDecimals } from "context/SyntheticsStateContext/selectors/statsSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { LeaderboardPosition, RemoteData } from "domain/synthetics/leaderboard";
import { MIN_COLLATERAL_USD_IN_LEADERBOARD } from "domain/synthetics/leaderboard/constants";
import { getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets";
import { getLiquidationPrice } from "domain/synthetics/positions";
import { bigMath } from "lib/bigmath";
import { USD_DECIMALS } from "config/factors";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { formatAmount, formatTokenAmountWithUsd, formatUsd } from "lib/numbers";
import { useMedia } from "react-use";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { shortenAddress } from "@/lib/legacy";
import { buildAccountDashboardUrl } from "@/pages/AccountDashboard/AccountDashboard";
import { Address } from "viem";
import { Link } from "react-router-dom";

function getWinnerRankClassname(rank: number | null) {
  if (rank === null) return undefined;
  if (rank <= 3) return `LeaderboardRank-${rank}`;

  return undefined;
}

type LeaderboardPositionField = keyof LeaderboardPosition;

export function LeaderboardPositionsTable({
  positions,
  search,
}: {
  positions: RemoteData<LeaderboardPosition>;
  search?: string;
}) {
  const perPage = 20;
  const { isLoading, data } = positions;
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<LeaderboardPositionField>("qualifyingPnl");
  const [direction, setDirection] = useState<number>(1);
  const handleColumnClick = useCallback(
    (key: string) => {
      if (key === orderBy) {
        setDirection((d: number) => -1 * d);
      } else {
        setOrderBy(key as LeaderboardPositionField);
        setDirection(1);
      }
    },
    [orderBy]
  );

  // const [search, setSearch] = useState("");
  // const setValue = useCallback((e) => setSearch(e.target.value), []);
  // const handleKeyDown = useCallback(() => null, []);
  const isMobile = useMedia("(max-width: 400px)");
  const term = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
    console.log("HEREE", search);
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
  const rowsData = useMemo(
    () =>
      filteredStats.slice(indexFrom, indexFrom + perPage).map((position, i) => ({
        position,
        index: i,
        rank: position.rank,
      })),
    [filteredStats, indexFrom]
  );

  const pageCount = Math.ceil(filteredStats.length / perPage);

  const getSortableClass = useCallback(
    (key: LeaderboardPositionField) =>
      cx(orderBy === key ? (direction > 0 ? "sorted-asc" : "sorted-desc") : "sortable"),
    [direction, orderBy]
  );

  const content = isLoading ? (
    <TopPositionsSkeleton count={perPage} />
  ) : (
    <>
      {rowsData.length ? (
        rowsData.map(({ position: position, index, rank }) => {
          return <TableRow key={position.key} position={position} index={index} rank={rank} />;
        })
      ) : (
        <EmptyRow />
      )}
    </>
  );

  const contentMobile = isLoading ? (
    <TopAccountsMobileSkeleton count={perPage} />
  ) : rowsData.length ? (
    rowsData.map(({ position: position, index, rank }) => {
      return <TableRowMobile key={position.key} position={position} index={index} rank={rank} />;
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
          <table className={cx("Exchange-list", "App-box", "Table")} style={{ background: "#000" }}>
            <tbody>
              <tr className="Exchange-list-header">
                <TableHeaderCell
                  title={t`Rank`}
                  width={6}
                  tooltip={t`Only positions with over ${formatUsd(MIN_COLLATERAL_USD_IN_LEADERBOARD, {
                    displayDecimals: 0,
                  })} in "Capital Used" are ranked.`}
                  tooltipPosition="bottom-start"
                  columnName="rank"
                />
                <TableHeaderCell title={t`Address`} width={16} tooltipPosition="bottom-end" columnName="account" />
                <TableHeaderCell
                  title={t`PnL ($)`}
                  width={12}
                  tooltip={t`The total realized and unrealized profit and loss for the period, considering price impact and fees but excluding swap fees.`}
                  tooltipPosition="bottom-end"
                  onClick={handleColumnClick}
                  columnName="qualifyingPnl"
                  className={getSortableClass("qualifyingPnl")}
                />
                <TableHeaderCell title={t`Position`} width={10} tooltipPosition="bottom-end" columnName="key" />
                <TableHeaderCell
                  title={t`Entry Price`}
                  width={10}
                  onClick={handleColumnClick}
                  columnName="entryPrice"
                  className={getSortableClass("entryPrice")}
                />
                <TableHeaderCell
                  title={t`Size`}
                  width={12}
                  onClick={handleColumnClick}
                  columnName="sizeInUsd"
                  className={getSortableClass("sizeInUsd")}
                />
                <TableHeaderCell
                  title={t`Lev.`}
                  width={1}
                  onClick={handleColumnClick}
                  columnName="leverage"
                  className={getSortableClass("leverage")}
                />
                <TableHeaderCell
                  title={t`Liq. Price`}
                  width={10}
                  columnName="liquidationPrice"
                  className={cx("text-right")}
                  isRight
                />
              </tr>
              {content}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ marginInline: -16 }}>{contentMobile}</div>
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
    onClick?: (columnName: LeaderboardPositionField | "liquidationPrice") => void;
    columnName: LeaderboardPositionField | "liquidationPrice";
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
        ) : (
          <span className="TableHeaderTitle">{title}</span>
        )} */}
        <div className={cx("flex w-full items-center  whitespace-nowrap", { "justify-end": isRight })}>
          <span className="TableHeaderMainTitle">{title}</span>
          <span className="TableHeaderTitle"></span>
        </div>
      </th>
    );
  }
);

const TableRow = memo(
  ({ position, rank, index }: { position: LeaderboardPosition; index: number; rank: number | null }) => {
    const renderPnlTooltipContent = useCallback(() => <LeaderboardPnlTooltipContent position={position} />, [position]);
    const { minCollateralUsd } = useSelector(selectPositionConstants);
    const userReferralInfo = useSelector(selectUserReferralInfo);

    const collateralToken = useTokenInfo(position.collateralToken);
    const marketInfo = useMarketInfo(position.market);
    const indexToken = marketInfo?.indexToken;

    const liquidationPrice = useMemo(() => {
      if (!collateralToken || !marketInfo || minCollateralUsd === undefined) return undefined;

      return getLiquidationPrice({
        marketInfo,
        collateralToken,
        sizeInUsd: position.sizeInUsd,
        sizeInTokens: position.sizeInTokens,
        collateralUsd: position.collateralUsd,
        collateralAmount: position.collateralAmount,
        minCollateralUsd,
        pendingBorrowingFeesUsd: position.unrealizedFees - position.closingFeeUsd,
        pendingFundingFeesUsd: 0n,
        isLong: position.isLong,
        userReferralInfo,
      });
    }, [
      collateralToken,
      marketInfo,
      minCollateralUsd,
      position.closingFeeUsd,
      position.collateralAmount,
      position.collateralUsd,
      position.isLong,
      position.sizeInTokens,
      position.sizeInUsd,
      position.unrealizedFees,
      userReferralInfo,
    ]);

    const marketDecimals = useSelector(makeSelectMarketPriceDecimals(marketInfo?.indexTokenAddress));

    const indexName = marketInfo ? getMarketIndexName(marketInfo) : "";
    const poolName = marketInfo ? getMarketPoolName(marketInfo) : "";

    const renderPositionTooltip = useCallback(() => {
      return (
        <>
          <div className="mr-5 inline-flex items-start leading-1">
            <span>{indexName}</span>
            <span className="subtext">[{poolName}]</span>
          </div>
          <span className={cx(position.isLong ? "positive" : "negative")}>{position.isLong ? t`Long` : t`Short`}</span>
        </>
      );
    }, [indexName, poolName, position.isLong]);

    const renderSizeTooltip = useCallback(() => {
      return (
        <>
          <StatsTooltipRow
            label={t`Collateral`}
            showDollar={false}
            value={formatTokenAmountWithUsd(
              BigInt(position.collateralAmount),
              BigInt(position.collateralUsd),
              collateralToken?.symbol,
              collateralToken?.decimals
            )}
          />
        </>
      );
    }, [collateralToken?.decimals, collateralToken?.symbol, position.collateralAmount, position.collateralUsd]);

    const renderNaLiquidationTooltip = useCallback(
      () =>
        t`There is no liquidation price, as the position's collateral value will increase to cover any negative PnL.`,
      []
    );

    const renderLiquidationTooltip = useCallback(() => {
      const markPrice = indexToken?.prices.maxPrice;
      const shouldRenderPriceChangeToLiq = markPrice !== undefined && liquidationPrice !== undefined;
      return (
        <>
          <StatsTooltipRow
            label={t`Mark Price`}
            value={formatUsd(markPrice, {
              displayDecimals: indexToken?.priceDecimals,
            })}
            showDollar={false}
          />
          {shouldRenderPriceChangeToLiq && (
            <StatsTooltipRow
              label={t`Price change to Liq.`}
              value={formatUsd(liquidationPrice - markPrice, {
                maxThreshold: "1000000",
                displayDecimals: indexToken?.priceDecimals,
              })}
              showDollar={false}
            />
          )}
        </>
      );
    }, [indexToken?.priceDecimals, indexToken?.prices.maxPrice, liquidationPrice]);

    return (
      <tr className="Table_tr" key={position.key}>
        <TableCell className="rank">
          <span className={getWinnerRankClassname(rank)}>
            <RankInfo rank={rank} hasSomeCapital />
          </span>
        </TableCell>
        <TableCell>
          <AddressView size={20} address={position.account} breakpoint="M" />
        </TableCell>
        <TableCell>
          {/* <TooltipWithPortal
            handle={
              <span className={getSignedValueClassName(position.qualifyingPnl)}>
                {formatDelta(position.qualifyingPnl, { signed: true, prefix: "$" })}
              </span>
            }
            position={index > 9 ? "top" : "bottom"}
            className="nowrap"
            renderContent={renderPnlTooltipContent}
          /> */}
          <span className={getSignedValueClassName(position.qualifyingPnl)}>
            ${formatDelta(position.qualifyingPnl, { signed: true }).split(".")[0]}.
            <span
              style={{
                color:
                  getSignedValueClassName(position.qualifyingPnl) === "positive"
                    ? "rgba(51, 172, 66, 0.24)"
                    : "rgba(255, 48, 62, .24)",
              }}
            >
              {formatDelta(position.qualifyingPnl, { signed: true }).split(".")[1]}
            </span>
          </span>
        </TableCell>
        <TableCell>
          {/* <TooltipWithPortal
            handle={
              <span className="">
                {indexToken ? (
                  <TokenIcon
                    className="PositionList-token-icon"
                    symbol={indexToken.symbol}
                    displaySize={20}
                    importSize={24}
                  />
                ) : null}
                <span className="">{marketInfo?.indexToken.symbol}</span>
                <span className={cx("TopPositionsDirection", position.isLong ? "positive" : "negative")}>
                  {position.isLong ? t`Long` : t`Short`}
                </span>
              </span>
            }
            position={index > 9 ? "top" : "bottom"}
            className="nowrap"
            renderContent={renderPositionTooltip}
          /> */}
          <span className="whitespace-nowrap">
            {indexToken ? (
              <TokenIcon
                className="PositionList-token-icon"
                symbol={indexToken.symbol}
                displaySize={20}
                importSize={24}
              />
            ) : null}
            <span className="">{marketInfo?.indexToken.symbol}</span>
            <span className={cx("TopPositionsDirection", position.isLong ? "positive" : "negative")}>
              {position.isLong ? t`Long` : t`Short`}
            </span>
          </span>
        </TableCell>
        <TableCell>
          {/* {formatUsd(position.entryPrice, {
            displayDecimals: marketDecimals,
          })} */}
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
            {
              formatUsd(position.entryPrice, {
                displayDecimals: marketDecimals,
              })?.split(".")[0]
            }
            .
          </span>
          <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
            {
              formatUsd(position.entryPrice, {
                displayDecimals: marketDecimals,
              })?.split(".")[1]
            }
          </span>
        </TableCell>
        <TableCell>
          {/* <TooltipWithPortal
            handle={formatUsd(position.sizeInUsd)}
            position={index > 9 ? "top-end" : "bottom-end"}
            renderContent={renderSizeTooltip}
            tooltipClassName="Table-SizeTooltip"
          /> */}
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>{formatUsd(position.sizeInUsd)?.split(".")[0]}.</span>
          <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>{formatUsd(position.sizeInUsd)?.split(".")[1]}</span>
        </TableCell>
        <TableCell>
          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>{formatAmount(position.leverage, 4, 2)}x</span>
        </TableCell>
        <TableCell className="text-right">
          {/* {liquidationPrice ? (
            <TooltipWithPortal
              position={index > 9 ? "top-end" : "bottom-end"}
              renderContent={renderLiquidationTooltip}
              handle={formatUsd(liquidationPrice, { maxThreshold: "1000000", displayDecimals: marketDecimals })}
            />
          ) : (
            <TooltipWithPortal
              position={index > 9 ? "top-end" : "bottom-end"}
              renderContent={renderNaLiquidationTooltip}
              handle={t`NA`}
            />
          )} */}
          {liquidationPrice ? (
            <span>
              <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
                {
                  formatUsd(liquidationPrice, { maxThreshold: "1000000", displayDecimals: marketDecimals })?.split(
                    "."
                  )[0]
                }
                .
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
                {
                  formatUsd(liquidationPrice, { maxThreshold: "1000000", displayDecimals: marketDecimals })?.split(
                    "."
                  )[1]
                }
              </span>
            </span>
          ) : (
            <Trans>NA</Trans>
          )}
        </TableCell>
      </tr>
    );
  }
);

const TableRowMobile = memo(
  ({ position, rank, index }: { position: LeaderboardPosition; index: number; rank: number | null }) => {
    const renderPnlTooltipContent = useCallback(() => <LeaderboardPnlTooltipContent position={position} />, [position]);
    const { minCollateralUsd } = useSelector(selectPositionConstants);
    const userReferralInfo = useSelector(selectUserReferralInfo);

    const collateralToken = useTokenInfo(position.collateralToken);
    const marketInfo = useMarketInfo(position.market);
    const indexToken = marketInfo?.indexToken;

    const liquidationPrice = useMemo(() => {
      if (!collateralToken || !marketInfo || minCollateralUsd === undefined) return undefined;

      return getLiquidationPrice({
        marketInfo,
        collateralToken,
        sizeInUsd: position.sizeInUsd,
        sizeInTokens: position.sizeInTokens,
        collateralUsd: position.collateralUsd,
        collateralAmount: position.collateralAmount,
        minCollateralUsd,
        pendingBorrowingFeesUsd: position.unrealizedFees - position.closingFeeUsd,
        pendingFundingFeesUsd: 0n,
        isLong: position.isLong,
        userReferralInfo,
      });
    }, [
      collateralToken,
      marketInfo,
      minCollateralUsd,
      position.closingFeeUsd,
      position.collateralAmount,
      position.collateralUsd,
      position.isLong,
      position.sizeInTokens,
      position.sizeInUsd,
      position.unrealizedFees,
      userReferralInfo,
    ]);

    const marketDecimals = useSelector(makeSelectMarketPriceDecimals(marketInfo?.indexTokenAddress));

    const indexName = marketInfo ? getMarketIndexName(marketInfo) : "";
    const poolName = marketInfo ? getMarketPoolName(marketInfo) : "";

    const renderPositionTooltip = useCallback(() => {
      return (
        <>
          <div className="mr-5 inline-flex items-start leading-1">
            <span>{indexName}</span>
            <span className="subtext">[{poolName}]</span>
          </div>
          <span className={cx(position.isLong ? "positive" : "negative")}>{position.isLong ? t`Long` : t`Short`}</span>
        </>
      );
    }, [indexName, poolName, position.isLong]);

    const renderSizeTooltip = useCallback(() => {
      return (
        <>
          <StatsTooltipRow
            label={t`Collateral`}
            showDollar={false}
            value={formatTokenAmountWithUsd(
              BigInt(position.collateralAmount),
              BigInt(position.collateralUsd),
              collateralToken?.symbol,
              collateralToken?.decimals
            )}
          />
        </>
      );
    }, [collateralToken?.decimals, collateralToken?.symbol, position.collateralAmount, position.collateralUsd]);

    const renderLiquidationTooltip = useCallback(() => {
      const markPrice = indexToken?.prices.maxPrice;
      const shouldRenderPriceChangeToLiq = markPrice !== undefined && liquidationPrice !== undefined;
      return (
        <>
          <StatsTooltipRow
            label={t`Mark Price`}
            value={formatUsd(markPrice, {
              displayDecimals: indexToken?.priceDecimals,
            })}
            showDollar={false}
          />
          {shouldRenderPriceChangeToLiq && (
            <StatsTooltipRow
              label={t`Price change to Liq.`}
              value={formatUsd(liquidationPrice - markPrice, {
                maxThreshold: "1000000",
                displayDecimals: indexToken?.priceDecimals,
              })}
              showDollar={false}
            />
          )}
        </>
      );
    }, [indexToken?.priceDecimals, indexToken?.prices.maxPrice, liquidationPrice]);

    return (
      <Link
        target="_blank"
        className="Leaderboard-mobile-row"
        to={buildAccountDashboardUrl(position.account as Address, undefined, 2)}
      >
        <div className="left-column">
          <div className="flex items-center">
            <p className="rank">{rank}</p>
            <div className="relative">
              <Jazzicon diameter={40} seed={jsNumberForAddress(position.account)} />
              {rank === 1 ? <img className="absolute -bottom-6 -right-6" src="/images/rank1.png" /> : null}
              {rank === 2 ? <img className="absolute -bottom-6 -right-6" src="/images/rank2.png" /> : null}
              {rank === 3 ? <img className="absolute -bottom-6 -right-6" src="/images/rank3.png" /> : null}
            </div>
          </div>
          <p className="address">{shortenAddress(position.account.replace(/^0x/, ""), 10, 0)}</p>
        </div>
        <div className="right-column h-full">
          <div>
            <span className="whitespace-nowrap">
              {indexToken ? (
                <TokenIcon
                  className="PositionList-token-icon"
                  symbol={indexToken.symbol}
                  displaySize={20}
                  importSize={24}
                />
              ) : null}
              <span className="">{marketInfo?.indexToken.symbol}</span>
              <span className={cx("TopPositionsDirection", position.isLong ? "positive" : "negative")}>
                {position.isLong ? t`Long` : t`Short`}
              </span>
            </span>
            <br />
            <span className={getSignedValueClassName(position.qualifyingPnl)}>
              ${formatDelta(position.qualifyingPnl, { signed: true }).split(".")[0]}.
              <span
                style={{
                  color:
                    getSignedValueClassName(position.qualifyingPnl) === "positive"
                      ? "rgba(51, 172, 66, 0.24)"
                      : "rgba(255, 48, 62, .24)",
                }}
              >
                {formatDelta(position.qualifyingPnl, { signed: true }).split(".")[1]}
              </span>
            </span>
          </div>

          <span style={{ color: "rgba(255, 255, 255, 0.64)" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>LVG.</span>
            {formatAmount(position.leverage, 4, 2)}x
          </span>
        </div>
      </Link>
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

  if (rank === null)
    return <TooltipWithPortal handleClassName="text-red-500" handle={t`NA`} renderContent={tooltipContent} />;

  return <span>{rank}</span>;
});

const LeaderboardPnlTooltipContent = memo(({ position }: { position: LeaderboardPosition }) => {
  const [isPnlAfterFees] = useLocalStorageSerializeKey("leaderboardPnlAfterFees", true);
  const realizedFees = useMemo(() => position.realizedFees * -1n, [position.realizedFees]);
  const realizedPnl = useMemo(
    () => (isPnlAfterFees ? position.realizedPnl + realizedFees + position.realizedPriceImpact : position.realizedPnl),
    [position.realizedPnl, position.realizedPriceImpact, isPnlAfterFees, realizedFees]
  );

  const unrealizedFees = useMemo(() => position.unrealizedFees * -1n, [position.unrealizedFees]);
  const unrealizedPnl = useMemo(
    () => (isPnlAfterFees ? position.unrealizedPnl + unrealizedFees : position.unrealizedPnl),
    [position.unrealizedPnl, isPnlAfterFees, unrealizedFees]
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
          <br />
          <StatsTooltipRow
            label={t`Realized Price Impact`}
            showDollar={false}
            value={
              <span className={getSignedValueClassName(position.realizedPriceImpact)}>
                {formatDelta(position.realizedPriceImpact, { signed: true, prefix: "$" })}
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
  return num === 0n ? "" : num < 0 ? "negative" : "positive";
}
