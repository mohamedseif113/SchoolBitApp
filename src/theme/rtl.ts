import { I18nManager } from 'react-native';


export function initNativeRTL() {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
}

export function configureRTL(_lang?: string) {

}

export default configureRTL;
