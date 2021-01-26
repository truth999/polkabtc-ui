import React from "react";
import { useSelector } from "react-redux";
import { StoreType } from "../../../../common/types/util.types";
import { Modal } from "react-bootstrap";
import { useTranslation } from 'react-i18next';
import { shortAddress } from "../../../../common/utils/utils";
import PaymentView from "./payment-view";
import StatusView from "./status-view";
import WhopsView from "./whoops-view";
import Big from "big.js";

type IssueModalProps = {
    show: boolean;
    onClose: () => void;
}

export default function IssueModal(props: IssueModalProps) {
    const { address } = useSelector((state: StoreType) => state.general);
    const selectedIdRequest = useSelector((state: StoreType) => state.issue.id);
    const issueRequests = useSelector((state: StoreType) => state.issue.issueRequests).get(address) || [];
    const request = issueRequests.filter((request) => request.id === selectedIdRequest)[0];
    const { t } = useTranslation();

    return <Modal show={props.show} onHide={props.onClose} size={"xl"}>
            <Modal.Header closeButton>
            </Modal.Header>
        <Modal.Body>
            {request &&
                <div className="row">
                    <div className="col-6 justify-content-center">
                        <div className="wizard-title">
                            {t("issue_page.issue_request_for")}
                        </div>
                        <div className="issue-amount"><span className="wizzard-number">{request.amountBTC}</span>&nbsp;polkaBTC</div>
                        <div className="step-item row">
                            <div className="col-6">{t("issue_page.issue_id")}</div>
                            <div className="col-6">{shortAddress(request.id)}</div>
                        </div>
                        <div className="step-item row">
                            <div className="col-6">{t("issue_page.parachain_block")}</div>
                            <div className="col-6">{shortAddress(request.creation)}</div>
                        </div>
                        <div className="step-item row">
                            <div className="col-6">{t("nav_vault")}</div>
                            <div className="col-6">{shortAddress(request.vaultDOTAddress)}</div>
                        </div>
                        <div className="step-item row">
                            <div className="col-6">{t("issue_page.vault_btc_address")}</div>
                            <div className="col-6">{shortAddress(request.vaultBTCAddress)}</div>
                        </div>
                        <div className="step-item row">
                            <div className="col-6">{t("bridge_fee")}</div>
                            <div className="col-6">{request.fee} BTC</div>
                        </div>
                        <hr className="total-divider"></hr>
                        <div className="step-item row">
                                <div className="col-6 total-amount">{t("total_deposit")}</div>
                                <div className="col-6 total-amount">{((new Big(request.fee)).add(new Big(request.amountBTC))).toString()} BTC</div>
                        </div>
                    </div>
                    <div className="col-6">
                        {!request.btcTxId && <PaymentView request={request}/>}
                        {request.btcTxId && <StatusView request={request}/>}
                        {!request.btcTxId && <WhopsView request={request}/>}

                    </div>
                </div>
            }
        </Modal.Body>
    </Modal>
}
