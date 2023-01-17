import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { Box, globalColors, Inset, Stack, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React, { useRef } from 'react';
import * as i18n from '@/languages';
import { HARDWARE_WALLETS, PROFILES, useExperimentalFlag } from '@/config';
import { analytics, analyticsV2 } from '@/analytics';
import { InteractionManager } from 'react-native';
import { createAccountForWallet, walletsLoadState } from '@/redux/wallets';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { createWallet } from '@/model/wallet';
import WalletTypes from '@/helpers/walletTypes';
import logger from '@/utils/logger';
import { captureException } from '@sentry/react-native';
import { useDispatch } from 'react-redux';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import showWalletErrorAlert from '@/helpers/support';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { useInitializeWallet, useWallets } from '@/hooks';

const TRANSLATIONS = i18n.l.wallet.new.add_wallet;

export const AddWalletSheet = () => {
  const { goBack, navigate } = useNavigation();

  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const creatingWallet = useRef<boolean>();
  const {
    isDamaged,
    selectedWallet,
    setIsWalletLoading,
    wallets,
  } = useWallets();

  const onPressCreate = async () => {
    try {
      analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
        isFirstWallet: false,
        type: 'new',
      });
      analytics.track('Tapped "Create a new wallet"');
      if (creatingWallet.current) return;
      creatingWallet.current = true;

      // Show naming modal
      InteractionManager.runAfterInteractions(() => {
        goBack();
      });
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          navigate(Routes.MODAL_SCREEN, {
            actionType: 'Create',
            asset: [],
            isNewProfile: true,
            onCancel: () => {
              creatingWallet.current = false;
              setIsWalletLoading(null);
            },
            onCloseModal: async (args: any) => {
              if (args) {
                setIsWalletLoading(WalletLoadingStates.CREATING_WALLET);
                const name = args?.name ?? '';
                const color = args?.color ?? null;
                // Check if the selected wallet is the primary
                let primaryWalletKey = selectedWallet.primary
                  ? selectedWallet.id
                  : null;

                // If it's not, then find it
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (
                      wallet?.type === WalletTypes.mnemonic &&
                      wallet.primary
                    ) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });

                // If there's no primary wallet at all,
                // we fallback to an imported one with a seed phrase
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (
                      wallet?.type === WalletTypes.mnemonic &&
                      wallet.imported
                    ) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });
                try {
                  // If we found it and it's not damaged use it to create the new account
                  if (
                    primaryWalletKey &&
                    !wallets?.[primaryWalletKey].damaged
                  ) {
                    const newWallets = await dispatch(
                      createAccountForWallet(primaryWalletKey, color, name)
                    );
                    // @ts-ignore
                    await initializeWallet();
                    // If this wallet was previously backed up to the cloud
                    // We need to update userData backup so it can be restored too
                    if (
                      wallets?.[primaryWalletKey].backedUp &&
                      wallets[primaryWalletKey].backupType ===
                        WalletBackupTypes.cloud
                    ) {
                      try {
                        await backupUserDataIntoCloud({ wallets: newWallets });
                      } catch (e) {
                        logger.sentry(
                          'Updating wallet userdata failed after new account creation'
                        );
                        captureException(e);
                        throw e;
                      }
                    }

                    // If doesn't exist, we need to create a new wallet
                  } else {
                    await createWallet(
                      null,
                      color,
                      name,
                      false,
                      null,
                      null,
                      false,
                      true
                    );
                    await dispatch(walletsLoadState(profilesEnabled));
                    // @ts-ignore
                    await initializeWallet();
                  }
                } catch (e) {
                  logger.sentry('Error while trying to add account');
                  captureException(e);
                  if (isDamaged) {
                    setTimeout(() => {
                      showWalletErrorAlert();
                    }, 1000);
                  }
                }
              }
              creatingWallet.current = false;
              setIsWalletLoading(null);
            },
            profile: {
              color: null,
              name: ``,
            },
            type: 'wallet_profile',
          });
        }, 50);
      });
    } catch (e) {
      setIsWalletLoading(null);
      logger.log('Error while trying to add account', e);
    }
  };

  const onPressRestore = () => {
    analytics.track('Tapped "Add an existing wallet"');
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: false,
      type: 'seed',
    });
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_SEED_PHRASE_FLOW,
      params: { type: 'import' },
    });
  };

  const onPressWatch = () => {
    analytics.track('Tapped "Add an existing wallet"');
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: false,
      type: 'watch',
    });
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_SEED_PHRASE_FLOW,
      params: { type: 'watch' },
    });
  };

  const onPressConnectHardwareWallet = () => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: false,
      type: 'ledger_nano_x',
    });
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR);
    });
  };

  const create: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.create_new.title),
    description: i18n.t(TRANSLATIONS.create_new.description),
    icon: '􀁌',
    iconColor: globalColors.pink60,
    testID: 'create-new-button',
    onPress: onPressCreate,
  };

  const restore: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.seed.title),
    description: i18n.t(TRANSLATIONS.seed.description),
    icon: '􀑚',
    iconColor: globalColors.purple60,
    testID: 'restore-with-key-button',
    onPress: onPressRestore,
  };

  const watch: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.watch.title),
    description: i18n.t(TRANSLATIONS.watch.description),
    icon: '􀒒',
    iconColor: globalColors.green60,
    testID: 'watch-address-button',
    onPress: onPressWatch,
  };

  const connectHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.hardware_wallet.description),
    icon: '􀕹',
    iconColor: globalColors.blue60,
    testID: 'connect-hardware-wallet-button',
    onPress: onPressConnectHardwareWallet,
  };

  return (
    <Box height="full" background="surfaceSecondary">
      <Inset horizontal="20px" top="36px" bottom="104px">
        <Stack space="32px">
          <Stack space="20px">
            <Text align="center" size="26pt" weight="bold" color="label">
              {i18n.t(TRANSLATIONS.sheet.title)}
            </Text>
            <Text
              align="center"
              size="15pt / 135%"
              weight="semibold"
              color="labelTertiary"
            >
              {i18n.t(TRANSLATIONS.sheet.description)}
            </Text>
          </Stack>
          <Box background="surfacePrimary" borderRadius={18} shadow="12px">
            <Inset vertical="24px" horizontal="20px">
              <AddWalletList
                totalHorizontalInset={40}
                items={[
                  create,
                  ...(hardwareWalletsEnabled ? [connectHardwareWallet] : []),
                  watch,
                  restore,
                ]}
              />
            </Inset>
          </Box>
        </Stack>
      </Inset>
    </Box>
  );
};