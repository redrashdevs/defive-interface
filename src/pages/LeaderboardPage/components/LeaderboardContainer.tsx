import { Trans, t } from "@lingui/macro";
import { useCallback, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import ExternalLink from "components/ExternalLink/ExternalLink";
import Tab from "components/Tab/Tab";
import { getChainName } from "config/chains";
import { getIcon } from "config/icons";
import {
  useLeaderboardChainId,
  useLeaderboardDataTypeState,
  useLeaderboardIsCompetition,
  useLeaderboardPageKey,
  useLeaderboardPositions,
  useLeaderboardRankedAccounts,
  useLeaderboardTimeframeTypeState,
  useLeaderboardTiming,
} from "context/SyntheticsStateContext/hooks/leaderboardHooks";
import { CompetitionType } from "domain/synthetics/leaderboard";
import { LEADERBOARD_PAGES } from "domain/synthetics/leaderboard/constants";
import { useChainId } from "lib/chains";
import { mustNeverExist } from "lib/types";
import { switchNetwork } from "lib/wallets";
import useWallet from "lib/wallets/useWallet";
import { useMedia } from "react-use";
import { CompetitionCountdown } from "./CompetitionCountdown";
import { CompetitionPrizes } from "./CompetitionPrizes";
import { LeaderboardAccountsTable } from "./LeaderboardAccountsTable";
import { LeaderboardNavigation } from "./LeaderboardNavigation";
import { LeaderboardPositionsTable } from "./LeaderboardPositionsTable";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { selectLeaderboardIsLoading } from "context/SyntheticsStateContext/selectors/leaderboardSelectors";
import PageTitle from "@/components/PageTitle/PageTitle";
import csx from "classnames";
import SearchInput from "@/components/SearchInput/SearchInput";
import { Menu } from "@headlessui/react";

const competitionsTabs = [0, 1];
const leaderboardTimeframeTabs = [0, 1, 2];
const leaderboardDataTypeTabs = [0, 1];

export function LeaderboardContainer() {
  const [activeDataType, setActiveDataType] = useState<"Top Positions" | "Top Addresses">("Top Addresses");

  const [search, setSearch] = useState("");
  const setValue = useCallback((e) => setSearch(e.target.value), []);
  const handleKeyDown = useCallback(() => null, []);

  const isCompetition = useLeaderboardIsCompetition();

  const [activeLeaderboardTimeframeIndex, setActiveLeaderboardTimeframeIndex] = useState(0);
  const [activeLeaderboardDataTypeIndex, setActiveLeaderboardDataTypeIndex] = useState(0);
  const [activeCompetitionIndex, setActiveCompetitionIndex] = useState(0);

  const leaderboardPageKey = useLeaderboardPageKey();

  const { chainId } = useChainId();
  const { active } = useWallet();

  const page = LEADERBOARD_PAGES[leaderboardPageKey];

  const [, setLeaderboardTimeframeType] = useLeaderboardTimeframeTypeState();
  const [leaderboardDataType, setLeaderboardDataType] = useLeaderboardDataTypeState();

  const competitionLabels = useMemo(() => [t`Top PnL ($)`, t`Top PnL (%)`], []);
  const leaderboardTimeframeLabels = useMemo(() => [t`All Time`, t`30D`, t`7D`], []);
  const leaderboardDataTypeLabels = useMemo(() => [t`Top Addresses`, t`Top Positions`], []);

  const activeCompetition: CompetitionType | undefined = isCompetition
    ? activeCompetitionIndex === 0
      ? "notionalPnl"
      : "pnlPercentage"
    : undefined;

  const handleLeaderboardTimeframeTabChange = useCallback(
    (index: number) => setActiveLeaderboardTimeframeIndex(index),
    [setActiveLeaderboardTimeframeIndex]
  );
  const handleCompetitionTabChange = useCallback(
    (index: number) => setActiveCompetitionIndex(index),
    [setActiveCompetitionIndex]
  );

  const handleLeaderboardDataTypeTabChange = useCallback(
    (index: number) => setActiveLeaderboardDataTypeIndex(index),
    []
  );

  const pageKey = useLeaderboardPageKey();
  const leaderboardChainId = useLeaderboardChainId();

  useEffect(() => {
    setActiveLeaderboardTimeframeIndex(0);
    setActiveCompetitionIndex(0);
  }, [pageKey]);

  useEffect(() => {
    if (activeLeaderboardTimeframeIndex === 0) {
      setLeaderboardTimeframeType("all");
    } else if (activeLeaderboardTimeframeIndex === 1) {
      setLeaderboardTimeframeType("30days");
    } else {
      setLeaderboardTimeframeType("7days");
    }
  }, [activeLeaderboardTimeframeIndex, setLeaderboardTimeframeType]);

  useEffect(() => {
    if (activeLeaderboardDataTypeIndex === 0) {
      setLeaderboardDataType("accounts");
    } else {
      setLeaderboardDataType("positions");
    }
  }, [activeLeaderboardDataTypeIndex, setLeaderboardDataType]);

  return (
    <div className="GlobalLeaderboards">
      {/* <LeaderboardNavigation /> */}
      {/* <div className="Leaderboard-Title default-container">
        <div>
          <h1 className="text-34 font-bold" data-qa="leaderboard-page">
            {title} <img alt={t`Chain Icon`} src={getIcon(page.isCompetition ? page.chainId : chainId, "network")} />
          </h1>
          <div className="Leaderboard-Title__description">{description}</div>
        </div>
      </div> */}
      <PageTitle showNetworkIcon={false} isTop title={t`Leadboard`} qa="leaderboard-page" />

      <div className="buy-tabs-wrappper">
        <button
          onClick={() => {
            setActiveDataType("Top Addresses");
            handleLeaderboardDataTypeTabChange(0);
          }}
          className={csx("tab-btn", { active: activeDataType === "Top Addresses" })}
        >
          <Trans>Top Addresses</Trans>
        </button>
        <button
          onClick={() => {
            setActiveDataType("Top Positions");
            handleLeaderboardDataTypeTabChange(1);
          }}
          className={csx("tab-btn ml-2", { active: activeDataType === "Top Positions" })}
        >
          <Trans>Top Positions</Trans>
        </button>
      </div>
      <div className="relative flex items-center">
        <SearchInput
          placeholder={t`Search`}
          className="LeaderboardSearch"
          value={search}
          setValue={setValue}
          onKeyDown={handleKeyDown}
          size="s"
        />
        <div className="relative">
          <Menu>
            <Menu.Button as="div" className="leaderboard-calendar pointer ml-4" data-qa="leaderboard-calendar-handle">
              <img width={20} src={"/images/calendar-stats.svg"} alt={"Calendar"} />
              <p className="mx-2">{leaderboardTimeframeLabels[activeLeaderboardTimeframeIndex]}</p>
              <img src="/images/chevron-down.png" />
            </Menu.Button>
            <Menu.Items as="div" className="menu-items leaderboard-calendar-items" data-qa="leaderboard-calendar">
              <div>
                <Menu.Item key={123}>
                  <div onClick={() => handleLeaderboardTimeframeTabChange(2)} className="calendar-menu-item">
                    7D
                  </div>
                </Menu.Item>
                <Menu.Item key={123}>
                  <div onClick={() => handleLeaderboardTimeframeTabChange(1)} className="calendar-menu-item">
                    30D
                  </div>
                </Menu.Item>
                <Menu.Item key={123}>
                  <div onClick={() => handleLeaderboardTimeframeTabChange(0)} className="calendar-menu-item">
                    All Time
                  </div>
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      {/* {!isCompetition && (
        <>
          <div className="LeaderboardContainer__competition-tabs default-container">
            <Tab
              option={activeLeaderboardDataTypeIndex}
              onChange={handleLeaderboardDataTypeTabChange}
              options={leaderboardDataTypeTabs}
              optionLabels={leaderboardDataTypeLabels}
            />
          </div>
        </>
      )} */}
      {/* {!isCompetition && (
        <Tab
          option={activeLeaderboardTimeframeIndex}
          onChange={handleLeaderboardTimeframeTabChange}
          options={leaderboardTimeframeTabs}
          optionLabels={leaderboardTimeframeLabels}
          type="inline"
          className={cx("LeaderboardContainer__leaderboard-tabs default-container", {
            "LeaderboardContainer__leaderboard-tabs_positions": leaderboardDataType === "positions",
          })}
        />
      )} */}

      {/* {isCompetition && (
        <>
          <div className="LeaderboardContainer__competition-tabs default-container">
            <Tab
              option={activeCompetitionIndex}
              onChange={handleCompetitionTabChange}
              options={competitionsTabs}
              optionLabels={competitionLabels}
            />
            {!isMobile && <CompetitionCountdown className="default-container" size="desktop" />}
          </div>
          <br />
          <br />
        </>
      )} */}
      {/* {isCompetition && activeCompetition && (
        <CompetitionPrizes leaderboardPageKey={leaderboardPageKey} competitionType={activeCompetition} />
      )} */}

      <Table search={search} activeCompetition={activeCompetition} />
    </div>
  );
}

function Table({ activeCompetition, search }: { activeCompetition: CompetitionType | undefined; search?: string }) {
  const { isStartInFuture } = useLeaderboardTiming();
  const leaderboardPageKey = useLeaderboardPageKey();
  const leaderboardDataType = useLeaderboardDataTypeState()[0];
  if (isStartInFuture) return null;

  const table =
    leaderboardPageKey === "leaderboard" && leaderboardDataType === "positions" ? (
      <PositionsTable search={search} />
    ) : (
      <AccountsTable search={search} activeCompetition={activeCompetition} />
    );

  return <div className="mt-16 !pr-0">{table}</div>;
}

function AccountsTable({
  activeCompetition,
  search,
}: {
  activeCompetition: CompetitionType | undefined;
  search?: string;
}) {
  const accounts = useLeaderboardRankedAccounts();
  const isLoading = useSelector(selectLeaderboardIsLoading);
  const accountsStruct = useMemo(
    () => ({
      isLoading,
      data: accounts ? accounts : [],
      error: null,
      updatedAt: 0,
    }),
    [accounts, isLoading]
  );

  return <LeaderboardAccountsTable search={search} activeCompetition={activeCompetition} accounts={accountsStruct} />;
}

function PositionsTable({ search }: { search?: string }) {
  const positions = useLeaderboardPositions();
  const isLoading = useSelector(selectLeaderboardIsLoading);
  const positionsStruct = useMemo(
    () => ({
      isLoading,
      data: positions ? positions : [],
      error: null,
      updatedAt: 0,
    }),
    [positions, isLoading]
  );
  return <LeaderboardPositionsTable search={search} positions={positionsStruct} />;
}
