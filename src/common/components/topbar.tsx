import React, { ReactElement, useEffect, useState } from "react";
import polkaBTCLogo from "../../assets/img/polkabtc/PolkaBTC_black.svg";
import { Navbar, Nav, Image, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { StoreType } from "../types/util.types";
import * as constants from "../../constants";
import ButtonMaybePending from "./pending-button";

type TopbarProps = {
    address?: string;
    onAccountClick: () => void;
    requestDOT: () => Promise<void>;
};

export default function Topbar(props: TopbarProps): ReactElement {
    const relayerLoaded = useSelector((state: StoreType) => state.general.relayerLoaded);
    const vaultClientLoaded = useSelector((state: StoreType) => state.general.vaultClientLoaded);
    const [isRelayerConnected, setIsRelayerConnected] = useState(false);
    const [isVaultConnected, setIsVaultConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRequestPending, setIsRequestPending] = useState(false);
    const polkaBtcLoaded = useSelector((state: StoreType) => state.general.polkaBtcLoaded);

    useEffect(() => {
        if (!relayerLoaded) return;

        const checkIsConnected = async () => {
            const relayerConnected = await window.relayer.isConnected();
            const vaultConnected = await window.vaultClient.isConnected();
            setIsRelayerConnected(relayerConnected);
            setIsVaultConnected(vaultConnected);
            setIsLoading(false);
        };
        checkIsConnected();
    }, [relayerLoaded, vaultClientLoaded]);

    const requestDOT = async () => {
        setIsRequestPending(true);
        // this call should not throw
        await props.requestDOT();
        setIsRequestPending(false);
    };

    return (
        <Navbar bg="light" expand="lg" className="border-bottom shadow-sm">
            <Navbar.Brand>
                <Link className="text-decoration-none" to="/">
                    <Image src={polkaBTCLogo} width="90" className="d-inline-block align-top" height="30" fluid />
                </Link>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                {!isLoading && (
                    <Nav className="mr-auto">
                        {!constants.STATIC_PAGE_ONLY && polkaBtcLoaded && (
                            <Link className="nav-link" to="/issue">
                                Issue
                            </Link>
                        )}
                        {!constants.STATIC_PAGE_ONLY && polkaBtcLoaded && (
                            <Link className="nav-link" to="/redeem">
                                Redeem
                            </Link>
                        )}
                        {polkaBtcLoaded && (
                            <Link className="nav-link" to="/dashboard">
                                Dashboard
                            </Link>
                        )}
                        {isVaultConnected && (
                            <Link className="nav-link" to="/vault">
                                Vault
                            </Link>
                        )}
                        {isRelayerConnected && (
                            <Link className="nav-link" to="/staked-relayer">
                                Relayer
                            </Link>
                        )}
                        <Link className="nav-link" to="/user-guide">
                            User Guide
                        </Link>
                        <Link className="nav-link" to="/about">
                            About
                        </Link>
                    </Nav>
                )}

                <Nav className="d-inline">
                    <ButtonMaybePending
                        variant="outline-polkadot"
                        className="mr-2"
                        size="sm"
                        style={{ borderRadius: "1em" }}
                        isPending={isRequestPending}
                        onClick={requestDOT}
                    >
                        Request DOT
                    </ButtonMaybePending>
                    {props.address !== undefined && (
                        <Button
                            variant="outline-polkadot"
                            size="sm"
                            style={{ borderRadius: "1em" }}
                            onClick={() => props.onAccountClick()}
                        >
                            Account: {props.address.substring(0, 10)}...{props.address.substring(38)}
                        </Button>
                    )}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}
