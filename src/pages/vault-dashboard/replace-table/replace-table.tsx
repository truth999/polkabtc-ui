import React, { ReactElement, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { StoreType } from "../../../common/types/util.types";
import { addReplaceRequestsAction } from "../../../common/actions/vault.actions";
import { Button } from "react-bootstrap";
import { requestsToVaultReplaceRequests } from "../../../common/utils/utils";
import BN from "bn.js";
import { shortAddress } from "../../../common/utils/utils";
import * as constants from "../../../constants";
import { useTranslation } from "react-i18next";

type ReplaceTableProps = {
    openModal: (show: boolean) => void;
};

export default function ReplaceTable(props: ReplaceTableProps): ReactElement {
    const polkaBtcLoaded = useSelector((state: StoreType) => state.general.polkaBtcLoaded);
    const dispatch = useDispatch();
    const replaceRequests = useSelector((state: StoreType) => state.vault.requests);
    const [polkaBTCAmount, setPolkaBTCamount] = useState(new BN("0"));
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            if (!polkaBtcLoaded) return;

            try {
                const accountId = await window.vaultClient.getAccountId();
                const vaultId = window.polkaBTC.api.createType("AccountId", accountId);
                const issuedPolkaBTCAmount = await window.polkaBTC.vaults.getIssuedPolkaBTCAmount(vaultId);
                setPolkaBTCamount(issuedPolkaBTCAmount.toBn());
                const requests = await window.polkaBTC.vaults.mapReplaceRequests(vaultId);
                if (!requests) return;

                dispatch(addReplaceRequestsAction(requestsToVaultReplaceRequests(requests)));
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, constants.COMPONENT_UPDATE_MS);
        return () => clearInterval(interval);
    }, [polkaBtcLoaded, dispatch]);

    return (
        <div className="replace-table">
            <div className="row">
                <div className="col-12">
                    <div className="header">{t("vault.replace_requests")}</div>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-12">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t("id")}</th>
                                    <th>{t("parachainblock")}</th>
                                    <th>{t("vault.old_vault")}</th>
                                    <th>{t("vault.new_vault")}</th>
                                    <th>{t("btc_address")}</th>
                                    <th>PolkaBTC</th>
                                    <th>{t("griefing_collateral")}</th>
                                    <th>{t("status")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {replaceRequests.map((redeem, index) => {
                                    return (
                                        <tr key={index}>
                                            <td>{shortAddress(redeem.id)}</td>
                                            <td>{redeem.timestamp}</td>
                                            <td>{shortAddress(redeem.oldVault)}</td>
                                            <td>{shortAddress(redeem.newVault)}</td>
                                            <td>{shortAddress(redeem.btcAddress)}</td>
                                            <td>{redeem.polkaBTC}</td>
                                            <td>{redeem.lockedDOT}</td>
                                            <td>{redeem.status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    {polkaBTCAmount.gt(new BN(0)) ? (
                        <Button
                            variant="outline-danger"
                            className="vault-dashboard-button"
                            onClick={() => props.openModal(true)}
                        >
                            {t("vault.replace_vault")}
                        </Button>
                    ) : (
                        ""
                    )}
                </div>
            </div>
        </div>
    );
}
