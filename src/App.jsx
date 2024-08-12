import {SafeAreaView} from 'react-native';
import React from 'react';
import AddStory from './screens/AddStory';
import StoryCanvas from './screens/StoryCanvas';
import {
  NavigationContainer,
  createStackNavigator,
} from '@react-navigation/native';

const App = () => {
  const {Navigator, Screen} = createStackNavigator();
  return (
    <SafeAreaView style={{flex: 1}}>
      <NavigationContainer>
        <Navigator
          initialRouteName="MyTabs"
          screenOptions={{
            headerShown: false,
          }}
          shouldRasterizeIOS>
          <Screen name="AddStory" component={AddStory} />
          <Screen name="StoryCanvas" component={StoryCanvas} />
        </Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default App;
