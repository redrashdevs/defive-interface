import { t } from "@lingui/macro";
import cx from "classnames";

import TokenIcon from "components/TokenIcon/TokenIcon";

export function MarketWithDirectionLabel({
  indexName,
  isLong,
  tokenSymbol,
  bordered,
  iconImportSize,
}: {
  indexName: string;
  isLong: boolean;
  tokenSymbol: string;
  bordered?: boolean;
  iconImportSize?: 24 | 40;
}) {
  return (
    <div
      className={cx("inline leading-base text-white font-[500] text-[12px]", {
        "cursor-help border-b border-dashed border-b-gray-400": bordered,
      })}
    >
      {/* <span className={cx(isLong ? "text-green-500" : "text-red-500")}>{isLong ? t`Long` : t`Short`}</span> */}
      <TokenIcon className="mr-5 w-[16px] h-[16px]" displaySize={20} symbol={tokenSymbol} importSize={iconImportSize} />
      <span>{indexName}</span>
    </div>
  );
}
