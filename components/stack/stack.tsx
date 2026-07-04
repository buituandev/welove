import { NativeStackNavigationEventMap, withLayoutContext } from 'expo-router';
import { ParamListBase, StackNavigationState } from 'expo-router/react-navigation';
import { createBlankStackNavigator, type BlankStackNavigationOptions } from 'react-native-screen-transitions/blank-stack';
const { Navigator } = createBlankStackNavigator();

export const Stack = withLayoutContext<
    BlankStackNavigationOptions,
    typeof Navigator,
    StackNavigationState<ParamListBase>,
    NativeStackNavigationEventMap
>(Navigator);