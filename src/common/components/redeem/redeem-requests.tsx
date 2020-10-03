import React from "react";

import { Table } from "react-bootstrap";
import { shortAddress, shortTxId } from "../../utils/utils";
import { FaCheck, FaHourglass } from "react-icons/fa";
import { useSelector } from "react-redux";
import { StoreType } from "../../types/util.types";

export default function RedeemRequests() {
    const storage = useSelector((state: StoreType) => state.storage);
    const redeemRequests = storage.getRedeemRequests();
    console.log(redeemRequests);
    return (
        <div>
            <Table hover responsive size={"md"}>
                <thead>
                    <tr>
                        <th>Redeem ID</th>
                        <th>Amount</th>
                        <th>Creation</th>
                        <th>Vault BTC Address</th>
                        <th>BTC Transaction</th>
                        <th>Confirmations</th>
                        <th>Completed</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        redeemRequests.map((request) => {
                            return (
                                <tr>
                                    <td>{request.id}</td>
                                    <td>{request.amountPolkaBTC} BTC</td>
                                    <td>{request.creation}</td>
                                    <td>{shortAddress(request.vaultBTCAddress)}</td>
                                    <td>{shortTxId(request.btcTxId)}</td>
                                    <td>{request.confirmations}</td>
                                    <td>{request.completed ? <FaCheck></FaCheck> : <FaHourglass></FaHourglass>}</td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </Table>
        </div>
    )
}