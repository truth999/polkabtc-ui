import React from "react";
import { FormGroup, ListGroup, Row, Col, Modal } from "react-bootstrap";
import { shortAddress } from "../../utils/utils";
import { useSelector } from "react-redux";
import { StoreType } from "../../types/util.types";

type VaultInfoProps = {
    closeModal: ()=>void
}

export default function VaultInfo(props: VaultInfoProps){
    const vaultDotAddress = useSelector((state: StoreType)=>state.redeem.vaultDotAddress);
    const vaultBtcAddress = useSelector((state: StoreType)=>state.redeem.vaultBtcAddress);

    const onConfirm = () => {
        props.closeModal();
    }

    return <React.Fragment>
        <Modal.Body>
        <FormGroup>
            <h5>Request being processed...</h5>
            <Row className="justify-content-md-center">
                <Col md="auto" className="text-left">
                    <FormGroup>
                        <ListGroup>
                            Your redeem request is being processed by Vault
                             <b>{shortAddress(vaultDotAddress)}</b>
                            <br />
                            <br />
                            You will receive BTC from the following Bitcoin address: 
                            <b>{vaultBtcAddress}</b>
                        </ListGroup>
                    </FormGroup>
                    <br />
                    <p>We will inform you when your redeem request has been executed.</p>
                </Col>
            </Row>
        </FormGroup>
        </Modal.Body>
        <Modal.Footer>
            <button className="btn btn-primary float-right" onClick={onConfirm}>
                Confirm
            </button>
        </Modal.Footer>
    </React.Fragment>
}