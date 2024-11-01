import cx from "classnames";

import TokenIcon from "components/TokenIcon/TokenIcon";

export function SwapMarketLabel({
  fromSymbol,
  toSymbol,
  bordered,
}: {
  fromSymbol: string | undefined;
  toSymbol: string | undefined;
  bordered?: boolean;
}) {
  return (
    <span className={cx('text-white text-left text-[12px] text-left',{ "cursor-help border-b border-dashed border-b-gray-400": bordered })}>
      {fromSymbol ? <TokenIcon symbol={fromSymbol} displaySize={20} className="relative z-10  w-[16px] h-[16px]" /> : "..."}
      {toSymbol ? <TokenIcon symbol={toSymbol} displaySize={20} className="-ml-10 mr-5 w-[16px] h-[16px]" /> : "..."}
      {fromSymbol}/{toSymbol}
    </span>
  );
}
