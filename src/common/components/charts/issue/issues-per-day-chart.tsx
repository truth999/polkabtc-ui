import React, { useState, useEffect, ReactElement, useMemo } from "react";
import usePolkabtcStats from "../../../hooks/use-polkabtc-stats";

export default function IssuesPerDayChart(): ReactElement {
    const statsApi = usePolkabtcStats();

    const [cumulativeIssuesPerDay, setCumulativeIssuesPerDay] = useState(new Array<{ date: number; sat: number }>());
    const pointIssuesPerDay = useMemo(
        () =>
            cumulativeIssuesPerDay.map((dataPoint, i) => {
                if (i === 0) return 0;
                return dataPoint.sat - cumulativeIssuesPerDay[i - 1].sat;
            }),
        [cumulativeIssuesPerDay]
    );

    const fetchIssuesLastDays = useMemo(
        () => async () => {
            const res = await statsApi.getRecentDailyIssues(6);
            setCumulativeIssuesPerDay(res.data);
        },
        [statsApi] // to silence the compiler
    );
    useEffect(() => {
        fetchIssuesLastDays();
    }, [fetchIssuesLastDays]);

    return (
        <div className="col-md-4">
            Placeholder: double line chart, total and per day issue requests. Currently{" "}
            {cumulativeIssuesPerDay.map(
                (point) => ` Date: ${new Date(point.date).toDateString()}, issued: ${point.sat} satoshi;`
            )}{" "}
            and {pointIssuesPerDay.toString()}.
        </div>
    );
}
