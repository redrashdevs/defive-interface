import Skeleton from "react-loading-skeleton";

export function LeaderboardTopAccountsStructure() {
  return (
    <tr>
      <td>
        <Skeleton className="my-5" width={40} />
      </td>
      <td>
        <Skeleton width={250} />
      </td>
      <td>
        <Skeleton />
      </td>
      <td>
        <Skeleton />
      </td>
      <td>
        <Skeleton />
      </td>
      <td>
        <Skeleton width={100} />
      </td>
      <td>
        <Skeleton width={110} />
      </td>
    </tr>
  );
}

export function LeaderboardTopAccountsMobileStructure() {
  return (
    <div className="Leaderboard-mobile-row">
      <div className="left-column">
        <div className="flex items-center">
        <Skeleton width={10} />
          <div className="relative">
            <Skeleton circle width={40} height={40} className="ml-[14px]" />
          </div>
        </div>
        <Skeleton width={100} className="ml-[24px] mt-8" />
      </div>
      <div className="right-column h-full">
        <div>
          <Skeleton  width={100} />
          <Skeleton width={50} />
        </div>
        <Skeleton width={100} />
      </div>
    </div>
  );
}
