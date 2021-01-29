import React from "react";
import { Line } from "react-chartjs-2";
import { getAccents } from "../dashboardcolors";

interface YAxisConfig {
    beginAtZero?: boolean;
    position?: string;
}

interface SingleAxisProps {
    colour: string;
    label: string;
    yLabels: string[];
    yAxisProps?: YAxisConfig;
    data: number[];
}
interface MultiAxisProps {
    colour: string[];
    label: string[];
    yLabels: string[];
    yAxisProps: YAxisConfig[];
    data: number[][];
}
type ChartProps = SingleAxisProps | MultiAxisProps;

export default function LineChartComponent(propsArg: ChartProps): React.ReactElement {
    const props =
        typeof propsArg.colour !== "string" // meaning propsArg isn't SingleAxisProps
            ? (propsArg as MultiAxisProps)
            : ((propsArg: SingleAxisProps) => ({
                  colour: [propsArg.colour],
                  label: [propsArg.label],
                  yLabels: propsArg.yLabels,
                  yAxisProps: [propsArg.yAxisProps !== undefined ? propsArg.yAxisProps : {}],
                  data: [propsArg.data],
              }))(propsArg as SingleAxisProps);

    const data = {
        labels: props.yLabels,
        datasets: props.data.map((dataset, i) => ({
            label: props.label[i],
            yAxisID: i.toString(),
            fill: false,
            borderColor: getAccents(props.colour[i]).colour,
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: getAccents(props.colour[i]).colour,
            pointBorderColor: "rgba(255,255,255,0)",
            pointHoverBackgroundColor: getAccents(props.colour[i]).colour,
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: dataset,
            backgroundColor: "rgba(255,255,255,0)",
        })),
    };

    const chartProps = {
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                labels: {
                    fontSize: 9,
                },
            },
            scales: {
                xAxes: [
                    {
                        gridLines: {
                            display: false,
                        },
                    },
                ],
                yAxes: props.yAxisProps.map((yArgs, i) => ({
                    id: i.toString(),
                    type: "linear",
                    display: true,
                    ...(yArgs.beginAtZero ? { ticks: { beginAtZero: true } } : {}),
                    ...(yArgs.position !== undefined ? { position: yArgs.position } : {}),
                })),
            },
        },
    };
    return (
        <div className="chart-container">
            <Line {...chartProps} />
        </div>
    );
}
