import { Trans, t } from "@lingui/macro";
import { memo, useCallback, useState } from "react";

import { useIsPositionsLoading, usePositionsInfoData } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { usePositionEditorPositionState } from "context/SyntheticsStateContext/hooks/positionEditorHooks";
import { selectAccount, selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { selectPositionsInfoDataSortedByMarket } from "context/SyntheticsStateContext/selectors/positionsSelectors";
import { selectShowPnlAfterFees } from "context/SyntheticsStateContext/selectors/settingsSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { PositionInfo } from "domain/synthetics/positions";
import { TradeMode } from "domain/synthetics/trade";
import { getByKey } from "lib/objects";

import PositionShare from "components/Exchange/PositionShare";
import { OrderEditorContainer } from "components/OrderEditorContainer/OrderEditorContainer";
import { PositionItem } from "components/Synthetics/PositionItem/PositionItem";

import "./PositionList.scss";

type Props = {
  onSelectPositionClick: (key: string, tradeMode?: TradeMode) => void;
  onClosePositionClick: (key: string) => void;
  onOrdersClick: (positionKey: string, orderKey: string | undefined) => void;
  onCancelOrder: (key: string) => void;
  openSettings: () => void;
  hideActions?: boolean;
};

export function PositionList(p: Props) {
  const { onClosePositionClick, onOrdersClick, onSelectPositionClick, openSettings, onCancelOrder, hideActions } = p;
  const positionsInfoData = usePositionsInfoData();
  const chainId = useSelector(selectChainId);
  const account = useSelector(selectAccount);
  const [isPositionShareModalOpen, setIsPositionShareModalOpen] = useState(false);
  const [positionToShareKey, setPositionToShareKey] = useState<string>();
  const positionToShare = getByKey(positionsInfoData, positionToShareKey);
  const positions = useSelector(selectPositionsInfoDataSortedByMarket);
  const handleSharePositionClick = useCallback((positionKey: string) => {
    setPositionToShareKey(positionKey);
    setIsPositionShareModalOpen(true);
  }, []);
  const [, setEditingPositionKey] = usePositionEditorPositionState();
  const isLoading = useIsPositionsLoading();

  return (
    <div>
      <div className="Exchange-list small">
        {!isLoading &&
          positions.map((position) => (
            <PositionItemWrapper
              key={position.key}
              position={position}
              onEditCollateralClick={setEditingPositionKey}
              onClosePositionClick={onClosePositionClick}
              onOrdersClick={onOrdersClick}
              onSelectPositionClick={onSelectPositionClick}
              isLarge={false}
              onShareClick={handleSharePositionClick}
              openSettings={openSettings}
              hideActions={hideActions}
              onCancelOrder={onCancelOrder}
            />
          ))}
      </div>

      <table
        className="Exchange-list Position-list large App-box"
        style={{ background: "rgba(18, 18, 20, 1)", borderRadius: 12 }}
      >
        <tbody>
          <tr className="Exchange-list-header">
            <th>
              <Trans>Position</Trans>
            </th>
            <th className="!text-right">
              <Trans>Net Value</Trans>
            </th>
            <th className="!text-right">
              <Trans>Size</Trans>
            </th>
            <th className="!text-right">
              <Trans>Collateral</Trans>
            </th>
            <th className="!text-right">
              <Trans>Entry Price</Trans>
            </th>
            <th className="!text-right">
              <Trans>Mark Price</Trans>
            </th>
            <th className="!text-right">
              <Trans>Liq. Price</Trans>
            </th>
          </tr>
          {positions.length === 0 && (
            <tr>
              <td colSpan={15}>
                <div className="Exchange-empty-positions-list-note flex h-[140px] flex-col items-center justify-center text-[14px] font-[600] text-[#36363D]">
                  {isLoading ? (
                    t`Loading...`
                  ) : (
                    <>
                      <img src="/images/empty-record.svg" />
                      <Trans>No Position History</Trans>
                    </>
                  )}
                </div>
              </td>
            </tr>
          )}
          {!isLoading &&
            positions.map((position) => (
              <PositionItemWrapper
                key={position.key}
                position={position}
                onEditCollateralClick={setEditingPositionKey}
                onClosePositionClick={onClosePositionClick}
                onOrdersClick={onOrdersClick}
                onSelectPositionClick={onSelectPositionClick}
                isLarge
                onShareClick={handleSharePositionClick}
                openSettings={openSettings}
                hideActions={hideActions}
                onCancelOrder={onCancelOrder}
              />
            ))}
          {!isLoading &&
            positions.map((position) => (
              <PositionItemWrapper
                key={position.key}
                position={position}
                onEditCollateralClick={setEditingPositionKey}
                onClosePositionClick={onClosePositionClick}
                onOrdersClick={onOrdersClick}
                onSelectPositionClick={onSelectPositionClick}
                isLarge
                onShareClick={handleSharePositionClick}
                openSettings={openSettings}
                hideActions={hideActions}
                onCancelOrder={onCancelOrder}
              />
            ))}
          {!isLoading &&
            positions.map((position) => (
              <PositionItemWrapper
                key={position.key}
                position={position}
                onEditCollateralClick={setEditingPositionKey}
                onClosePositionClick={onClosePositionClick}
                onOrdersClick={onOrdersClick}
                onSelectPositionClick={onSelectPositionClick}
                isLarge
                onShareClick={handleSharePositionClick}
                openSettings={openSettings}
                hideActions={hideActions}
                onCancelOrder={onCancelOrder}
              />
            ))}
        </tbody>
      </table>
      {/* {positionToShare && (
        <PositionShare
          key={positionToShare.key}
          setIsPositionShareModalOpen={setIsPositionShareModalOpen}
          isPositionShareModalOpen={isPositionShareModalOpen}
          entryPrice={positionToShare.entryPrice}
          indexToken={positionToShare.indexToken}
          isLong={positionToShare.isLong}
          leverage={positionToShare.leverageWithPnl}
          markPrice={positionToShare.markPrice}
          pnlAfterFeesPercentage={positionToShare?.pnlAfterFeesPercentage}
          chainId={chainId}
          account={account}
        />
      )}
      <OrderEditorContainer /> */}
    </div>
  );
}

const PositionItemWrapper = memo(
  ({
    position,
    hideActions,
    isLarge,
    onClosePositionClick,
    onEditCollateralClick,
    onOrdersClick,
    onSelectPositionClick,
    onShareClick,
    openSettings,
    onCancelOrder,
  }: {
    position: PositionInfo;
    onEditCollateralClick: (positionKey: string) => void;
    onClosePositionClick: (positionKey: string) => void;
    onOrdersClick: (positionKey: string, orderKey: string | undefined) => void;
    onSelectPositionClick: (positionKey: string, tradeMode: TradeMode | undefined) => void;
    isLarge: boolean;
    onShareClick: (positionKey: string) => void;
    openSettings: () => void;
    hideActions: boolean | undefined;
    onCancelOrder: (orderKey: string) => void;
  }) => {
    const showPnlAfterFees = useSelector(selectShowPnlAfterFees);
    const handleEditCollateralClick = useCallback(
      () => onEditCollateralClick(position.key),
      [onEditCollateralClick, position.key]
    );
    const handleClosePositionClick = useCallback(
      () => onClosePositionClick(position.key),
      [onClosePositionClick, position.key]
    );

    const handleSelectPositionClick = useCallback(
      (tradeMode?: TradeMode) => onSelectPositionClick(position.key, tradeMode),
      [onSelectPositionClick, position.key]
    );
    const handleShareClick = useCallback(() => onShareClick(position.key), [onShareClick, position.key]);
    const handleCancelOrder = useCallback((orderKey: string) => onCancelOrder(orderKey), [onCancelOrder]);
    const handleOrdersClick = useCallback(
      (orderKey: string | undefined) => {
        onOrdersClick(position.key, orderKey);
      },
      [onOrdersClick, position.key]
    );

    return (
      <PositionItem
        position={position}
        onEditCollateralClick={handleEditCollateralClick}
        onClosePositionClick={handleClosePositionClick}
        onOrdersClick={handleOrdersClick}
        onSelectPositionClick={handleSelectPositionClick}
        showPnlAfterFees={showPnlAfterFees}
        isLarge={isLarge}
        openSettings={openSettings}
        hideActions={hideActions}
        onShareClick={handleShareClick}
        onCancelOrder={handleCancelOrder}
      />
    );
  }
);
