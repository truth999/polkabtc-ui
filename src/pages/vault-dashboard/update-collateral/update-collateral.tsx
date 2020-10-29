import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

type UpdateCollateralForm = {
    collateral: number;
}

type UpdateCollateralProps = {
    onClose: () => void;
    show: boolean;
};

export default function UpdateCollateralModal(props: UpdateCollateralProps){
    const { register, handleSubmit, errors } = useForm<UpdateCollateralForm>();
    const totalCollateral = 0;
    
    const onSubmit = handleSubmit(async ({ collateral }) => {
        try {
            // TO DO CALL API
            // await window.polkaBTC..registerStakedRelayer(collateral);
            toast.success("Successfully updated collateral");
            props.onClose();
        } catch (error) {
            toast.error(error.toString());
        }
    });

    return (
        <Modal show={props.show} onHide={props.onClose}>
            <form onSubmit={onSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Update Collateral</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        <div className="col-12 current-collateral">Current Total Collateral {totalCollateral} DOT </div>
                        <div className="col-12">New Total Collateral</div>
                        <div className="col-12">
                            <div className="input-group">
                                <input
                                    name="collateral"
                                    type="number"
                                    className={"form-control custom-input" + (errors.collateral ? " error-borders" : "")}
                                    aria-describedby="basic-addon2" 
                                    ref={register({
                                        required: true,
                                    })}
                                ></input>
                                <div className="input-group-append">
                                    <span className="input-group-text" id="basic-addon2">DOT</span>
                                </div>
                                {errors.collateral && (
                                    <div className="input-error">
                                        {errors.collateral.type === "required" ? 
                                        "Collateral is required" : errors.collateral.message}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-12">New Collateralization 340%</div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={props.onClose}>
                        Cancel
                    </Button>
                    <Button variant="outline-success" type="submit">
                        Update
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}