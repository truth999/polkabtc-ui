import React, { useState, useEffect, ReactElement, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import usePolkabtcStats from "../../../common/hooks/use-polkabtc-stats";
import { satToBTC } from "@interlay/polkabtc";

import { StoreType } from "../../../common/types/util.types";
import { DashboardIssueInfo } from "../../../common/types/issue.types";
import { defaultTableDisplayParams } from "../../../common/utils/utils";
import DashboardTable from "../../../common/components/dashboard-table/dashboard-table";
import PolkaBTC from "../components/polkabtc";

export default function IssueDashboard(): ReactElement {
    const { totalPolkaBTC } = useSelector((state: StoreType) => state.general);
    const { t } = useTranslation();
    const statsApi = usePolkabtcStats();

    const [issueRequests, setIssueRequests] = useState(new Array<DashboardIssueInfo>());
    const [tableParams, setTableParams] = useState(defaultTableDisplayParams());

    const [totalSuccessfulIssues, setTotalSuccessfulIssues] = useState("-");
    const [totalIssues, setTotalIssues] = useState("-");

    const fetchIssueRequests = useMemo(
        () => async () => {
            const res = await statsApi.getIssues(
                tableParams.page,
                tableParams.perPage,
                tableParams.sortBy,
                tableParams.sortAsc
            );
            setIssueRequests(res.data);
        },
        [tableParams, statsApi]
    );

    const [fetchTotalSuccessfulIssues, fetchTotalIssues] = useMemo(
        () => [
            async () => {
                const res = await statsApi.getTotalSuccessfulIssues();
                setTotalSuccessfulIssues(res.data);
            },
            async () => {
                const res = await statsApi.getTotalIssues();
                setTotalIssues(res.data);
            },
        ],
        [statsApi] // to silence the compiler
    );

    const tableHeadings = [
        t("id"),
        t("issue_page.amount"),
        t("issue_page.parachain_block"),
        t("issue_page.vault_dot_address"),
        t("issue_page.vault_btc_address"),
        t("status"),
    ];

    const tableIssueRequestRow = useMemo(
        () => (ireq: DashboardIssueInfo): string[] => [
            ireq.id,
            satToBTC(ireq.amountBTC),
            ireq.creation,
            ireq.vaultDOTAddress,
            ireq.vaultBTCAddress,
            ireq.completed ? t("completed") : ireq.cancelled ? t("cancelled") : t("pending"),
        ],
        [t]
    );

    useEffect(() => {
        try {
            fetchIssueRequests();
        } catch (e) {
            console.error(e);
        }
    }, [fetchIssueRequests, tableParams]);

    useEffect(() => {
        try {
            fetchTotalSuccessfulIssues();
            fetchTotalIssues();
        } catch (e) {
            console.error(e);
        }
    }, [fetchTotalSuccessfulIssues, fetchTotalIssues]);

    return (
        <div className="dashboard-page container-fluid white-background">
            <div className="dashboard-container dashboard-fade-in-animation">
                <div className="dashboard-wrapper">
                    <div className="row">
                        <div className="title">{t("dashboard.issues")}</div>
                    </div>
                    <div className="row mt-5 mb-3">
                        <div className="col-lg-8 offset-2">
                            <div className="row">
                                <div className="col-md-4">
                                    <p>{totalPolkaBTC} PolkaBTC issued</p>
                                </div>
                                <div className="col-md-4">
                                    <p>
                                        {totalSuccessfulIssues === "-"
                                            ? t("no_data")
                                            : `${totalSuccessfulIssues} successful issue requests`}
                                    </p>
                                </div>
                                <div className="col-md-4">
                                    <PolkaBTC />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DashboardTable
                        pageData={issueRequests}
                        totalPages={Math.ceil(Number(totalIssues) / tableParams.perPage)}
                        tableParams={tableParams}
                        setTableParams={setTableParams}
                        headings={tableHeadings}
                        dataPointDisplayer={tableIssueRequestRow}
                    />
                </div>
            </div>
        </div>
    );
}
