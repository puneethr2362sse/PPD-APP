import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}) => {
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const digits = [
    value[0] || '',
    value[1] || '',
    value[2] || '',
    value[3] || '',
  ];

  useEffect(() => {
    // Focus first empty box on mount
    const firstEmpty = digits.findIndex(d => !d);
    const target = firstEmpty === -1 ? 0 : firstEmpty;
    if (!disabled && inputRefs[target]?.current) {
      inputRefs[target].current?.focus();
    }
  }, []);

  const handleChangeText = (index: number, text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');

    if (!numeric) {
      const newDigits = [...digits];
      newDigits[index] = '';
      const newOtp = newDigits.join('');
      onChange(newOtp);
      return;
    }

    // Support paste of 4 digits
    if (numeric.length >= 4) {
      const pasted = numeric.slice(0, 4);
      onChange(pasted);
      inputRefs[3].current?.focus();
      if (onComplete) onComplete(pasted);
      return;
    }

    const char = numeric.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const newOtp = newDigits.join('');
    onChange(newOtp);

    // Auto advance
    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    } else {
      inputRefs[index].current?.blur();
      if (newOtp.length === 4 && onComplete) {
        onComplete(newOtp);
      }
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        const newOtp = newDigits.join('');
        onChange(newOtp);
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((index) => {
        const isFilled = !!digits[index];
        return (
          <View key={index} style={styles.boxWrapper}>
            <TextInput
              ref={inputRefs[index]}
              style={[
                styles.box,
                isFilled && styles.boxFilled,
                hasError && styles.boxError,
                disabled && styles.boxDisabled,
              ]}
              value={digits[index]}
              onChangeText={(text) => handleChangeText(index, text)}
              onKeyPress={(e) => handleKeyPress(index, e)}
              keyboardType="number-pad"
              maxLength={4}
              editable={!disabled}
              selectTextOnFocus={true}
              textAlign="center"
              cursorColor="#06b6d4"
            />
            {isFilled && <View style={styles.activeDot} />}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  boxWrapper: {
    alignItems: 'center',
  },
  box: {
    width: 60,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#0F1626',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  boxFilled: {
    borderColor: '#06b6d4',
    backgroundColor: '#091528',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  boxError: {
    borderColor: '#f43f5e',
    backgroundColor: '#280c14',
  },
  boxDisabled: {
    opacity: 0.5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4',
    marginTop: 6,
  },
});
