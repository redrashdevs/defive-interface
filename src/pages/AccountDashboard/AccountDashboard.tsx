import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import { useEffect, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { useMedia } from "react-use";
import { checksumAddress, isAddress, type Address } from "viem";

import { CHAIN_NAMES_MAP, SUPPORTED_CHAIN_IDS, getChainName } from "config/chains";
// import { getIsV1Supported } from "config/features";
// import { getIcon } from "config/icons";
import { SyntheticsStateContextProvider } from "context/SyntheticsStateContext/SyntheticsStateContextProvider";
import { useChainId } from "lib/chains";
import useSearchParams from "lib/useSearchParams";

import AddressView from "components/AddressView/AddressView";
import Footer from "components/Footer/Footer";
import { DailyAndCumulativePnL } from "./DailyAndCumulativePnL";
import { GeneralPerformanceDetails } from "./GeneralPerformanceDetails";
import { HistoricalLists, HistoricalListsV1 } from "./HistoricalLists";
import { NETWORK_ID_SLUGS_MAP, NETWORK_QUERY_PARAM, NETWORK_SLUGS_ID_MAP, VERSION_QUERY_PARAM } from "./constants";

import "./AcountDashboard.scss";
import { sub } from "date-fns";

const PRESETS = [
  { days: 7 } satisfies Duration,
  undefined,
  { days: 30 } satisfies Duration,
  { days: 90 } satisfies Duration,
  { days: 365 } satisfies Duration,
  undefined,
];

export function AccountDashboard() {
  const { chainId: initialChainId } = useChainId();
  // const isMobile = useMedia("(max-width: 600px)");

  const { chainId, version, account } = usePageParams(initialChainId);
  const [activeTimeFrame, setActiveTimeFrame] = useState<0 | 2 | 3 | 4 | 5>(5);

  if (!isAddress(account)) {
    return (
      <div className="default-container page-layout">
        {/* <PageTitle title={t`GMX V2 Account`} /> */}
        <div className="negative text-center">
          <Trans>Invalid address. Please make sure you have entered a valid Ethereum address</Trans>
        </div>
      </div>
    );
  }

  const handleTimeRangeChange = () => {
    let duration = PRESETS[activeTimeFrame];
    if (!duration) return undefined;

    return sub(new Date(), duration);
  };

  return (
    <div className="container px-[16px] pb-[300px] md:px-[100px]">
      <Link to={"/leaderboard"}>
        <div className="mb-32 flex h-[40px] w-[220px] items-center justify-evenly rounded-[40px] bg-[#242429] py-8 ">
          <img src="/images/arrow-narrow-left.svg" />
          <p className="whitespace-nowrap text-[#D6D6D6]">Back to Leaderboard</p>
        </div>
      </Link>

      <div className="account-header">
        <AddressView noLink address={account} size={48} breakpoint={"S"} />
      </div>
      <div className="performance-details-tab-wrapper mt-[24px]">
        <button onClick={() => setActiveTimeFrame(0)} className={cx({ active: activeTimeFrame === 0 })}>
          1D
        </button>
        <button onClick={() => setActiveTimeFrame(2)} className={cx({ active: activeTimeFrame === 2 })}>
          7D
        </button>
        <button onClick={() => setActiveTimeFrame(3)} className={cx({ active: activeTimeFrame === 3 })}>
          30D
        </button>
        <button onClick={() => setActiveTimeFrame(4)} className={cx({ active: activeTimeFrame === 4 })}>
          1Y
        </button>
        <button onClick={() => setActiveTimeFrame(5)} className={cx({ active: activeTimeFrame === 5 })}>
          All Time
        </button>
      </div>
      {version === 2 && (
        <SyntheticsStateContextProvider overrideChainId={chainId} pageType="accounts" skipLocalReferralCode={false}>
          <GeneralPerformanceDetails activeTimeFrame={activeTimeFrame} chainId={chainId} account={account} />
          <DailyAndCumulativePnL fromDate={handleTimeRangeChange()} chainId={chainId} account={account} />
          <HistoricalLists chainId={chainId} account={account} />
        </SyntheticsStateContextProvider>
      )}

      {/* {version === 1 && <HistoricalListsV1 account={account} chainId={chainId} />} */}

      {/* <Footer /> */}
    </div>
  );
}

export function buildAccountDashboardUrl(
  account: Address,
  chainId: number | undefined,
  version: number | undefined = 2
) {
  let path = `/accounts/${account}`;

  const qs = new URLSearchParams();

  if (chainId) {
    qs.set(NETWORK_QUERY_PARAM, NETWORK_ID_SLUGS_MAP[chainId]);
  }

  qs.set(VERSION_QUERY_PARAM, version.toString());

  return path + "?" + qs.toString();
}

function usePageParams(initialChainId: number) {
  const history = useHistory();

  const params = useParams<{ account: Address }>();
  const queryParams = useSearchParams<{ network?: string; v?: string }>();
  const chainIdFromParams = NETWORK_SLUGS_ID_MAP[queryParams.network || ""] as number | undefined;
  const chainId = chainIdFromParams ?? initialChainId;
  const accountFromParams = params.account;
  const account = useMemo(
    () => (isAddress(accountFromParams.toLowerCase()) ? checksumAddress(accountFromParams) : accountFromParams),
    [accountFromParams]
  );

  // const version = parseInt(queryParams.v ?? "2");
  let version = 2;

  useEffect(() => {
    let patch = undefined as any;
    if (!chainIdFromParams || !SUPPORTED_CHAIN_IDS.includes(chainIdFromParams)) {
      patch = { chainId: initialChainId };
    }

    if (version !== 1 && version !== 2) {
      patch = { ...patch, version: 2 };
    }

    if (account !== accountFromParams) {
      patch = { ...patch, account };
    }

    if (patch) {
      history.replace(buildAccountDashboardUrl(account, patch.chainId ?? chainId, patch.version ?? version));
    }
  }, [account, accountFromParams, chainId, chainIdFromParams, history, initialChainId, version]);

  return { chainId, version, account };
}

// function VersionNetworkSwitcher({ account, chainId, version }: { account: Address; chainId: number; version: number }) {
//   return (
//     <div className="flex flex-wrap items-center gap-12 *:cursor-pointer">
//       {SUPPORTED_CHAIN_IDS.map((supportedChainId) => (
//         <Link
//           to={buildAccountDashboardUrl(account, supportedChainId, 2)}
//           key={supportedChainId}
//           className={cx("flex items-center gap-4", {
//             "text-white": supportedChainId === chainId && version === 2,
//             "text-gray-300": supportedChainId !== chainId || version !== 2,
//           })}
//         >
//           V2
//           <img
//             className="inline-block h-16"
//             src={getIcon(supportedChainId, "network")}
//             alt={CHAIN_NAMES_MAP[supportedChainId]}
//           />
//         </Link>
//       ))}
//       {SUPPORTED_CHAIN_IDS.filter(getIsV1Supported).map((supportedChainId) => (
//         <Link
//           to={buildAccountDashboardUrl(account, supportedChainId, 1)}
//           key={supportedChainId}
//           className={cx("flex items-center gap-4", {
//             "text-white": supportedChainId === chainId && version === 1,
//             "text-gray-300": supportedChainId !== chainId || version !== 1,
//           })}
//         >
//           V1
//           <img
//             className="inline-block h-16"
//             src={getIcon(supportedChainId, "network")}
//             alt={CHAIN_NAMES_MAP[supportedChainId]}
//           />
//         </Link>
//       ))}
//     </div>
//   );
// }
