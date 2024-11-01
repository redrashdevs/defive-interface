import cx from "classnames";
import { PropsWithChildren, forwardRef } from "react";

export function ExchangeTable(props: PropsWithChildren & React.HTMLProps<HTMLTableElement>) {
  return <table {...props} className="w-full rounded-4 bg-slate-800" />;
}
export function ExchangeTh(props: PropsWithChildren & React.HTMLProps<HTMLTableCellElement>) {
  return (
    <th
      style={{color: 'rgba(255, 255, 255, 0.24)'}}
      {...props}
      className={cx(
        "px-10 py-14 text-left font-normal uppercase text-[10px] first-of-type:pl-14 last-of-type:text-right",
        props.className
      )}
    />
  );
}
export function ExchangeTheadTr({
  bordered,
  ...props
}: PropsWithChildren<{ bordered?: boolean }> & React.HTMLProps<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cx({
        "border-b border-slate-700": bordered,
      })}
    />
  );
}
export const ExchangeTr = forwardRef<
  HTMLTableRowElement,
  PropsWithChildren<{ hoverable?: boolean; bordered?: boolean }> & React.HTMLProps<HTMLTableRowElement>
>(function ExchangeTrInternal({ hoverable = true, bordered = true, ...props }, ref) {
  return (
    <tr
      {...props}
      ref={ref}
      className={cx({
        "border-b border-slate-700 last-of-type:border-b-0": bordered,
        "hover:bg-[#242429]": hoverable,
      })}
    />
  );
});
export function ExchangeTd(props: PropsWithChildren & React.HTMLProps<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={cx(
        "first-of-type:rounded-l-[10px] last-of-type:rounded-r-[10px] px-10 py-14 first-of-type:pl-14  last-of-type:pr-14 last-of-type:[&:not(:first-of-type)]:text-right",
        props.className
      )}
    />
  );
}
