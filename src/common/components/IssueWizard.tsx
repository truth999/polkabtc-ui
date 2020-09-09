import React, { Component, FormEvent, ChangeEvent } from "react";
import { BOB_BTC } from "../../constants";
import { IssueProps, IssueRequest } from "../types/IssueState";
import { Container, Modal, Form, FormGroup, FormControl, ListGroup, ListGroupItem, Row, Col } from "react-bootstrap";
import QRCode from "qrcode.react";

interface IssueWizardProps {
  step: number,
  issueId: string,
  amountBTC: string,
  vaultBTCAddress: string,
  amountPolkaBTC: string,
  transactionBTC: string,
  feeBTC: string,
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void,
}

export default class IssueWizard extends Component<IssueProps, IssueWizardProps> {
  state: IssueWizardProps = {
    step: 1,
    issueId: "",
    amountBTC: "0",
    vaultBTCAddress: BOB_BTC,
    amountPolkaBTC: "0",
    transactionBTC: "",
    feeBTC: "",
    handleChange: () => {},
  }

  constructor(props: IssueProps &
    { addIssueRequest: (req: IssueRequest) => void; }
    ) {
    super(props);
    this._next = this._next.bind(this);
    this._prev = this._prev.bind(this);
    this.state.handleChange = this.handleChange.bind(this);
  }

  _next() {
    let step = this.state.step;
    if (!this.isValid(step - 1)) return;
    // If the current step is 1 or 2, then add one on "next" button click
    step = step >= 3 ? 4 : step + 1;
    this.setState({
        step: step
    })
  }

  _prev() {
      let step = this.state.step
      // If the current step is 2 or 3, then subtract one on "previous" button click
      step = step <= 1 ? 1 : step - 1
      this.setState({
          step: step
      })
  }

  isValid(step: number) {
    const {amountBTC} = this.state;
    let valid = [
      parseFloat(amountBTC) > 0,
      true,
      true,
    ]
    return valid[step];
  }

  get previousButton() {
      let step = this.state.step;
      if (step !== 1) {
          return (
              <button
                  className="btn btn-secondary float-left"
                  type="button" onClick={() => this._prev()}>
                  Previous
              </button>
          )
      }
      return null;
  }

  get nextButton() {
      let step = this.state.step;
      const buttontext = (step === 2) ? ("Confirm") : ("Next");
      if (step < 4) {
          return (
              <button
                  className="btn btn-primary float-right"
                  type="button" onClick={() => this._next()}>
                  { buttontext }
              </button>
          )
      }
      return null;
  }

  handleChange(event: ChangeEvent<HTMLInputElement>) {
    let { name, value } = event.target;
    this.setState({
      ...this.state,
      [name]: value
    });
    if (name === "amountBTC") {
      this.setState({
        amountPolkaBTC: value,
        feeBTC: (Number.parseFloat(value) * 0.005).toString()
      })
    }
  }

  handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let date: Date = new Date();
    date.setMilliseconds(0);
    date.setSeconds(0);
    let req: IssueRequest = {
      id: this.props.idCounter.toString(),
      amount: this.state.amountBTC,
      creation: date.toISOString(),
      vaultAddress: this.state.vaultBTCAddress,
      btcTx: "...",
      confirmations: 0,
      completed: false
    }
    this.props.addIssueRequest(req);
  }

  render() {
    return (
      <Container>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
              Issue PolkaBTC
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={this.handleSubmit}>
            <EnterBTCAmount {...this.state} />
            <RequestConfirmation {...this.state} />
            <BTCPayment {...this.state} />
            <Confirmation {...this.state} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {this.previousButton}
          {this.nextButton}
        </Modal.Footer>
      </Container>
    )
  }
}

interface EnterBTCAmountProps {
  amountBTC: string
}

class EnterBTCAmount extends Component<IssueWizardProps, EnterBTCAmountProps> {
  state: EnterBTCAmountProps = {
    amountBTC: this.props.amountBTC
  }

  constructor(props: IssueWizardProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event: ChangeEvent<HTMLInputElement>) {
    // FIXME: this should also update the amountPolkaBTC in the parent
    let { name, value } = event.target;
    this.setState({
      ...this.state,
      [name]: value
    });
    this.props.handleChange(event);
  }

  render() {
    if (this.props.step !== 1) {
      return null
    }
    return(
      <FormGroup>
        <p>How much BTC to you want to receive in PolkaBTC?</p>
        <FormControl
          id="amountBTC"
          name="amountBTC"
          type="string"
          value={this.props.amountBTC}
          onChange={this.props.handleChange}
        />
      </FormGroup>
    )
  }
}

class RequestConfirmation extends Component<IssueWizardProps, {}> {
  constructor(props: IssueWizardProps) {
    super(props);
  }

  render() {
    if (this.props.step !== 2) {
      return null
    }
    return (
      <FormGroup>
        <h5>Summary</h5>
          <FormGroup>
              <ListGroup>
                <ListGroupItem>
                  Fees: <strong>{this.props.feeBTC} BTC</strong>
                </ListGroupItem>
                <ListGroupItem>Vault address: <strong>{this.props.vaultBTCAddress}</strong></ListGroupItem>
                <ListGroupItem>Receiving: <strong>{this.props.amountBTC} PolkaBTC</strong></ListGroupItem>
              </ListGroup>
          </FormGroup>
      </FormGroup>
    )
  }
}

interface BTCPaymentProps {
  paymentUri: string,
  loaded: boolean,
}

class BTCPayment extends Component<IssueWizardProps, BTCPaymentProps> {
  state: BTCPaymentProps = {
    paymentUri: '',
    loaded: false
  }

  constructor(props: IssueWizardProps) {
    super(props);
  }

  async componentDidUpdate() {
    if (!this.state.loaded) {
      const paymentUri = 'bitcoin:' + this.props.vaultBTCAddress + '?amount=' + this.props.amountBTC;
      this.setState({
        paymentUri: paymentUri,
        loaded: true
      })
    }
  }

  render() {
    const amountBTCwithFee = (Number.parseFloat(this.props.amountBTC) + Number.parseFloat(this.props.feeBTC)).toString();
    console.log(this.props.step);
    if (this.props.step !== 3) {
      return null
    }
    return (
      <FormGroup>
        <h5>Payment</h5>
          <Row className="justify-content-md-center">
            <Col md="auto" className="text-center">
                <p>To receive PolkaBTC you need to transfer the following BTC amount to a vault.</p>
                <QRCode value={this.state.paymentUri} />
            </Col>
        </Row>
        <h5>Summary</h5>
          <FormGroup>
              <ListGroup>
                <ListGroupItem>Sending: <strong>{amountBTCwithFee} BTC</strong></ListGroupItem>
                <ListGroupItem>Vault address: <strong>{this.props.vaultBTCAddress}</strong></ListGroupItem>
                <ListGroupItem>Receiving: <strong>{this.props.amountBTC} PolkaBTC</strong></ListGroupItem>
              </ListGroup>
          </FormGroup>
      </FormGroup>
    )
  }
}

class Confirmation extends Component<IssueWizardProps, {}> {
  constructor(props: IssueWizardProps) {
    super(props);
  }

  render() {
    console.log(this.props.step);
    if (this.props.step !== 4) {
      return null
    }
    return (
      <FormGroup>
        <h5>Confirm BTC Payment</h5>
          <Row className="justify-content-md-center">
            <Col md="auto" className="text-left">
                <p>
                  <b>Please confirm that you have made the Bitcoin payment.</b>
                  <br/>
                  <br/>
                  We will monitor your Bitcoin transaction and notify you when it has been confirmed.

                  <br/>
                  <br/>
                  You will then see a "Confirm" button next to your issue request to receive PolkaBTC.
                  <br/>
                  <br/>
                  <b>Note: Your Bitcoin payment can take up to an hour to confirm.</b>
                </p>
            </Col>
            <button
              className="btn btn-primary float-right"
              type="submit">
              I have made the Bitcoin payment
          </button>
        </Row>
      </FormGroup>
    )
  }
}