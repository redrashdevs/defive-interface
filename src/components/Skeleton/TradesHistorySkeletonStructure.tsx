import Skeleton from "react-loading-skeleton";

type Props = {
  withTimestamp?: boolean;
};

export default function TradesHistorySkeletonStructure(props: Props) {
  return (
    <tr>
      <td>
        <Skeleton width={150} count={1} />
        <Skeleton width={120} count={1} />
        {props.withTimestamp && <Skeleton width={300} className="max-w-full" count={1} />}
      </td>
      <td>
        <Skeleton width={110} count={1} />
      </td>
      <td>
        <Skeleton width={110} />
      </td>
      <td>
        <Skeleton width={90} />
      </td>
      <td className="TradeHistoryRow-pnl-fees">
        <Skeleton width={60} />
      </td>
    </tr>
  );
}

export function TradesHistoryMobileSkeletonStructure(props: Props) {
  return (
    <div
      style={{ borderColor: "#36363D" }}
      className="border-b-[1px] border-dotted p-[16px] last-of-type:border-b-[0]"
      data-qa="position-item"
    >
      <div className="flex flex-grow flex-col">
        <div className="flex-grow">
          <div className="flex items-center">
            <Skeleton width={40} height={40} circle />
            <div className="ml-[8px] flex flex-col justify-center">
              <div className="mb-[4px] flex items-center whitespace-nowrap">
                <Skeleton width={150} height={24} />
              </div>
              <Skeleton width={90} height={16} />
            </div>
          </div>

          <div className="-gap-2 mt-[16px] grid grid-cols-2">
            <div>
              <Skeleton width={45} height={16} />
              <Skeleton width={110} height={16} />
            </div>
            <div>
              <Skeleton width={45} height={16} />
              <Skeleton width={110} height={16} />
            </div>
            <div className="pt-[16px]">
              <Skeleton width={45} height={16} />
              <Skeleton width={110} height={16} />
            </div>

            <div className="pt-[16px]">
              <Skeleton width={45} height={16} />
              <Skeleton width={110} height={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
