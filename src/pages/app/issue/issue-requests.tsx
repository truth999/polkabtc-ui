import React, { useState, MouseEvent } from "react";

import Big from "big.js";
import { IssueRequest } from "../../../common/types/issue.types";
import { Table, Badge } from "react-bootstrap";
import { FaCheck, FaHourglass } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { StoreType } from "../../../common/types/util.types";
import { useEffect } from "react";
import ButtonMaybePending from "../../../common/components/pending-button";
import { toast } from "react-toastify";
import { updateIssueRequestAction, changeSelectedIssueAction } from "../../../common/actions/issue.actions";
import BitcoinTransaction from "../../../common/components/bitcoin-links/transaction";
import { updateBalancePolkaBTCAction, showAccountModalAction } from "../../../common/actions/general.actions";
import { useTranslation } from "react-i18next";
import { ParachainStatus } from "../../../common/types/util.types";
import IssueModal from "./modal/issue-modal";

export default function IssueRequests() {
    const { address, balancePolkaBTC, polkaBtcLoaded, extensions, stateOfBTCParachain } = useSelector(
        (state: StoreType) => state.general
    );
    const issueRequests = useSelector((state: StoreType) => state.issue.issueRequests).get(address);
    const [executePending, setExecutePending] = useState([""]);
    const [showModal, setShowModal] = useState(false);
    const [requiredBtcConfirmations, setRequiredBtcConfirmations] = useState(0);
    const [issuePeriod, setIssuePeriod] = useState(new Big(0));
    const [parachainHeight, setParachainHeight] = useState(new Big(0));
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const closeModal = () => setShowModal(false);

    const openWizard = () => {
        if (stateOfBTCParachain === ParachainStatus.Error) {
            toast.error(t("issue_page.error_in_parachain"));
            return;
        }
        // if (bitcoinHeight - btcRelayHeight > constants.BLOCKS_BEHIND_LIMIT) {
        //     toast.error(t("issue_page.error_more_than_6_blocks_behind"));
        //     return;
        // }
        if (extensions.length && address) {
            setShowModal(true);
        } else {
            dispatch(showAccountModalAction(true));
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!polkaBtcLoaded) return;

            try {
                const issuePeriodBlock = await window.polkaBTC.issue.getIssuePeriod();
                const parachainHeightBlock = await window.polkaBTC.system.getCurrentBlockNumber();
                setIssuePeriod(new Big(issuePeriodBlock.toString()));
                setParachainHeight(new Big(parachainHeightBlock.toString()));

                setRequiredBtcConfirmations(await window.polkaBTC.btcRelay.getStableBitcoinConfirmations());
            } catch (error) {
                toast.error(error.toString());
            }
        };
        fetchData();
    }, [polkaBtcLoaded, address, dispatch]);

    const execute = async (request: IssueRequest) => {
        if (!polkaBtcLoaded) return;
        setExecutePending([...executePending, request.id]);

        let [merkleProof, rawTx] = [request.merkleProof, request.rawTransaction];
        let transactionData = false;
        let txId = request.btcTxId;
        try {
            // get proof data from bitcoin
            if (txId === "") {
                txId = await window.polkaBTC.btcCore.getTxIdByRecipientAddress(
                    request.vaultBTCAddress,
                    request.amountBTC
                );
            }
            [merkleProof, rawTx] = await Promise.all([
                window.polkaBTC.btcCore.getMerkleProof(txId),
                window.polkaBTC.btcCore.getRawTransaction(txId),
            ]);
            transactionData = true;
        } catch (err) {
            toast.error(t("issue_page.transaction_not_included"));
        }

        if (!transactionData) return;
        try {
            const provenReq = request;
            provenReq.merkleProof = merkleProof;
            provenReq.rawTransaction = rawTx;
            dispatch(updateIssueRequestAction(provenReq));

            toast.success(t("issue_page.proof_data", { txId }));
            const txIdBuffer = Buffer.from(txId, "hex").reverse();

            // prepare types for polkadot
            const parsedIssuedId = window.polkaBTC.api.createType("H256", "0x" + provenReq.id);
            const parsedTxId = window.polkaBTC.api.createType("H256", txIdBuffer);
            const parsedMerkleProof = window.polkaBTC.api.createType("Bytes", "0x" + merkleProof);
            const parsedRawTx = window.polkaBTC.api.createType("Bytes", rawTx);

            toast.success(t("issue_page.executing", { id: request.id }));
            // execute issue
            const success = await window.polkaBTC.issue.execute(
                parsedIssuedId,
                parsedTxId,
                parsedMerkleProof,
                parsedRawTx
            );

            if (!success) {
                throw new Error(t("issue_page.execute_failed"));
            }

            const completedReq = provenReq;
            completedReq.completed = true;

            dispatch(
                updateBalancePolkaBTCAction(new Big(balancePolkaBTC).add(new Big(provenReq.amountBTC)).toString())
            );
            dispatch(updateIssueRequestAction(completedReq));

            toast.success(t("issue_page.succesfully_executed", { id: request.id }));
        } catch (error) {
            toast.error(error.toString());
        } finally {
            setExecutePending(executePending.splice(executePending.indexOf(request.id), 1));
        }
    };

    const handleCompleted = (request: IssueRequest) => {
        if (issuePeriod.add(new Big(request.creation)).lte(parachainHeight)) {
            return (
                <h5>
                    <Badge variant="secondary">{t("issue_page.expired")}</Badge>
                </h5>
            );
        }
        if (request.completed) {
            return <FaCheck></FaCheck>;
        }
        if (request.cancelled) {
            return (
                <Badge className="badge-style" variant="secondary">
                    {t("cancelled")}
                </Badge>
            );
        }
        if (request.confirmations < requiredBtcConfirmations || request.confirmations === 0) {
            return <FaHourglass></FaHourglass>;
        }
        return (
            <ButtonMaybePending
                variant="outline-dark"
                isPending={executePending.indexOf(request.id) !== -1}
                size="lg"
                block
                onClick={(event: MouseEvent<HTMLElement>) => {
                    event.stopPropagation();
                    execute(request);
                }}
            >
                {t("issue_page.execute")}
            </ButtonMaybePending>
        );
    };

    const requestClicked = (request: IssueRequest): void => {
        dispatch(changeSelectedIssueAction(request));
        openWizard();
    };

    return (
        <div className="container mt-5">
            {issueRequests && issueRequests.length > 0 && (
                <React.Fragment>
                    <h5>{t("issue_requests")}</h5>
                    <p>{t("issue_page.click_on_issue_request")}</p>
                    <Table hover responsive size={"md"}>
                        <thead>
                            <tr>
                                <th>{t("issue_page.updated")}</th>
                                <th>{t("issue_page.amount")}</th>
                                <th>{t("issue_page.btc_transaction")}</th>
                                <th>{t("issue_page.confirmations")}</th>
                                <th>{t("status")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issueRequests.map((request: IssueRequest, index: number) => {
                                return (
                                    <tr key={index} onClick={() => requestClicked(request)}>
                                        <td>{request.creation === "0" ? t("issue_page.pending") : request.creation}</td>
                                        <td>
                                            {request.amountBTC} <span className="grey-text">PolkaBTC</span>
                                        </td>
                                        <td>
                                            <BitcoinTransaction txId={request.btcTxId} shorten />
                                        </td>
                                        <td>{request.confirmations}</td>
                                        <td>{handleCompleted(request)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    <IssueModal show={showModal} onClose={closeModal} />
                </React.Fragment>
            )}
        </div>
    );
}
