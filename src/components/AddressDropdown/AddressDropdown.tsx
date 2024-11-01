import { Menu } from "@headlessui/react";
import { Trans, t } from "@lingui/macro";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { createBreakpoint, useCopyToClipboard } from "react-use";
import type { Address } from "viem";

import { ETH_MAINNET } from "config/chains";
import { useSubaccountModalOpen } from "context/SubaccountContext/SubaccountContext";
import { helperToast } from "lib/helperToast";
import { useENS } from "lib/legacy";
import { useJsonRpcProvider } from "lib/rpc";
import { shortenAddressOrEns } from "lib/wallets";
import { buildAccountDashboardUrl } from "pages/AccountDashboard/AccountDashboard";

import ExternalLink from "components/ExternalLink/ExternalLink";

import copy from "img/ic_copy_20.svg";
import externalLink from "img/ic_new_link_20.svg";
import disconnect from "img/ic_sign_out_20.svg";
import oneClickTradingIcon from "img/one_click_trading_20.svg";
import PnlAnalysisIcon from "img/ic_pnl_analysis_20.svg?react";

import "./AddressDropdown.scss";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";

type Props = {
  account: string;
  accountUrl: string;
  disconnectAccountAndCloseSettings: () => void;
};

const useBreakpoint = createBreakpoint({ L: 600, M: 550, S: 400 });

function AddressDropdown({ account, accountUrl, disconnectAccountAndCloseSettings }: Props) {
  const breakpoint = useBreakpoint();
  const [, copyToClipboard] = useCopyToClipboard();
  const { ensName } = useENS(account);
  const { provider: ethereumProvider } = useJsonRpcProvider(ETH_MAINNET);
  const displayAddressLength = breakpoint === "S" ? 9 : 13;
  const [, setOneClickModalOpen] = useSubaccountModalOpen();
  const handleSubaccountClick = useCallback(() => {
    setOneClickModalOpen(true);
  }, [setOneClickModalOpen]);

  return (
    <Menu>
      <Menu.Button as="div">
        <button className="App-cta small transparent address-btn">
          <div className="address-img">
            <Jazzicon diameter={30} seed={jsNumberForAddress(account)} />
          </div>
          <p className="ml-[18px]">{shortenAddressOrEns(account, 9)}</p>
        </button>
      </Menu.Button>
      <div>
        <Menu.Items as="div" className="menu-items wallet-dd">
          <div className="w-full">
            <p className="mb-4 ml-[16px] mt-[16px] text-left text-[10px] text-black opacity-40">{t`BALANCE`}</p>
            <div className="flex w-full items-center justify-between px-[16px] pb-[10px]">
              <p className="text-left text-[24px] font-[600] text-black">10 FTM</p>
              <p></p>
            </div>
            <Menu.Item>
              <div
                onClick={() => copyToClipboard(account)}
                className="flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]"
              >
                <img width={20} src="/images/clipboard.png" />
                <p className="ml-8 text-right text-[14px] font-[500] text-[#354052]">{t`Copy Wallet Address`}</p>
              </div>
            </Menu.Item>
            <Menu.Item>
              <Link className="w-full" to={buildAccountDashboardUrl(account as Address, undefined, 2)}>
                <div className="mt-6 flex h-[40px] w-full items-center rounded-[8px] bg-[#FAFAFA] px-[16px]">
                  <img width={20} src="/images/receipt-tax.png" />
                  <p className="ml-8 text-right text-[14px] font-[500] text-[#354052]">{t`Transactions`}</p>
                </div>
              </Link>
            </Menu.Item>
            <Menu.Item>
              <div
                onClick={() => {
                  // setIsModalVisible(false);
                  disconnectAccountAndCloseSettings();
                }}
                className="mt-6 flex h-[40px] items-center rounded-[8px] bg-[#FAFAFA] px-[16px]"
              >
                <img width={20} src="/images/wallet-off.png" />
                <p className="ml-8 text-right text-[14px] font-[500] text-[#FF303E]">{t`Disconnect Wallet`}</p>
              </div>
            </Menu.Item>
          </div>
        </Menu.Items>
      </div>
    </Menu>
  );
}

export default AddressDropdown;
