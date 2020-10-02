import React, { ReactElement } from "react";
import polkaBTCLogo from "../../assets/img/polkabtc/PolkaBTC_black.png";
import { Navbar, Nav, Image, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { KeyringPair } from "@polkadot/keyring/types";

type TopbarProps = {
    account?: KeyringPair;
    address?: string;
}

export default function Topbar(props: TopbarProps): ReactElement {
    return (
        <Navbar bg="light" expand="lg" className="border-bottom shadow-sm">
            <Navbar.Brand>
                <Link className="text-decoration-none" to="/">
                    <Image src={polkaBTCLogo} width="90" className="d-inline-block align-top" height="30" fluid />
                </Link>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                    <Link className="nav-link" to="/issue">
                        Issue
                    </Link>
                    <Link className="nav-link" to="/redeem">
                        Redeem
                    </Link>
                    <Link className="nav-link" to="/staked-relayer">
                        Staked Relayer
                    </Link>
                </Nav>
                <Nav>
                    {(props.address !== undefined) &&
                        <Link className="nav-link" to="/">
                            <Button variant="dark" size="sm" style={{ borderRadius: "1em" }}>
                                Account: {props.address.substring(0, 10)}...{props.address.substring(38)}
                            </Button>
                        </Link>
                    }
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
}
