import React from 'react';
import InterlayLink from 'components/UI/InterlayLink';
import { BTC_ADDRESS_API } from 'config/blockchain';

export default class BitcoinBlockHash extends React.Component<{
  blockHash: string;
}> {
  render(): JSX.Element {
    return (
      <InterlayLink
        href={BTC_ADDRESS_API + this.props.blockHash}
        target='_blank'
        rel='noopener noreferrer'>
        {this.props.blockHash}
      </InterlayLink>
    );
  }
}
