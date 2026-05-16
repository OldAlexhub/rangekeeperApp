import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/components/SplashScreen';
import { Colors } from './src/theme/colors';

function App(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.background}
        translucent={false}
      />
      <AppNavigator />
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
    </>
  );
}

export default App;
