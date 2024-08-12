import {useState, useEffect} from 'react';
import {Keyboard} from 'react-native';

export function useKeyboardStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', e => {
      setIsOpen(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setIsOpen(false);
        setKeyboardHeight(0);
      },
    );

    return () => {
      if (keyboardShowListener) {
        keyboardShowListener.remove();
      }
      if (keyboardHideListener) {
        keyboardHideListener.remove();
      }
    };
  });

  return {isOpen, keyboardHeight};
}
