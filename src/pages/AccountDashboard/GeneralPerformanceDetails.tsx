import type { Address } from "viem";

import { formatPercentage, formatUsd } from "lib/numbers";
import { usePnlSummaryData } from "domain/synthetics/accountStats/usePnlSummaryData";
import Skeleton from "react-loading-skeleton";

const SkeletonProps = {
  count: 1,
  width: 100,
  baseColor: "rgba(255, 255, 255, 0.12)",
  highlightColor: "#fff",
};
export function GeneralPerformanceDetails({
  chainId,
  account,
  activeTimeFrame,
}: {
  chainId: number;
  account: Address;
  activeTimeFrame: 0 | 2 | 3 | 4 | 5;
}) {
  const { data, error, loading } = usePnlSummaryData(chainId, account);
  const getVolume = () => {
    if (loading) return <Skeleton {...SkeletonProps} />;
    return (
      <span style={{ color: "#fff" }}>
        {data[activeTimeFrame].volume
          ? formatUsd(data[activeTimeFrame].volume, { maxThreshold: null })?.split(".")[0]
          : "$0"}
        .
        <span style={{ color: "rgba(255, 255, 255, 0.24)" }}>
          {data[activeTimeFrame].volume
            ? formatUsd(data[activeTimeFrame].volume, { maxThreshold: null })?.split(".")[1]
            : "00"}
        </span>
      </span>
    );
  };

  const getPnlPercentage = () => {
    if (loading) return <Skeleton {...SkeletonProps} />;
    return (
      <span className={getSignedValueClassName(data[activeTimeFrame].pnlBps)} style={{ borderRadius: 10 }}>
        {formatPercentage(data[activeTimeFrame].pnlBps, { signed: true })}
      </span>
    );
  };

  const getPnlAmount = () => {
    if (loading) return <Skeleton {...SkeletonProps} />;
    return (
      <span className={getSignedValueClassName(data[activeTimeFrame].pnlUsd)}>
        {formatUsd(data[activeTimeFrame].pnlUsd)!.split(".")[0]}.
        <span
          style={{
            color:
              getSignedValueClassName(data[activeTimeFrame].pnlUsd) === "positive"
                ? "rgba(51, 172, 66, 0.24)"
                : "rgba(255, 48, 62, .24)",
          }}
        >
          {formatUsd(data[activeTimeFrame].pnlUsd)!.split(".")[1]}
        </span>
      </span>
    );
  };

  const getWinLoss = () => {
    if (loading) return <Skeleton {...SkeletonProps} />;
    return data[activeTimeFrame].wins + "/" + data[activeTimeFrame].losses;
  };
  return (
    <div className="mt-14">
      <div className="general-performance-holder my-12 px-24 py-4">
        {error ? (
          <div className="whitespace-pre-wrap font-mono text-red-500">{JSON.stringify(error, null, 2)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="flex h-[72px] flex-col items-start justify-evenly">
              <p className="title">Vol</p>
              <p className="subtitle">{getVolume()}</p>
            </div>
            <div className="flex h-[72px] flex-col items-start justify-evenly">
              <p className="title">PNL ($)</p>
              <p className="subtitle">{getPnlAmount()}</p>
            </div>
            <div className="flex h-[72px] flex-col items-start justify-evenly">
              <p className="title">PNL (%)</p>
              <p className="subtitle">{getPnlPercentage()}</p>
            </div>
            <div className="flex h-[72px] flex-col items-start justify-evenly">
              <p className="title">Win/Loss</p>
              <p className="subtitle">{getWinLoss()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getSignedValueClassName(num: bigint) {
  return num === 0n ? "" : num < 0 ? "negative" : "positive";
}
