import connectWalletImg from "img/ic_wallet_24.svg";
import AddressDropdown from "../AddressDropdown/AddressDropdown";
import ConnectWalletButton from "../Common/ConnectWalletButton";

import { t, Trans } from "@lingui/macro";
import cx from "classnames";
import { ARBITRUM, ARBITRUM_GOERLI, AVALANCHE, AVALANCHE_FUJI, getChainName } from "config/chains";
import { isDevelopment } from "config/env";
import { getIcon } from "config/icons";
import { useChainId } from "lib/chains";
import { getAccountUrl, isHomeSite } from "lib/legacy";
import LanguagePopupHome from "../NetworkDropdown/LanguagePopupHome";
import NetworkDropdown from "../NetworkDropdown/NetworkDropdown";
import { NotifyButton } from "../NotifyButton/NotifyButton";
import "./Header.scss";
import { HeaderLink } from "./HeaderLink";
import useWallet from "lib/wallets/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTradePageVersion } from "lib/useTradePageVersion";
import ModalWithPortal from "../Modal/ModalWithPortal";
import { Link } from "react-router-dom";
import { switchNetwork } from "@/lib/wallets";
import { useCopyToClipboard, useMedia } from "react-use";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { useState } from "react";
import { buildAccountDashboardUrl } from "@/pages/AccountDashboard/AccountDashboard";

type Props = {
  openSettings: () => void;
  small?: boolean;
  disconnectAccountAndCloseSettings: () => void;
  showRedirectModal: (to: string) => void;
};

const NETWORK_OPTIONS = [
  {
    label: getChainName(ARBITRUM),
    value: ARBITRUM,
    icon: getIcon(ARBITRUM, "network"),
    color: "#264f79",
  },
  {
    label: getChainName(AVALANCHE),
    value: AVALANCHE,
    icon: getIcon(AVALANCHE, "network"),
    color: "#E841424D",
  },
];

if (isDevelopment()) {
  NETWORK_OPTIONS.push({
    label: getChainName(ARBITRUM_GOERLI),
    value: ARBITRUM_GOERLI,
    icon: getIcon(ARBITRUM_GOERLI, "network"),
    color: "#264f79",
  });
  NETWORK_OPTIONS.push({
    label: getChainName(AVALANCHE_FUJI),
    value: AVALANCHE_FUJI,
    icon: getIcon(AVALANCHE_FUJI, "network"),
    color: "#E841424D",
  });
}

export function AppHeaderUser({ openSettings, small, disconnectAccountAndCloseSettings, showRedirectModal }: Props) {
  const { chainId } = useChainId();
  const { active, account } = useWallet();
  const [, copyToClipboard] = useCopyToClipboard();
  const { openConnectModal } = useConnectModal();
  const showConnectionOptions = !isHomeSite();
  const [tradePageVersion] = useTradePageVersion();
  const isMobile = useMedia("(max-width: 1200px)");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const tradeLink = tradePageVersion === 2 ? "/trade" : "/v1";

  const selectorLabel = getChainName(chainId);

  const accountUrl = account && active ? getAccountUrl(chainId, account) : null;
  if (!active || !account) {
    return (
      <div className="App-header-user">
        {/* <div data-qa="trade" className={cx("App-header-trade-link", { "homepage-header": isHomeSite() })}>
          <HeaderLink className="default-btn" to={tradeLink!} showRedirectModal={showRedirectModal}>
            {isHomeSite() ? <Trans>Launch App</Trans> : <Trans>Trade</Trans>}
          </HeaderLink>
        </div> */}
        {showConnectionOptions && openConnectModal ? (
          <>
            <ConnectWalletButton onClick={openConnectModal} imgSrc={connectWalletImg}>
              {small ? <Trans>Connect</Trans> : <Trans>Connect Wallet</Trans>}
            </ConnectWalletButton>
            {/* !small && <NotifyButton /> */}
            <NetworkDropdown
              small={small}
              networkOptions={NETWORK_OPTIONS}
              selectorLabel={selectorLabel}
              openSettings={openSettings}
            />
            {isMobile ? (
              <div
                onClick={() => setIsModalVisible(true)}
                className="flex h-[40px] w-[40px] items-center justify-center rounded-[80px] bg-[#242429]"
              >
                <img width={24} height={24} src="/images/menu.png" />
              </div>
            ) : null}
          </>
        ) : (
          <LanguagePopupHome />
        )}
        <ModalWithPortal className="header-menu-modal" isVisible={isModalVisible} setIsVisible={setIsModalVisible}>
          <div className="bg-white px-[8px] py-[8px]">
            <div onClick={() => setIsModalVisible(false)}>
              <Link className="flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/"}>
                <p className="text-right text-[14px] text-[#354052]">{t`Trade`}</p>
              </Link>
              <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/earn"}>
                <p className="text-right text-[14px] text-[#354052]">{t`Earn`}</p>
              </Link>
              <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/buy"}>
                <p className="text-right text-[14px] text-[#354052]">{t`Buy`}</p>
              </Link>
              <Link
                className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]"
                to={"/leaderboard"}
              >
                <p className="text-right text-[14px] text-[#354052]">{t`Leaderboards`}</p>
              </Link>
              <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/docs"}>
                <p className="text-right text-[14px] text-[#354052]">{t`Docs`}</p>
              </Link>
            </div>
            <div className="pb-[16px]">
              <p className="-[10px] ml-[16px] mt-[16px] text-left text-[10px] text-black opacity-40">{t`NETWORk`}</p>
              {NETWORK_OPTIONS.map((item, index) => {
                return (
                  <div
                    key={index + item.label}
                    onClick={() => {
                      switchNetwork(item.value, active);
                      setIsModalVisible(false);
                    }}
                    className="mt-6 flex h-[40px] w-full items-center justify-between px-[16px]"
                  >
                    <div className="flex items-center">
                      <img src={item.icon} />
                      <p className="ml-8 text-left text-[14px] font-[500] text-[#121214]">{item.label}</p>
                    </div>
                    {selectorLabel !== item.label ? (
                      <div
                        className="h-[20px] w-[20px] rounded-[20px] bg-[#EBEBF5]"
                        style={{ border: "2px solid #0000FF1F" }}
                      />
                    ) : (
                      <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[20px] bg-[#9797CC]">
                        <div className="h-[6px] w-[6px] rounded-[6px] bg-[#FFF]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                openConnectModal!();
                setIsModalVisible(false);
              }}
              className="mb-16 flex h-[40px] w-full items-center justify-center rounded-[12px] bg-black text-white"
            >
              <img src="/images/wallet-white.png" />
              <p className="ml-8 text-[14px] font-[500]">{t`Connect Wallet`}</p>
            </button>
          </div>
        </ModalWithPortal>
      </div>
    );
  }
  const activeNetwork = NETWORK_OPTIONS.find(({ label }) => label === selectorLabel);
  return (
    <div className="App-header-user">
      {isHomeSite() ? (
        <div data-qa="trade" className={cx("App-header-trade-link")}>
          <HeaderLink className="default-btn" to={tradeLink!} showRedirectModal={showRedirectModal}>
            {isHomeSite() ? <Trans>Launch App</Trans> : null}
          </HeaderLink>
        </div>
      ) : null}

      {showConnectionOptions ? (
        isMobile ? (
          <div
            onClick={() => setIsModalVisible(true)}
            className="flex h-[40px] items-center rounded-[40px] bg-[#242429] px-8"
          >
            <img width={24} src={activeNetwork?.icon} style={{ zIndex: 2 }} />
            <div className="-ml-8 mt-4" style={{ zIndex: 1 }}>
              <Jazzicon diameter={24} seed={jsNumberForAddress(account)} />
            </div>
            <img width={24} src="/images/menu.png" />
          </div>
        ) : (
          <>
            <div data-qa="user-address" className="App-header-user-address">
              <AddressDropdown
                account={account}
                accountUrl={accountUrl!}
                disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
              />
            </div>
            {/* {!small && <NotifyButton />} */}
            <NetworkDropdown
              small={small}
              networkOptions={NETWORK_OPTIONS}
              selectorLabel={selectorLabel}
              openSettings={openSettings}
            />
          </>
        )
      ) : (
        <LanguagePopupHome />
      )}

      <ModalWithPortal className="header-menu-modal" isVisible={isModalVisible} setIsVisible={setIsModalVisible}>
        <div className="bg-white px-[8px] py-[8px]">
          <div onClick={() => setIsModalVisible(false)}>
            <Link className="flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/"}>
              <p className="text-right text-[14px] text-[#354052]">{t`Trade`}</p>
            </Link>
            <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/earn"}>
              <p className="text-right text-[14px] text-[#354052]">{t`Earn`}</p>
            </Link>
            <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/buy"}>
              <p className="text-right text-[14px] text-[#354052]">{t`Buy`}</p>
            </Link>
            <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/leaderboard"}>
              <p className="text-right text-[14px] text-[#354052]">{t`Leaderboards`}</p>
            </Link>
            <Link className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]" to={"/docs"}>
              <p className="text-right text-[14px] text-[#354052]">{t`Docs`}</p>
            </Link>
          </div>
          <div>
            <p className="-[10px] ml-[16px] mt-[16px] text-left text-[10px] text-black opacity-40">{t`NETWORk`}</p>
            {NETWORK_OPTIONS.map((item, index) => {
              return (
                <div
                  key={index + item.label}
                  onClick={() => {
                    switchNetwork(item.value, active);
                    setIsModalVisible(false);
                  }}
                  className="mt-6 flex h-[40px] w-full items-center justify-between px-[16px]"
                >
                  <div className="flex items-center">
                    <img src={item.icon} />
                    <p className="ml-8 text-left text-[14px] font-[500] text-[#121214]">{item.label}</p>
                  </div>
                  {selectorLabel !== item.label ? (
                    <div
                      className="h-[20px] w-[20px] rounded-[20px] bg-[#EBEBF5]"
                      style={{ border: "2px solid #0000FF1F" }}
                    />
                  ) : (
                    <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[20px] bg-[#9797CC]">
                      <div className="h-[6px] w-[6px] rounded-[6px] bg-[#FFF]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {active && account ? (
            <div className="pb-16">
              <p className="mb-4 ml-[16px] mt-[16px] text-left text-[10px] text-black opacity-40">{t`BALANCE`}</p>
              <div className="flex w-full items-center justify-between px-[16px] pb-[10px]">
                <p className="text-left text-[24px] font-[600] text-black">10 FTM</p>
                <p></p>
              </div>
              <div
                onClick={() => {
                  setIsModalVisible(false);
                  copyToClipboard(account);
                }}
                className="flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]"
              >
                <img width={20} src="/images/clipboard.png" />
                <p className="ml-8 text-right text-[14px] font-[500] text-[#354052]">{t`Copy Wallet Address`}</p>
              </div>
              <Link
                to={buildAccountDashboardUrl(account, chainId, undefined)}
                onClick={() => setIsModalVisible(false)}
                className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]"
              >
                <img width={20} src="/images/receipt-tax.png" />
                <p className="ml-8 text-right text-[14px] font-[500] text-[#354052]">{t`Transactions`}</p>
              </Link>
              <div
                onClick={() => {
                  setIsModalVisible(false);
                  disconnectAccountAndCloseSettings();
                }}
                className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]"
              >
                <img width={20} src="/images/wallet-off.png" />
                <p className="ml-8 text-right text-[14px] font-[500] text-[#FF303E]">{t`Disconnect Wallet`}</p>
              </div>
            </div>
          ) : null}
        </div>
      </ModalWithPortal>
    </div>
  );
}
