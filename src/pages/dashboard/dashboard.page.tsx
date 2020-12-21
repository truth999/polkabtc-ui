import React, { useState, useEffect } from "react";
import StatusUpdateTable from "../../common/components/status-update-table/status-update-table";
import VaultTable from "../../common/components/vault-table/vault-table";
import OracleTable from "../../common/components/oracle-table/oracle-table";
import BitcoinTable from "../../common/components/bitcoin-table/bitcoin-table";
import { useSelector } from "react-redux";

import "./dashboard.page.scss";
import { StoreType } from "../../common/types/util.types";
import StakedRelayerTable from "./staked-relayer-table/staked-relayer-table";
import { toast } from "react-toastify";
import { roundTwoDecimals } from "@interlay/polkabtc";

export default function DashboardPage() {
    const polkaBtcLoaded = useSelector((state: StoreType) => state.general.polkaBtcLoaded);
    const totalPolkaBTC = useSelector((state: StoreType) => state.general.totalPolkaBTC);
    const totalLockedDOT = useSelector((state: StoreType) => state.general.totalLockedDOT);
    const [capacity, setCapacity] = useState("0");
    const [collateralizationRate, setCollateralizationRate] = useState("∞");

    useEffect(() => {
        const fetchData = async () => {
            if (!polkaBtcLoaded) return;

            try {
                const collateralization = await window.polkaBTC.vaults.getSystemCollateralization();
                if (collateralization === undefined) {
                    setCollateralizationRate("∞");
                } else {
                    setCollateralizationRate(collateralization.mul(100).toString());
                }

                const issuablePolkaBTC = await window.polkaBTC.vaults.getIssuablePolkaBTC();
                setCapacity(issuablePolkaBTC);
            } catch (error) {
                toast.error(error.toString());
            }
        };
        fetchData();
    }, [polkaBtcLoaded, totalLockedDOT]);

    return (
        <div className="dashboard-page container-fluid white-background">
            <div className="dashboard-container dashboard-fade-in-animation">
                <div className="dashboard-wrapper">
                    <div className="row">
                        <div className="title">Dashboard</div>
                    </div>
                    <div className="row mt-5 mb-3">
                        <div className="col-lg-8 offset-2">
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="">Total locked</div>
                                    <span className="stats">{totalLockedDOT} </span> DOT
                                </div>
                                <div className="col-md-3">
                                    <div className="">Total issued</div>
                                    <span className="stats">{totalPolkaBTC} </span> PolkaBTC
                                </div>
                                <div className="col-md-3">
                                    <div className="">Capacity</div>
                                    <span className="stats">~{`${roundTwoDecimals(capacity)}`}</span> PolkaBTC
                                </div>
                                <div className="col-md-3">
                                    <div className="">Collateralization</div>
                                    <div className="stats">
                                        {collateralizationRate === "∞"
                                            ? collateralizationRate
                                            : `${roundTwoDecimals(collateralizationRate)}%`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <BitcoinTable></BitcoinTable>
                    <StatusUpdateTable dotLocked={totalLockedDOT} readOnly={true}></StatusUpdateTable>
                    <VaultTable isRelayer={false}></VaultTable>
                    <OracleTable planckLocked={"1"}></OracleTable>
                    <StakedRelayerTable></StakedRelayerTable>
                </div>
            </div>
        </div>
    );
}
