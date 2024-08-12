import React, {useState, useRef, useMemo, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  TextInput,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Video from 'react-native-video';
import {useKeyboardStatus} from '../hooks/useKeyboardStatus';
import RNFS from 'react-native-fs';
import {textColors} from '../constants/textColors';
let {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
let STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

const StoryCanvas = ({route, navigation}) => {
  const _animRatioTrashCan = React.useMemo(() => new Animated.Value(1), []);
  const keyboard = useKeyboardStatus();
  const timestamp = new Date().toISOString();
  const {mediaUri, mediaType} = route.params;
  const [draggingLabel, setDraggingLabel] = useState(false);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#fff');
  const [textAlign, setTextAlign] = useState('center');
  const [textBg, setTextBg] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [textColorVisible, setTextColorVisible] = useState(false);
  const _labeLWrapperYAnim = useMemo(() => new Animated.Value(0), []);
  const ref = useRef({
    processMedia: {
      uri: mediaUri?.path,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      translateX: 0,
      translateY: 0,
      rotateDeg: 0,
      texts: [],
      labels: [],
    },
    textWidth: 0,
    textHeight: 0,
    trashCanX: (SCREEN_WIDTH - 44) / 2,
    trashCanY: SCREEN_HEIGHT - 62,
    zoomTrashCan: false,
    labelContainerY: 0,
  });

  useEffect(() => {
    if (!keyboard.isOpen) {
      setTextVisible(false);
    }
  }, [keyboard.isOpen]);
  const saveMedia = async () => {
    if (mediaUri) {
      const fileName = `${mediaType}_${timestamp}.png`;

      // Determine the correct path for the Downloads directory
      const downloadDir = Platform.select({
        android: `${RNFS.DownloadDirectoryPath}/${fileName}`,
        ios: `${RNFS.DocumentDirectoryPath}/${fileName}`, // iOS doesn't have a public Downloads folder; this uses the app's document directory
      });

      try {
        await RNFS.copyFile(mediaUri.path, downloadDir);
        console.log('Image saved locally in Downloads:', downloadDir);
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }
  };
  // text processing
  const onText = () => {
    refreshTextState();
    setTextVisible(true);
  };

  const refreshTextState = () => {
    setText('');
    setTextAlign('center');
    setTextBg(false);
    setTextColor('#fff');
  };

  const onChangeTextAlign = () => {
    setTextAlign(
      textAlign === 'center'
        ? 'flex-start'
        : textAlign === 'flex-start'
        ? 'flex-end'
        : 'center',
    );
  };
  const onDoneText = () => {
    if (text.length > 0) {
      const offsetX =
        textAlign === 'center'
          ? (SCREEN_WIDTH - ref.current.textWidth) / 2
          : textAlign === 'flex-start'
          ? 15
          : SCREEN_WIDTH - ref.current.textWidth - 15;
      const textZindexList = ref.current.processMedia.texts?.map(x => x.zIndex);
      const labelZindexList = ref.current.processMedia.labels?.map(
        x => x.zIndex,
      );
      let maxlabelZindex = Math.max(...textZindexList.concat(labelZindexList));
      maxlabelZindex = maxlabelZindex !== -Infinity ? maxlabelZindex : 0;
      const storyText = {
        zIndex: maxlabelZindex + 1,
        color: textColor,
        fontSize: 40,
        text,
        textAlign,
        textBg,
        x: offsetX,
        y: (SCREEN_HEIGHT - ref.current.textHeight) / 2,
        animX: new Animated.Value(offsetX),
        animY: new Animated.Value((SCREEN_HEIGHT - ref.current.textHeight) / 2),
        height: ref.current.textHeight,
        width: ref.current.textWidth,
        ratio: 1,
        animRatio: new Animated.Value(1),
      };
      ref.current.processMedia.texts.push(storyText);
      setTextVisible(false);
    }
  };
  const onLabelOptionsContainerTranslateStateChange = ({
    nativeEvent: {translationY, state},
  }) => {
    if (state === State.END) {
      ref.current.labelContainerY += translationY;
    }
  };
  const onLabelOptionsContainerTranslate = ({nativeEvent: {translationY}}) => {
    if (
      ref.current.labelContainerY + translationY <
        -(SCREEN_HEIGHT - STATUS_BAR_HEIGHT - 50) ||
      ref.current.labelContainerY + translationY > 0
    ) {
      return;
    }
    _labeLWrapperYAnim.setValue(ref.current.labelContainerY + translationY);
  };
  const _onTextLabelTranslateHandler = (
    index,
    {nativeEvent: {translationX, translationY}},
  ) => {
    if (!draggingLabel) {
      setDraggingLabel(true);
    }
    const label = ref.current.processMedia.texts[index];

    if (
      Math.abs(
        (label.y + translationY + label.height) * label.ratio -
          ref.current.trashCanY,
      ) < 50
    ) {
      if (!ref.current.zoomTrashCan) {
        Animated.spring(_animRatioTrashCan, {
          toValue: 1.5,
          useNativeDriver: true,
        }).start(() => (ref.current.zoomTrashCan = true));
      }
    } else {
      if (ref.current.zoomTrashCan) {
        Animated.spring(_animRatioTrashCan, {
          toValue: 1,
          useNativeDriver: true,
        }).start(() => (ref.current.zoomTrashCan = false));
      }
    }
    label.animX.setValue((label.x + translationX) * label.ratio);
    label.animY.setValue((label.y + translationY) * label.ratio);
  };

  const _onTextLabelTranslateChangeState = (
    index,
    {nativeEvent: {translationX, translationY, state}},
  ) => {
    setDraggingLabel(false);
    if (state === State.END) {
      const label = ref.current.processMedia.texts[index];
      label.x += translationX;
      label.y += translationY;
      if (
        Math.abs(
          (label.y + label.height) * label.ratio - ref.current.trashCanY,
        ) < 50
      ) {
        ref.current.processMedia.texts.splice(index, 1);
      }
      ref.current.zoomTrashCan = false;
    }
  };

  // Label zoom processor
  const _onTextLabelZoomHandler = (index, {nativeEvent: {scale}}) => {
    const label = ref.current.processMedia.texts[index];
    label.animRatio.setValue(label.ratio * scale);
  };

  const _onTextLabelZoomChangeState = (
    index,
    {nativeEvent: {scale, state}},
  ) => {
    if (state === State.END) {
      const label = ref.current.processMedia.texts[index];
      label.ratio *= scale;
    }
  };

  return (
    <PanGestureHandler
      onHandlerStateChange={onLabelOptionsContainerTranslateStateChange}
      onGestureEvent={onLabelOptionsContainerTranslate}>
      <View>
        {!draggingLabel && !textVisible && (
          <View style={styles.topOptionsWrapper}>
            <TouchableOpacity
              onPress={navigation.goBack}
              style={styles.btnTopOption}>
              <Icon name="chevron-left" size={40} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onText} style={styles.btnTopOption}>
              <Icon name="alpha-a-box" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={saveMedia} style={styles.iconButton}>
              <Icon name="download" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {/* text canvas */}
        {textVisible && (
          <KeyboardAvoidingView
            behavior="height"
            style={styles.textToolWrapper}>
            <View style={styles.textTopOptions}>
              <TouchableOpacity
                onPress={() => setTextVisible(false)}
                style={styles.btnTopOption}>
                <Icon name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onChangeTextAlign}
                style={styles.btnTopOption}>
                <Icon
                  name={
                    textAlign === 'center'
                      ? 'format-align-center'
                      : textAlign === 'flex-start'
                      ? 'format-align-left'
                      : 'format-align-right'
                  }
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTextColorVisible(!textColorVisible)}
                style={styles.btnTopOption}>
                <Icon
                  name={
                    textColorVisible ? 'invert-colors' : 'invert-colors-off'
                  }
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={setTextBg.bind(null, !textBg)}
                style={styles.btnTopOption}>
                <Icon
                  name={textBg ? 'alpha-a-box' : 'alpha-a-box-outline'}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDoneText}
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  ...styles.btnTopOption,
                  width: 60,
                  marginEnd: 10,
                }}>
                <Text
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    fontWeight: 'bold',
                    color: '#fff',
                    fontSize: 20,
                  }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                ...styles.textWrapper,
                justifyContent: textAlign,
              }}>
              <TouchableOpacity
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  backgroundColor:
                    textBg === true ? textColor : 'rgba(0,0,0,0)',
                  padding: 5,
                  borderRadius: 5,
                  bottom: textColorVisible ? 0 : keyboard.keyboardHeight / 2,
                }}>
                <TextInput
                  onContentSizeChange={e => {
                    ref.current.textHeight = e.nativeEvent.contentSize.height;
                    ref.current.textWidth = e.nativeEvent.contentSize.width;
                  }}
                  multiline={true}
                  autoFocus={true}
                  autoCapitalize="none"
                  value={text}
                  onChangeText={setText}
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    textAlign:
                      textAlign === 'flex-start'
                        ? 'left'
                        : textAlign === 'flex-end'
                        ? 'right'
                        : 'center',
                    fontSize: 40,
                    fontWeight: '800',
                    color: textBg ? '#000' : textColor,
                    maxWidth: SCREEN_WIDTH - 30,
                  }}
                />
              </TouchableOpacity>
            </View>
            {textColorVisible && (
              <View style={styles.textBottompOptions}>
                <View
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    ...styles.circleSelectedColor,
                    backgroundColor: textColor,
                    bottom: 50,
                  }}>
                  <Icon
                    name="eyedropper-variant"
                    size={20}
                    color={textColor === '#fff' ? '#000' : '#fff'}
                  />
                </View>
                <ScrollView
                  showsHorizontalScrollIndicator={false}
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    width: SCREEN_WIDTH,
                    bottom: 50,
                  }}
                  // eslint-disable-next-line react-native/no-inline-styles
                  contentContainerStyle={{flexDirection: 'row'}}
                  keyboardShouldPersistTaps="always"
                  horizontal={true}>
                  {textColors.map((tColor, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setTextColor(tColor)}
                      style={{
                        ...styles.circleTextColor,
                        backgroundColor: tColor,
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
        <ImageBackground
          style={styles.backgroundContainer}
          source={{
            uri: ref.current.processMedia?.uri,
          }}
          blurRadius={0}>
          {ref.current.processMedia?.texts?.map((txtLabel, labelIndex) => (
            <PanGestureHandler
              key={labelIndex}
              onGestureEvent={e => {
                _onTextLabelTranslateHandler(labelIndex, e);
              }}
              onHandlerStateChange={e => {
                _onTextLabelTranslateChangeState(labelIndex, e);
              }}>
              <PinchGestureHandler
                onGestureEvent={e => {
                  _onTextLabelZoomHandler(labelIndex, e);
                }}
                onHandlerStateChange={e => {
                  _onTextLabelZoomChangeState(labelIndex, e);
                }}>
                <Animated.View
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    zIndex: txtLabel.zIndex,
                    backgroundColor: txtLabel.textBg
                      ? txtLabel.color
                      : 'rgba(0,0,0,0)',
                    padding: 5,
                    borderRadius: 5,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: [
                      {
                        translateX: txtLabel.animX,
                      },
                      {
                        translateY: txtLabel.animY,
                      },
                      {
                        scale: txtLabel.animRatio,
                      },
                    ],
                  }}>
                  <Text
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      width: txtLabel.width,
                      height: txtLabel.height + 5,
                      textAlign:
                        txtLabel.textAlign === 'flex-start'
                          ? 'left'
                          : txtLabel.textAlign === 'flex-end'
                          ? 'right'
                          : 'center',
                      fontSize: 40,
                      fontWeight: '800',
                      color: txtLabel.textBg ? '#000' : txtLabel.color,
                    }}>
                    {txtLabel.text}
                  </Text>
                </Animated.View>
              </PinchGestureHandler>
            </PanGestureHandler>
          ))}
          {draggingLabel && (
            <View
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                // position: 'absolute', // Use absolute positioning
                bottom: 200, // Distance from the bottom of the screen
                left: 0,
                right: 0,
                top: 100,
                zIndex: 100,
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                height: 80,
                backgroundColor: 'rgba(0,0,0,0)',
              }}>
              <Animated.View
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  height: 44,
                  width: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 44,
                  borderColor: '#fff',
                  borderWidth: 1,
                  transform: [
                    {
                      scale: _animRatioTrashCan,
                    },
                  ],
                }}>
                <Icon name="trash-can-outline" size={30} color="#fff" />
              </Animated.View>
            </View>
          )}
        </ImageBackground>
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topOptionsWrapper: {
    height: 50 + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    width: '100%',
    paddingHorizontal: 10,
  },

  textToolWrapper: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  textTopOptions: {
    flexDirection: 'row',
    height: 50 + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  textWrapper: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBottompOptions: {
    minHeight: 36,
    marginVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  circleSelectedColor: {
    width: 36,
    marginHorizontal: 5,
    height: 36,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTextColor: {
    width: 36,
    marginHorizontal: 5,
    height: 36,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTopOption: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default StoryCanvas;
