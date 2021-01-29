import React, { useEffect, ReactElement, useState, useMemo } from "react";
import ButtonComponent from "./button-component";
import { getAccents } from "../dashboardcolors";
import { useSelector } from "react-redux";
import { StoreType } from "../../../common/types/util.types";
import usePolkabtcStats from "../../../common/hooks/use-polkabtc-stats";
import { planckToDOT } from "@interlay/polkabtc";
import LineChartComponent from "./line-chart-component";

const CollateralLocked = (): ReactElement => {
    const totalLockedDOT = useSelector((state: StoreType) => state.general.totalLockedDOT);

    const statsApi = usePolkabtcStats();

    const [cumulativeCollateralPerDay, setCumulativeCollateralPerDay] = useState(
        new Array<{ date: number; amount: number }>()
    );
    const pointCollateralPerDay = useMemo(
        () =>
            cumulativeCollateralPerDay.map((dataPoint, i) => {
                if (i === 0) return 0;
                return dataPoint.amount - cumulativeCollateralPerDay[i - 1].amount;
            }),
        [cumulativeCollateralPerDay]
    );

    const fetchCollateralLastDays = useMemo(
        () => async () => {
            const res = await statsApi.getRecentDailyCollateralLocked(6);
            setCumulativeCollateralPerDay(res.data);
        },
        [statsApi] // to silence the compiler
    );

    useEffect(() => {
        fetchCollateralLastDays();
    }, [fetchCollateralLastDays]);

    return (
        <div className="card">
            <div className="card-top-content">
                <div className="values-container">
                    <h1 style={{ color: `${getAccents("d_pink").colour}` }}>Collateral Locked</h1>
                    <h2>{totalLockedDOT} DOT</h2>
                    <h2>$17,0030</h2>
                </div>
                <div className="button-container">
                    <ButtonComponent buttonName="view all vaults" propsButtonColor="d_pink" />
                </div>
            </div>
            <div className="chart-container">
                <LineChartComponent
                    colour={["d_pink", "d_grey"]}
                    label={["Total collateral locked", "Collateral locked per day"]}
                    yLabels={cumulativeCollateralPerDay.map((dataPoint) =>
                        new Date(dataPoint.date).toLocaleDateString()
                    )}
                    yAxisProps={[{ beginAtZero: true, position: "left" }, { position: "right" }]}
                    data={[
                        cumulativeCollateralPerDay.map((dataPoint) => Number(planckToDOT(dataPoint.amount.toString()))),
                        pointCollateralPerDay.map((amount) => Number(planckToDOT(amount.toString()))),
                    ]}
                />
            </div>
        </div>
    );
};

export default CollateralLocked;
