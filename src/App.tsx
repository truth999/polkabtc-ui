
import React, {
  useState,
  useEffect,
  useCallback
} from 'react';
import {
  Switch,
  Route,
  Redirect
} from 'react-router-dom';
import { matchPath } from 'react-router';
import {
  toast,
  ToastContainer
} from 'react-toastify';
import {
  useSelector,
  useDispatch,
  useStore
} from 'react-redux';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress
} from '@polkadot/extension-dapp';
import keyring from '@polkadot/ui-keyring';
import {
  FaucetClient,
  satToBTC,
  createPolkabtcAPI,
  PolkaBTCAPI
} from '@interlay/polkabtc';
import { StatusCode } from '@interlay/polkabtc/build/interfaces';
import Big from 'big.js';

import Layout from 'parts/Layout';
import Application from 'pages/Application';
import Dashboard from 'pages/dashboard/dashboard.page';
import VaultDashboard from 'pages/vault-dashboard/vault-dashboard.page';
import StakedRelayer from 'pages/staked-relayer/staked-relayer.page';
import Challenges from 'pages/Challenges';
import VaultsDashboard from 'pages/dashboard/vaults/vaults.dashboard.page';
import IssueRequests from 'pages/dashboard/IssueRequests';
import RedeemRequests from 'pages/dashboard/RedeemRequests';
import LandingPage from 'pages/landing/landing.page';
import RelayDashboard from 'pages/dashboard/relay/relay.dashboard.page';
import OraclesDashboard from 'pages/dashboard/oracles/oracles.dashboard.page';
import ParachainDashboard from 'pages/dashboard/parachain/parachain.dashboard.page';
import Feedback from 'pages/Feedback';
// TODO: block for now
// import TransitionWrapper from 'parts/TransitionWrapper';
import AccountModal from 'common/components/account-modal/account-modal';
import LazyLoadingErrorBoundary from 'utils/hocs/LazyLoadingErrorBoundary';
import checkStaticPage from 'config/check-static-page';
import { PAGES } from 'utils/constants/links';
import {
  isPolkaBtcLoaded,
  changeAddressAction,
  initGeneralDataAction,
  setInstalledExtensionAction,
  showAccountModalAction,
  updateAccountsAction,
  isFaucetLoaded,
  isStakedRelayerLoaded,
  isVaultClientLoaded
} from 'common/actions/general.actions';
import './i18n';
import * as constants from './constants';
import startFetchingLiveData from 'common/live-data/live-data';
import {
  StoreType,
  ParachainStatus
} from 'common/types/util.types';
// theme
// FIXME: Clean-up and move to scss
import './_general.scss';
import 'react-toastify/dist/ReactToastify.css';
import { ACCOUNT_ID_TYPE_NAME } from './constants';

// TODO: block code-splitting for now
// const Application = React.lazy(() =>
//   import(/* webpackChunkName: 'application' */ 'pages/Application')
// );
// const Dashboard = React.lazy(() =>
//   import(/* webpackChunkName: 'dashboard' */ 'pages/dashboard/dashboard.page')
// );
// const VaultDashboardPage = React.lazy(() =>
//   import(/* webpackChunkName: 'vault' */ 'pages/vault-dashboard/vault-dashboard.page')
// );
// const StakedRelayerPage = React.lazy(() =>
//   import(/* webpackChunkName: 'staked-relayer' */ 'pages/staked-relayer/staked-relayer.page')
// );
// const Challenges = React.lazy(() =>
//   import(/* webpackChunkName: 'challenges' */ 'pages/Challenges')
// );
// const VaultsDashboard = React.lazy(() =>
//   import(/* webpackChunkName: 'vaults' */ 'pages/dashboard/vaults/vaults.dashboard.page')
// );
// const IssueRequests = React.lazy(() =>
//   import(/* webpackChunkName: 'issue' */ 'pages/dashboard/IssueRequests')
// );
// const RedeemRequests = React.lazy(() =>
//   import(/* webpackChunkName: 'redeem' */ 'pages/dashboard/RedeemRequests')
// );
// const LandingPage = React.lazy(() =>
//   import(/* webpackChunkName: 'landing' */ 'pages/landing/landing.page')
// );
// const RelayDashboard = React.lazy(() =>
//   import(/* webpackChunkName: 'relay' */ 'pages/dashboard/relay/relay.dashboard.page')
// );
// const OraclesDashboard = React.lazy(() =>
//   import(/* webpackChunkName: 'oracles' */ 'pages/dashboard/oracles/oracles.dashboard.page')
// );
// const ParachainDashboard = React.lazy(() =>
//   import(/* webpackChunkName: 'parachain' */ 'pages/dashboard/parachain/parachain.dashboard.page')
// );
// const Feedback = React.lazy(() =>
//   import(/* webpackChunkName: 'feedback' */ 'pages/Feedback')
// );

function connectToParachain(): Promise<PolkaBTCAPI> {
  return createPolkabtcAPI(
    constants.PARACHAIN_URL,
    constants.BITCOIN_NETWORK === 'regtest' ? constants.BITCOIN_REGTEST_URL : constants.BITCOIN_NETWORK
  );
}

function App(): JSX.Element {
  const polkaBtcLoaded = useSelector((state: StoreType) => state.general.polkaBtcLoaded);
  const address = useSelector((state: StoreType) => state.general.address);
  const [isLoading, setIsLoading] = useState(true);
  const extensions = useSelector((state: StoreType) => state.general.extensions);
  const dispatch = useDispatch();
  const store = useStore();

  // Load the main PolkaBTC API - connection to the PolkaBTC bridge
  const loadPolkaBTC = useCallback(async (): Promise<void> => {
    try {
      window.polkaBTC = await connectToParachain();
      dispatch(isPolkaBtcLoaded(true));
      setIsLoading(false);
    } catch (error) {
      toast.warn('Unable to connect to the BTC-Parachain.');
      console.log('Unable to connect to the BTC-Parachain.');
      console.log('error.message => ', error.message);
    }

    try {
      startFetchingLiveData(dispatch, store);
    } catch (error) {
      console.log('Error fetching live data.');
      console.log('error.message => ', error.message);
    }
  }, [
    dispatch,
    store
  ]);

  // Load the connection to the faucet - only for testnet purposes
  const loadFaucet = useCallback(async (): Promise<void> => {
    try {
      window.faucet = new FaucetClient(constants.FAUCET_URL);
      dispatch(isFaucetLoaded(true));
    } catch (error) {
      console.log('Unable to connect to the faucet.');
      console.log('error.message => ', error.message);
    }
  }, [
    dispatch
  ]);

  // Maybe load the vault client - only if the current address is also registered as a vault
  const maybeLoadVault = useCallback(async (newAddress: string): Promise<void> => {
    const id = window.polkaBTC.api.createType(ACCOUNT_ID_TYPE_NAME, newAddress);
    let vaultLoaded = false;
    try {
      const vault = await window.polkaBTC.vaults.get(id);
      vaultLoaded = vault !== undefined;
    } catch (error) {
      console.log('No PolkaBTC vault found for the account in the connected Polkadot wallet.');
      console.log('error.message => ', error.message);
    } finally {
      dispatch(isVaultClientLoaded(vaultLoaded));
    }
  }, [
    dispatch
  ]);

  // Maybe load the staked relayer client - only if the current address is also registered as a vault
  const maybeLoadStakedRelayer = useCallback(async (newAddress: string): Promise<void> => {
    const id = window.polkaBTC.api.createType(ACCOUNT_ID_TYPE_NAME, newAddress);
    let relayerLoaded = false;
    try {
      const [isActive, isInactive] = await Promise.all([
        window.polkaBTC.stakedRelayer.isStakedRelayerActive(id),
        window.polkaBTC.stakedRelayer.isStakedRelayerInactive(id)
      ]);
      relayerLoaded = isActive || isInactive;
    } catch (error) {
      console.log('No PolkaBTC staked relayer found for the account in the connected Polkadot wallet.');
      console.log('error.message => ', error.message);
    } finally {
      dispatch(isStakedRelayerLoaded(relayerLoaded));
    }
  }, [
    dispatch
  ]);

  const selectAccount = useCallback(
    async (newAddress: string): Promise<void> => {
      if (!polkaBtcLoaded || !newAddress) {
        return;
      }

      await web3Enable(constants.APP_NAME);
      const { signer } = await web3FromAddress(newAddress);
      window.polkaBTC.setAccount(newAddress, signer);

      dispatch(showAccountModalAction(false));
      dispatch(changeAddressAction(newAddress));
      // reset the staked relayer and vault
      dispatch(isVaultClientLoaded(false));
      dispatch(isStakedRelayerLoaded(false));
      // possibly load vault and relayer if account is set
      await Promise.allSettled([
        maybeLoadVault(newAddress),
        maybeLoadStakedRelayer(newAddress)
      ]);
    },
    [
      polkaBtcLoaded,
      dispatch,
      maybeLoadStakedRelayer,
      maybeLoadVault
    ]
  );

  useEffect(() => {
    // Do not load data if showing static landing page only
    if (checkStaticPage()) return;
    if (!polkaBtcLoaded) return;

    // Initialize data on app bootstrap
    (async () => {
      try {
        const [
          totalPolkaSAT,
          totalLockedDOT,
          btcRelayHeight,
          bitcoinHeight,
          state
        ] = await Promise.all([
          window.polkaBTC.treasury.totalPolkaBTC(),
          window.polkaBTC.collateral.totalLocked(),
          window.polkaBTC.btcRelay.getLatestBlockHeight(),
          window.polkaBTC.btcCore.getLatestBlockHeight(),
          window.polkaBTC.stakedRelayer.getCurrentStateOfBTCParachain()
        ]);
        const totalPolkaBTC = new Big(satToBTC(totalPolkaSAT.toString())).round(3).toString();

        const parachainStatus = (state: StatusCode) => {
          if (state.isError) {
            return ParachainStatus.Error;
          } else if (state.isRunning) {
            return ParachainStatus.Running;
          } else if (state.isShutdown) {
            return ParachainStatus.Shutdown;
          } else {
            return ParachainStatus.Loading;
          }
        };

        dispatch(
          initGeneralDataAction(
            totalPolkaBTC,
            totalLockedDOT.round(3).toString(),
            Number(btcRelayHeight),
            bitcoinHeight,
            parachainStatus(state)
          )
        );
      } catch (error) {
        // TODO: should have error handling instead of console
        console.log(error);
      }
    })();
  }, [
    dispatch,
    polkaBtcLoaded
  ]);

  // Loads the address for the currently select account and maybe loads the vault and staked relayer dashboards
  useEffect(() => {
    // Do not load data if showing static landing page only
    if (checkStaticPage()) return;

    const loadAccountData = async () => {
      if (!polkaBtcLoaded || extensions.length) return false;

      const browserExtensions = await web3Enable(constants.APP_NAME);
      dispatch(setInstalledExtensionAction(browserExtensions.map(ext => ext.name)));

      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        dispatch(changeAddressAction(''));
        return false;
      }

      const addresses = accounts.map(({ address }) => address);
<<<<<<< HEAD

      const accountDetails = accounts.map(item => {
        return { accountAddress: String(item.address), accountName: item.meta.name || '' };
      });

      console.log('account details', accountDetails);
      dispatch(updateAccountsAction(accountDetails));
=======
>>>>>>> 0846c21 (feat: account name in the topbar)

      const accountDetails = accounts.map(item => {
        return { accountAddress: String(item.address), accountName: item.meta.name || '' };
      });

      console.log('account details', accountDetails);
      dispatch(updateAccountsAction(accountDetails));

      let newAddress: string | undefined = undefined;
      if (addresses.includes(address)) {
        newAddress = address;
      } else if (addresses.length === 1) {
        newAddress = addresses[0];
      }

      if (newAddress) {
        const { signer } = await web3FromAddress(newAddress);
        window.polkaBTC.setAccount(newAddress, signer);
        dispatch(changeAddressAction(newAddress));
      } else {
        dispatch(changeAddressAction(''));
        return false;
      }

      return true;
    };

    const id = setTimeout(async () => {
      const accountsLoaded = await loadAccountData();
      if (accountsLoaded) {
        clearInterval(id);
        // possibly load vault and relayer if account is set
        await Promise.allSettled([
          maybeLoadVault(address),
          maybeLoadStakedRelayer(address)
        ]);
      }
    }, 1000);
  }, [
    address,
    polkaBtcLoaded,
    dispatch,
    extensions.length,
    maybeLoadVault,
    maybeLoadStakedRelayer
  ]);

  // Loads the PolkaBTC bridge and the faucet
  useEffect(() => {
    // Do not load data if showing static landing page only
    if (checkStaticPage()) return;
    if (polkaBtcLoaded) return;

    (async () => {
      try {
        // TODO: should avoid any race condition
        setTimeout(() => {
          if (isLoading) setIsLoading(false);
        }, 3000);
        await loadPolkaBTC();
        await loadFaucet();
        keyring.loadAll({});
      } catch (error) {
        console.log(error.message);
      }
    })();
    startFetchingLiveData(dispatch, store);
  }, [
    loadPolkaBTC,
    loadFaucet,
    isLoading,
    polkaBtcLoaded,
    dispatch,
    store
  ]);

  return (
    <>
      <ToastContainer
        position='top-right'
        autoClose={5000}
        hideProgressBar={false} />
      {/* TODO: should move into `Topbar` */}
      <AccountModal
        selectedAccount={address}
        selectAccount={selectAccount} />
      <Layout>
        <LazyLoadingErrorBoundary>
          <Route
            render={({ location }) => {
              if (checkStaticPage()) {
                const pageURLs = [
                  PAGES.stakedRelayer,
                  PAGES.vaults,
                  PAGES.challenges,
                  PAGES.parachain,
                  PAGES.oracles,
                  PAGES.issue,
                  PAGES.redeem,
                  PAGES.relay,
                  PAGES.dashboard,
                  PAGES.vault,
                  PAGES.feedback,
                  PAGES.application
                ];

                for (const pageURL of pageURLs) {
                  if (matchPath(location.pathname, { path: pageURL })) {
                    return <Redirect to={PAGES.home} />;
                  }
                }
              }

              return (
                // TODO: block for now
                // <TransitionWrapper location={location}>
                // TODO: should use loading spinner instead of `Loading...`
                <React.Suspense fallback={<div>Loading...</div>}>
                  <Switch location={location}>
                    <Route path={PAGES.stakedRelayer}>
                      <StakedRelayer />
                    </Route>
                    <Route path={PAGES.vaults}>
                      <VaultsDashboard />
                    </Route>
                    <Route path={PAGES.challenges}>
                      <Challenges />
                    </Route>
                    <Route path={PAGES.parachain}>
                      <ParachainDashboard />
                    </Route>
                    <Route path={PAGES.oracles}>
                      <OraclesDashboard />
                    </Route>
                    <Route path={PAGES.issue}>
                      <IssueRequests />
                    </Route>
                    <Route path={PAGES.redeem}>
                      <RedeemRequests />
                    </Route>
                    <Route path={PAGES.relay}>
                      <RelayDashboard />
                    </Route>
                    <Route path={PAGES.dashboard}>
                      <Dashboard />
                    </Route>
                    <Route path={PAGES.vault}>
                      <VaultDashboard />
                    </Route>
                    <Route path={PAGES.feedback}>
                      <Feedback />
                    </Route>
                    <Route
                      exact
                      path={PAGES.application}>
                      <Application />
                    </Route>
                    <Route
                      path={PAGES.home}
                      exact>
                      <LandingPage />
                    </Route>
                  </Switch>
                </React.Suspense>
                // </TransitionWrapper>
              );
            }} />
        </LazyLoadingErrorBoundary>
      </Layout>
    </>
  );
}

export default App;
