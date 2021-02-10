export interface IssueRequest {
    id: string;
    amountBTC: string;
    totalAmount: string;
    creation: string;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId: string;
    confirmations: number;
    completed: boolean;
    cancelled: boolean;
    merkleProof?: string;
    transactionBlockHeight?: number;
    rawTransaction?: Uint8Array;
    fee: string;
    griefingCollateral: string;
}

export type DashboardIssueInfo = Pick<
    IssueRequest,
    "id" | "amountBTC" | "creation" | "vaultBTCAddress" | "vaultDOTAddress" | "btcTxId" | "completed" | "cancelled"
>;

export interface IssueMap {
    [key: string]: IssueRequest[];
}

export interface VaultIssue {
    id: string;
    timestamp: string;
    user: string;
    btcAddress: string;
    polkaBTC: string;
    lockedDOT: string;
    status: string;
    completed: boolean;
    cancelled: boolean;
}

export interface IssueState {
    selectedRequest?: IssueRequest;
    address: string;
    step: string;
    amountBTC: string;
    fee: string;
    griefingCollateral: string;
    vaultDotAddress: string;
    vaultBtcAddress: string;
    id: string;
    btcTxId: string;
    issueRequests: Map<string, IssueRequest[]>;
    wizardInEditMode: boolean;
    vaultIssues: VaultIssue[];
}
