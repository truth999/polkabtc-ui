import React, { useEffect, useState, useCallback } from "react";
import { RedeemRequest, RedeemRequestStatus } from "../../../common/types/redeem.types";
import { Table, Button } from "react-bootstrap";
import { FaCheck, FaHourglass } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { StoreType } from "../../../common/types/util.types";
import { redeemExpiredAction, changeRedeemIdAction } from "../../../common/actions/redeem.actions";
import BitcoinTransaction from "../../../common/components/bitcoin-links/transaction";
import { useTranslation } from "react-i18next";
import RedeemModal from "./modal/redeem-modal";

export default function RedeemRequests() {
    const { polkaBtcLoaded, address } = useSelector((state: StoreType) => state.general);
    const redeemRequests = useSelector((state: StoreType) => state.redeem.redeemRequests).get(address);
    const [isRedeemExpirationSubscribed, setIsRedeemExpirationSubscribed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const redeemExpired = useCallback(
        (redeemId: string) => {
            try {
                if (!redeemRequests || !redeemRequests.length) return;
                const requestToBeUpdated = redeemRequests.filter((request) => request.id === redeemId)[0];

                if (requestToBeUpdated && requestToBeUpdated.status !== RedeemRequestStatus.Expired) {
                    dispatch(redeemExpiredAction({ ...requestToBeUpdated, status: RedeemRequestStatus.Expired }));
                }
            } catch (error) {
                console.log(error);
            }
        },
        [redeemRequests, dispatch]
    );

    const closeModal = () => setShowModal(false);

    const handleStatusColumn = (request: RedeemRequest) => {
        switch (request.status) {
            case RedeemRequestStatus.Reimbursed: {
                return <div>{t("redeem_page.reimbursed")}</div>;
            }
            case RedeemRequestStatus.Expired: {
                return (
                    <Button className="ml-3" variant="outline-dark">
                        {t("redeem_page.recover")}
                    </Button>
                );
            }
            // case RedeemRequestStatus.Cancelled: {
            // TODO: do we need the cancelled state?
            //     return (
            //         <Badge className="badge-style" variant="secondary">
            //             {t("cancelled")}
            //         </Badge>
            //     );
            // }
            case RedeemRequestStatus.Retried: {
                return <div>{t("redeem_page.retried")}</div>;
            }
            case RedeemRequestStatus.Completed: {
                return <FaCheck></FaCheck>;
            }
            default: {
                return <FaHourglass></FaHourglass>;
            }
        }
    };

    useEffect(() => {
        if (!redeemRequests || !polkaBtcLoaded) return;

        try {
            const accountId = window.polkaBTC.api.createType("AccountId", address);

            // if there are redeem requests, check their btc confirmations and if they are expired
            redeemRequests.forEach(async (request: RedeemRequest) => {
                if (!isRedeemExpirationSubscribed) {
                    setIsRedeemExpirationSubscribed(true);
                    window.polkaBTC.redeem.subscribeToRedeemExpiry(accountId, redeemExpired);
                }
            });
        } catch (error) {
            console.log(error);
        }
    }, [redeemRequests, address, dispatch, isRedeemExpirationSubscribed, redeemExpired, polkaBtcLoaded]);

    const requestClicked = (request: RedeemRequest): void => {
        dispatch(changeRedeemIdAction(request.id));
        setShowModal(true);
    };

    return (
        <div className="container mt-5">
            {redeemRequests && redeemRequests.length > 0 && (
                <React.Fragment>
                    <h5>{t("redeem_requests")}</h5>
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
                            {redeemRequests &&
                                redeemRequests.map((request) => {
                                    return (
                                        <tr key={request.id} onClick={() => requestClicked(request)}>
                                            <td>{request.creation === "0" ? "Pending..." : request.creation}</td>
                                            <td>{request.amountPolkaBTC} BTC</td>
                                            <td>
                                                {request.status === RedeemRequestStatus.Expired ? (
                                                    <div>{t("redeem_page.failed")}</div>
                                                ) : (
                                                    <BitcoinTransaction txId={request.btcTxId} shorten />
                                                )}
                                            </td>
                                            <td>{request.confirmations}</td>
                                            <td>{handleStatusColumn(request)}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </Table>
                </React.Fragment>
            )}
            <RedeemModal show={showModal} onClose={closeModal} />
        </div>
    );
}
