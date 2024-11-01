import { ReactNode } from "react";
import cx from "classnames";
import "./StatsTooltip.css";

export type StatsTooltipRowProps = {
  textClassName?: string;
  labelClassName?: string;
  label: string | ReactNode;
  value: number | string | string[] | number[] | ReactNode;
  showDollar?: boolean;
  unit?: string;
  showColon?: boolean;
};

export default function StatsTooltipRow({
  label,
  value,
  textClassName = "text-white",
  labelClassName = "text-gray-300",
  showDollar = true,
  unit,
  showColon = true,
}: StatsTooltipRowProps) {
  function renderValue() {
    if (Array.isArray(value)) {
      return (
        <ul className="Tooltip-row-value text-[16px] font-[500] !text-[#000] opacity-60">
          {value.map((v, i) => (
            <li className={textClassName} key={i}>
              {v}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <span className={cx("Tooltip-row-value text-[16px] font-[500] !text-[#67677A] opacity-60", textClassName)}>
        {showDollar && "$"}
        {value}
        {unit || ""}
      </span>
    );
  }

  function renderLabel() {
    if (typeof label === "string") {
      return showColon ? `${label}:` : label;
    }

    return label;
  }

  return (
    <div className={cx("Tooltip-row", textClassName)}>
      <span className={cx("Tooltip-row-label !text-[10px] !font-[500] !text-[#67677A]", labelClassName)}>
        {renderLabel()}
      </span>
      {renderValue()}
    </div>
  );
}
