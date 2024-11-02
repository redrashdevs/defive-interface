import { Trans } from "@lingui/macro";
import cx from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEffectOnce, useMedia } from "react-use";

import { VersionSwitch } from "components/VersionSwitch/VersionSwitch";
import { getToken, isChartAvailabeForToken } from "config/tokens";

import { selectAvailableChartTokens, selectChartToken } from "context/SyntheticsStateContext/selectors/chartSelectors";
import { selectTradeboxTradeFlags } from "context/SyntheticsStateContext/selectors/tradeboxSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";

import { Token } from "domain/tokens";

import { useChainId } from "lib/chains";

import ChartTokenSelector from "../ChartTokenSelector/ChartTokenSelector";
import { useChartHeaderFormattedValues } from "./useChartHeaderFormattedValues";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";
import { renderNetFeeHeaderTooltipContent } from "../MarketsList/NetFeeHeaderTooltipContent";
import { createPortal } from "react-dom";
import { use24hPriceDelta } from "@/domain/synthetics/tokens";

import cs from "classnames";

const MIN_FADE_AREA = 24; //px
const MAX_SCROLL_LEFT_TO_END_AREA = 50; //px
const MIN_SCROLL_END_SPACE = 5; // px

function TVChartHeaderInfoMobile() {
  const chartToken = useSelector(selectChartToken);
  const { isSwap } = useSelector(selectTradeboxTradeFlags);
  const availableTokens = useSelector(selectAvailableChartTokens);

  const { chainId } = useChainId();
  const chartTokenAddress = chartToken?.address;

  const tokenOptions: Token[] | undefined = availableTokens?.filter((token) =>
    isChartAvailabeForToken(chainId, token.symbol)
  );

  const selectedTokenOption = chartTokenAddress ? getToken(chainId, chartTokenAddress) : undefined;
  const [detailsVisible, setDetailsVisible] = useState(true);

  const dayPriceDeltaRawData = use24hPriceDelta(chainId, chartToken ? chartToken.symbol : "");
  const dayPriceChange = dayPriceDeltaRawData?.deltaPercentageStr[0] === "-" ? "-" : "+";

  const {
    avgPrice,
    dailyVolume,
    // dayPriceDelta,
    high24,
    liquidityLong,
    liquidityShort,
    longOIPercentage,
    longOIValue,
    low24,
    netRateLong,
    netRateShort,
    shortOIPercentage,
    shortOIValue,
  } = useChartHeaderFormattedValues();

  useEffect(() => {
    if (isSwap) {
      setDetailsVisible(false);
    }
  }, [isSwap]);

  const toggleDetailsVisible = useCallback(() => {
    setDetailsVisible((prev) => !prev);
  }, [setDetailsVisible]);

  const isSmallMobile = useMedia("(max-width: 400px)");

  const details = useMemo(() => {
    if (!detailsVisible) {
      return null;
    }

    if (isSwap) {
      return (
        <div
          className={cx("grid gap-14 pt-16", {
            "grid-cols-1 grid-rows-2": isSmallMobile,
            "grid-cols-[repeat(2,_auto)] grid-rows-1": !isSmallMobile,
          })}
        >
          <div>
            <div className="ExchangeChart-info-label mb-4">
              <Trans>24h High</Trans>
            </div>
            <div>${high24}</div>
          </div>
          <div>
            <div className="ExchangeChart-info-label mb-4">
              <Trans>24h Low</Trans>
            </div>
            <div>${low24}</div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cx("grid gap-14 pt-16", {
          "grid-cols-1 grid-rows-4": isSmallMobile,
          "grid-cols-[repeat(2,_auto)] grid-rows-2": !isSmallMobile,
        })}
      >
        <div>
          <div className="ExchangeChart-info-label mb-4">
            <Trans>Available Liquidity</Trans>
          </div>
          <div className="flex flex-row items-center gap-8 text-[14px] font-[500]">
            <div className="flex flex-row items-center gap-8">{liquidityLong}</div>
            <div className="flex flex-row items-center gap-8">{liquidityShort}</div>
          </div>
        </div>

        <div>
          <div className="ExchangeChart-info-label mb-4">
            <TooltipWithPortal disableHandleStyle renderContent={renderNetFeeHeaderTooltipContent}>
              <Trans>Net Rate / 1h</Trans>
            </TooltipWithPortal>
          </div>
          <div className="flex flex-row items-center gap-8 text-[14px] font-[500]">
            <div>{netRateLong}</div>
            <div>{netRateShort}</div>
          </div>
        </div>

        {/* <div>
          <div className="mb-4 whitespace-nowrap text-[1.25rem]">
            <span className="opacity-70">
              <Trans>Open Interest</Trans>
            </span>
            <span className="opacity-70">{" ("}</span>
            <span className="positive">{longOIPercentage}</span>
            <span className="opacity-70">/</span>
            <span className="negative">{shortOIPercentage}</span>
            <span className="opacity-70">{")"}</span>
          </div>
          <div className="flex flex-row items-center gap-8">
            <div className="flex flex-row items-center gap-8">{longOIValue}</div>
            <div className="flex flex-row items-center gap-8">{shortOIValue}</div>
          </div>
        </div> */}

        <div className="flex">
          <div className="w-1/2">
            <div className="ExchangeChart-info-label mb-4">
              <Trans>24h Volume</Trans>
            </div>
            <span className="text-[14px] font-[500]">{dailyVolume}</span>
          </div>
          <div className="w-1/2">
            <div className="ExchangeChart-info-label mb-4">
              <Trans>Open Interest</Trans>
            </div>
            <span className="text-[14px] font-[500]">
              <div className="flex flex-row items-center gap-8">
                <div className="flex flex-row items-center gap-8">{longOIValue}</div>
                <div className="flex flex-row items-center gap-8">{shortOIValue}</div>
              </div>
            </span>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/2">
            <div className="ExchangeChart-info-label mb-4">
              <Trans>24h High</Trans>
            </div>
            <span className="text-[14px] font-[500]">${high24}</span>
          </div>
          <div className="w-1/2">
            <div className="ExchangeChart-info-label mb-4">
              <Trans>24h Low</Trans>
            </div>
            <span className="text-[14px] font-[500]">${low24}</span>
          </div>
        </div>
      </div>
    );
  }, [
    dailyVolume,
    isSwap,
    liquidityLong,
    liquidityShort,
    longOIPercentage,
    longOIValue,
    netRateLong,
    netRateShort,
    shortOIPercentage,
    shortOIValue,
    isSmallMobile,
    detailsVisible,
    high24,
    low24,
  ]);

  return (
    <div className="mb-10 rounded-4 rounded-[12px] bg-[#121214] p-16">
      <div className="w-full">
        <div className="inline-flex w-full justify-between">
          <ChartTokenSelector
            selectedToken={selectedTokenOption}
            options={tokenOptions}
            oneRowLabels={!isSmallMobile}
          />
          <div className="flex h-full flex-col justify-center pt-4">
            <div
              className={cs(
                { negative: dayPriceChange === "-", positive: dayPriceChange === "+" },
                "ExchangeChart-avg-price text-right"
              )}
            >
              {avgPrice}
            </div>
            <div className="text-right text-[12px] font-[500] text-white opacity-30">Mark Price</div>
          </div>

          {/* <div
            className="mt-8 flex cursor-pointer flex-row items-center gap-8"
            role="button"
            onClick={toggleDetailsVisible}
          > */}
          {/* <span
              className={cx("inline-flex cursor-pointer items-center justify-center rounded-4", {
                "bg-slate-700": !detailsVisible,
                "bg-slate-500": detailsVisible,
              })}
            >
              {detailsVisible ? <BiChevronDown size={22} /> : <BiChevronRight size={22} />}
            </span> */}
          {/* <div className="ExchangeChart-avg-price mr-4">{avgPrice}</div>
            <div className="ExchangeChart-daily-change">{dayPriceDelta}</div> */}
          {/* </div> */}
        </div>
        {/* <div className="flex items-start justify-center">
          <VersionSwitch />
        </div> */}
      </div>
      {details}
    </div>
  );
}

function TVChartHeaderInfoDesktop() {
  const chartToken = useSelector(selectChartToken);
  const { isSwap } = useSelector(selectTradeboxTradeFlags);

  const scrollableRef = useRef<HTMLDivElement | null>(null);

  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollRight, setScrollRight] = useState(0);
  const [maxFadeArea, setMaxFadeArea] = useState(75);

  const availableTokens = useSelector(selectAvailableChartTokens);

  const { chainId } = useChainId();
  const chartTokenAddress = chartToken?.address;

  const dayPriceDeltaRawData = use24hPriceDelta(chainId, chartToken ? chartToken.symbol : "");
  const dayPriceChange = dayPriceDeltaRawData?.deltaPercentageStr[0] === "-" ? "-" : "+";

  const tokenOptions: Token[] | undefined = availableTokens?.filter((token) =>
    isChartAvailabeForToken(chainId, token.symbol)
  );

  const selectedTokenOption = chartTokenAddress ? getToken(chainId, chartTokenAddress) : undefined;

  const setScrolls = useCallback(() => {
    const scrollable = scrollableRef.current;
    if (!scrollable) {
      return;
    }

    if (scrollable.scrollWidth > scrollable.clientWidth) {
      setScrollLeft(scrollable.scrollLeft);
      const right = scrollable.scrollWidth - scrollable.clientWidth - scrollable.scrollLeft;
      setScrollRight(right < MIN_SCROLL_END_SPACE ? 0 : right);
      setMaxFadeArea(scrollable.clientWidth / 10);
    } else {
      setScrollLeft(0);
      setScrollRight(0);
    }
  }, [scrollableRef]);

  useEffectOnce(() => {
    setScrolls();

    window.addEventListener("resize", setScrolls);
    scrollableRef.current?.addEventListener("scroll", setScrolls);

    return () => {
      window.removeEventListener("resize", setScrolls);
      scrollableRef.current?.removeEventListener("scroll", setScrolls);
    };
  });


  const {
    avgPrice,
    dailyVolume,
    dayPriceDelta,
    high24,
    liquidityLong,
    liquidityShort,
    longOIPercentage,
    longOIValue,
    low24,
    netRateLong,
    netRateShort,
    shortOIPercentage,
    shortOIValue,
    info,
  } = useChartHeaderFormattedValues();

  useEffect(() => {
    if (info) {
      setScrolls();
    }
  }, [info, setScrolls]);

  const additionalInfo = useMemo(() => {
    if (isSwap) {
      return (
        <>
          <div className="mt-4 flex flex-col justify-center">
            <div className="!text-[18px] font-[500]">${high24}</div>
            <div className="ExchangeChart-info-label">
              <Trans>24h High</Trans>
            </div>
          </div>
          <div className="mt-4 flex flex-col justify-center">
            <div className="!text-[18px] font-[500]">${low24}</div>
            <div className="ExchangeChart-info-label">
              <Trans>24h Low</Trans>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="mt-4 flex flex-col justify-center">
          <div className="Chart-header-value flex flex-row items-center gap-8 !text-[18px] font-[500]">
            <div className="flex flex-row items-center gap-4">{liquidityLong}</div>
            <div className="flex flex-row items-center gap-4">{liquidityShort}</div>
          </div>
          <div className="ExchangeChart-info-label">
            <Trans>Available Liquidity</Trans>
          </div>
        </div>
        <div className="mt-4 flex flex-col justify-center">
          <div className="Chart-header-value flex flex-row items-center gap-8 !text-[18px] font-[500]">
            <div>{netRateLong}</div>
            <div>{netRateShort}</div>
          </div>
          <div className="ExchangeChart-info-label">
            <TooltipWithPortal disableHandleStyle renderContent={renderNetFeeHeaderTooltipContent}>
              <Trans>Net Rate / 1h</Trans>
            </TooltipWithPortal>
          </div>
        </div>
        <div className="mt-4 flex flex-col justify-center">
          <div className="Chart-header-value flex flex-row items-center gap-8 pt-4 !text-[18px] font-[500]">
            <div className="flex flex-row items-center gap-4  !text-[18px] font-[500]">{longOIValue}</div>
            <div className="flex flex-row items-center gap-4  !text-[18px] font-[500]">{shortOIValue}</div>
          </div>
          <div className="whitespace-nowrap text-[1.25rem] text-[12px] font-[500] ">
            <span className="opacity-30">
              <Trans>Open Interest</Trans>
            </span>
            <span className="opacity-30">{" ("}</span>
            <span className="positive opacity-50">{longOIPercentage}</span>
            <span className="opacity-30">/</span>
            <span className="negative opacity-50">{shortOIPercentage}</span>
            <span className="opacity-30">{")"}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-col justify-center">
          <div className="Chart-header-value !text-[18px] font-[500]">{dailyVolume}</div>
          <div className="ExchangeChart-info-label">24h Volume</div>
        </div>
      </>
    );
  }, [
    dailyVolume,
    isSwap,
    liquidityLong,
    liquidityShort,
    longOIPercentage,
    longOIValue,
    netRateLong,
    netRateShort,
    shortOIPercentage,
    shortOIValue,
    high24,
    low24,
  ]);

  const scrollTo = useCallback(
    (dir: 1 | -1) => {
      if (!scrollableRef.current) {
        return;
      }

      let nextNonVisibleElement: Element | undefined;

      const { left: containerLeft, width: containerWidth } = scrollableRef.current.getBoundingClientRect();
      const containerRight = containerLeft + containerWidth;

      for (const child of scrollableRef.current.children) {
        const { left: childLeft, right: childRight, width: childWidth } = child.getBoundingClientRect();
        const childVisibleLeft = Math.max(childLeft, containerLeft);
        const childVisibleRight = Math.min(childRight, containerRight);
        const isVisible = childVisibleRight - childVisibleLeft === childWidth;

        if (dir === 1 && childLeft > containerLeft && !isVisible) {
          nextNonVisibleElement = child;
          break;
        } else if (dir === -1 && childRight < containerRight && !isVisible) {
          nextNonVisibleElement = child;
        }
      }

      if (!nextNonVisibleElement) {
        return;
      }

      let proposedScrollLeft = dir * nextNonVisibleElement.getBoundingClientRect().width;
      const nextLeftScroll = scrollableRef.current.scrollLeft + proposedScrollLeft;

      /**
       * This part is to prevent scrolling to visible area of element but leaving a small margin to the end (MAX_SCROLL_LEFT_TO_END_AREA),
       * it's better to scroll to the end in such cases
       */
      if (
        (dir === 1 && containerWidth - nextLeftScroll < MAX_SCROLL_LEFT_TO_END_AREA) ||
        (dir === -1 && nextLeftScroll < MAX_SCROLL_LEFT_TO_END_AREA)
      ) {
        proposedScrollLeft = dir * containerWidth;
      }

      scrollableRef.current.scrollBy({
        left: proposedScrollLeft,
        behavior: "smooth",
      });
      setScrolls();
    },
    [scrollableRef, setScrolls]
  );

  // const scrollToLeft = useCallback(() => scrollTo(-1), [scrollTo]);
  // const scrollToRight = useCallback(() => scrollTo(1), [scrollTo]);

  return (
    <div className="flex h-[76px] w-full">
      <div className="mb-10 flex w-[500px] items-center justify-between rounded-[12px] bg-[#121214] pr-12">
        <div className="flex items-center justify-start pl-12">
          <ChartTokenSelector selectedToken={selectedTokenOption} options={tokenOptions} oneRowLabels={false} />
        </div>
        <div className="flex items-center">
          <img className="mr-8" src="/images/cmd-btn.png" />
          <img src="/images/k-btn.png" />
        </div>
      </div>
      <div className="Chart-header mb-10 ml-8 w-full rounded-[12px] !bg-[#121214] px-12">
        <div className="relative flex overflow-hidden">
          {/* <div className="pointer-events-none absolute z-40 flex h-full w-full flex-row justify-between">
            <div
              className={cx("Chart-top-scrollable-fade-left", {
                "!cursor-default": scrollLeft <= 0,
                "opacity-100": scrollLeft > 0,
                "opacity-0": scrollLeft <= 0,
              })}
              style={leftStyles}
              onClick={scrollToLeft}
            >
              {scrollLeft > 0 && <BiChevronLeft className="opacity-70" size={24} />}
            </div>
            <div
              className={cx("Chart-top-scrollable-fade-right", {
                "!cursor-default": scrollRight <= 0,
                "opacity-100": scrollRight > 0,
                "opacity-0": scrollRight <= 0,
              })}
              style={rightStyles}
              onClick={scrollToRight}
            >
              {scrollRight > 0 && <BiChevronRight className="opacity-70" size={24} />}
            </div>
          </div> */}
          <div className="Chart-top-scrollable mt-0" ref={scrollableRef}>
            <div className="flex h-full w-[90px] flex-col justify-center">
              <div
                className={cs(
                  { negative: dayPriceChange === "-", positive: dayPriceChange === "+" },
                  "ExchangeChart-avg-price text-left !text-[18px] font-[500]"
                )}
              >
                {avgPrice}
              </div>
              <div className="text-left text-[12px] font-[500] text-white opacity-30">Mark Price</div>
            </div>
            {additionalInfo}
          </div>
        </div>
        {/* <div className="ExchangeChart-info VersionSwitch-wrapper">
          <VersionSwitch />
        </div> */}
      </div>
    </div>
  );
}

export function TVChartHeader({ isMobile }: { isMobile: boolean }) {
  const [domReady, setDomReady] = useState(false);

  useEffect(() => {
    setDomReady(true);
  }, []);
  return !domReady
    ? null
    : createPortal(
        isMobile ? <TVChartHeaderInfoMobile /> : <TVChartHeaderInfoDesktop />,
        document.getElementById("exchange-top")!
      );
}
