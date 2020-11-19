import React, { useState, MouseEvent } from "react";

import Big from "big.js";
import { IssueRequest } from "../../../common/types/issue.types";
import { Table } from "react-bootstrap";
import { shortAddress, parachainToUIIssueRequest } from "../../../common/utils/utils";
import { FaCheck, FaHourglass } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { StoreType } from "../../../common/types/util.types";
import { useEffect } from "react";
import ButtonMaybePending from "../../../common/components/pending-button";
import { toast } from "react-toastify";
import { startTransactionWatcherIssue } from "../../../common/utils/transaction-watcher";
import {
    updateIssueRequestAction,
    changeIssueStepAction,
    changeBtcTxIdAction,
    changeIssueIdAction,
    openWizardInEditModeAction,
    changeAmountBTCAction,
    changeVaultBtcAddressOnIssueAction,
    updateAllIssueRequestsAction,
} from "../../../common/actions/issue.actions";
import BitcoinAddress from "../../../common/components/bitcoin-links/address";
import BitcoinTransaction from "../../../common/components/bitcoin-links/transaction";
import { updateBalancePolkaBTCAction } from "../../../common/actions/general.actions";

type IssueRequestProps = {
    handleShow: () => void;
};

export default function IssueRequests(props: IssueRequestProps) {
    const address = useSelector((state: StoreType) => state.general.address);
    const issueRequests = useSelector((state: StoreType) => state.issue.issueRequests).get(address);
    const transactionListeners = useSelector((state: StoreType) => state.issue.transactionListeners);
    const balancePolkaBTC = useSelector((state: StoreType) => state.general.balancePolkaBTC);
    const polkaBtcLoaded = useSelector((state: StoreType) => state.general.polkaBtcLoaded);
    const [executePending, setExecutePending] = useState([""]);
    const [requiredBtcConfirmations, setRequiredBtcConfirmations] = useState(0);
    const [issuePeriod, setIssuePeriod] = useState(new Big(0));
    const [parachainHeight, setParachainHeight] = useState(new Big(0));
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchData = async () => {
            if (!polkaBtcLoaded) return;

            try {

                const issuePeriodBlock = await window.polkaBTC.issue.getIssuePeriod();
                const parachainHeightBlock = await window.polkaBTC.btcRelay.getParachainBlockHeight();
                setIssuePeriod(issuePeriodBlock.toBn());
                setParachainHeight(parachainHeightBlock.toBn());

                setRequiredBtcConfirmations(await window.polkaBTC.btcRelay.getStableBitcoinConfirmations());

                const accountId = window.polkaBTC.api.createType("AccountId", address);
                const issueRequestMap = await window.polkaBTC.issue.mapForUser(accountId);
                let allRequests = [];

                for (const [key, value] of issueRequestMap) {
                    allRequests.push(parachainToUIIssueRequest(key, value));
                }

                await Promise.all(allRequests.map(async request => {
                    try {
                        request.btcTxId = await window.polkaBTC.btcCore.getTxIdByOpcode(request.id);
                    } catch (err) {
                        console.log("Issue Id: " + request.id + " " + err);
                    }
                }));
                await Promise.all(allRequests.map(async request => {
                    try {
                        if (request.btcTxId) {
                            request.confirmations = (await window.polkaBTC.btcCore.getTransactionStatus(request.btcTxId)).confirmations;
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }));

                dispatch(updateAllIssueRequestsAction(allRequests));

                if (!allRequests) return;
                allRequests.forEach(async (request: IssueRequest) => {
                    // start watcher for new issue requests
                    if (transactionListeners.indexOf(request.id) === -1 && polkaBtcLoaded) {
                        // the tx watcher updates the storage cache every 10s
                        startTransactionWatcherIssue(request, dispatch);
                    }
                });
            } catch (error) {
                toast.error(error.toString());
            }
        };
        fetchData();
    }, [polkaBtcLoaded, address, dispatch, transactionListeners]);

    const execute = async (request: IssueRequest) => {
        if (!polkaBtcLoaded) return;
        setExecutePending([...executePending, request.id]);

        let [transactionBlockHeight, merkleProof, rawTx] = [request.transactionBlockHeight, request.merkleProof, request.rawTransaction];
        let transactionData = false;
        let txId = request.btcTxId;
        try {
            // get proof data from bitcoin
            if (txId === "") {
                txId = await window.polkaBTC.btcCore.getTxIdByOpcode(request.id);
            }
            [transactionBlockHeight, merkleProof, rawTx] = await Promise.all([
                window.polkaBTC.btcCore.getTransactionBlockHeight(txId),
                window.polkaBTC.btcCore.getMerkleProof(txId),
                window.polkaBTC.btcCore.getRawTransaction(txId),
            ]);
            transactionData = true;
        } catch (err) {
            toast.error("Transaction not yet included in Bitcoin.");
        }

        if (!transactionData) return;
        try {
            const provenReq = request;
            provenReq.transactionBlockHeight = transactionBlockHeight;
            provenReq.merkleProof = merkleProof;
            provenReq.rawTransaction = rawTx;
            dispatch(updateIssueRequestAction(provenReq));

            toast.success("Fetching proof data for Bitcoin transaction: " + txId);
            const txIdBuffer = Buffer.from(txId, "hex").reverse();

            // prepare types for polkadot
            const parsedIssuedId = window.polkaBTC.api.createType("H256", "0x" + provenReq.id);
            const parsedTxId = window.polkaBTC.api.createType("H256", txIdBuffer);
            const parsedTxBlockHeight = window.polkaBTC.api.createType("u32", transactionBlockHeight);
            const parsedMerkleProof = window.polkaBTC.api.createType("Bytes", "0x" + merkleProof);
            const parsedRawTx = window.polkaBTC.api.createType("Bytes", rawTx);

            toast.success("Executing issue request: " + request.id);
            // execute issue
            const success = await window.polkaBTC.issue.execute(
                parsedIssuedId,
                parsedTxId,
                parsedTxBlockHeight,
                parsedMerkleProof,
                parsedRawTx
            );

            if (!success) {
                throw new Error("Execute failed.");
            }

            const completedReq = provenReq;
            completedReq.completed = true;
            
            dispatch(updateBalancePolkaBTCAction((new Big(balancePolkaBTC).add(new Big(provenReq.amountBTC))).toString()));
            dispatch(updateIssueRequestAction(completedReq));

            toast.success("Succesfully executed issue request: " + request.id);
        } catch (error) {
            toast.error(error.toString());
        }
        setExecutePending(executePending.splice(executePending.indexOf(request.id), 1));
    };

    const handleCompleted = (request: IssueRequest) => {
        if (request.confirmations < requiredBtcConfirmations || request.confirmations === 0) {
            return <FaHourglass></FaHourglass>;
        }
        if (request.completed) {
            return <FaCheck></FaCheck>;
        }
        if(issuePeriod.add(new Big(request.creation)) > parachainHeight){
            return <div className="expired-label">Expired</div>
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
                Execute
            </ButtonMaybePending>
        );
    };

    const requestClicked = (request: IssueRequest): void => {
        if (request.completed) return;

        dispatch(openWizardInEditModeAction());
        dispatch(changeVaultBtcAddressOnIssueAction(request.vaultBTCAddress));
        dispatch(changeAmountBTCAction(request.amountBTC));
        dispatch(changeBtcTxIdAction(request.btcTxId));
        dispatch(changeIssueIdAction(request.id));
        dispatch(changeIssueStepAction("BTC_PAYMENT_CONFIRMATION"));
        props.handleShow();
    };

    return (
        <div>
            {issueRequests && issueRequests.length > 0 && 
            <React.Fragment>
                <h5>Pending Issue Request</h5>
                <p>Click on an Issue request to view details or update the BTC payment txid.</p>
                <Table hover responsive size={"md"}>
                    <thead>
                        <tr>
                            <th>Issue ID</th>
                            <th>Amount</th>
                            <th>Parachain Block</th>
                            <th>Vault BTC Address</th>
                            <th>BTC Transaction</th>
                            <th>Confirmations</th>
                            <th>Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issueRequests.map((request: IssueRequest, index: number) => {
                            return (
                                <tr key={index} onClick={() => requestClicked(request)}>
                                    <td>{shortAddress(request.id)}</td>
                                    <td>{request.amountBTC} PolkaBTC</td>
                                    <td>{request.creation}</td>
                                    <td>
                                        <BitcoinAddress btcAddress={request.vaultBTCAddress} shorten />
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
            </React.Fragment>
            }
        </div>
    );
}
