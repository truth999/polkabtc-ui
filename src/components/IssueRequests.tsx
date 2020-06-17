import React, { Component } from 'react';

import { IssueProps } from "../types/IssueState";
import { Table } from 'react-bootstrap';

class IssueRequests extends Component<IssueProps, {}> {
  constructor(props: IssueProps) {
    super(props);
  }

  render(){
    return(
      <div>
        <Table hover responsive size={"md"}>
            <thead>
                <tr>
                    <th>Issue ID</th>
                    <th>Amount</th>
                    <th>Creation</th>
                    <th>Vault BTC Address</th>
                    <th>BTC Transaction</th>
                    <th>Confirmations</th>
                    <th>Complete</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                  <td>1</td>
                  <td>0.5 PolkaBTC</td>
                  <td>21 Jun 2020 19:08</td>
                  <td>aa269f4bd72bd...7d10a62a9cdd8d7f</td>
                  <td>3b4162a307fab...b588d61a9069e762</td>
                  <td>6</td>
                  <td>Confirm</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>0.2 PolkaBTC</td>
                  <td>21 Jun 2020 21:08</td>
                  <td>aa269f4bd72bd...7d10a62a9cdd8d7f</td>
                  <td>d3c6652dfa406...e4aacb4c441e030e</td>
                  <td>1</td>
                  <td>Confirm</td>
                </tr>
            </tbody>
        </Table>
      </div>
    )
  }
}

export default IssueRequests;
