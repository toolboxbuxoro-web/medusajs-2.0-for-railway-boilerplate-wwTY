import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';

interface AuthSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AuthSheet({ isVisible, onClose }: AuthSheetProps) {
  const { requestOtp, verifyOtp, loading } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleRequestOtp = async () => {
    if (phone.length < 9) {
      setError('Введите корректный номер телефона');
      return;
    }
    setError(null);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Ошибка запроса кода');
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setOtp(code);
    if (code.length === 6) {
      setError(null);
      try {
        await verifyOtp(phone, code);
        onClose();
        reset();
      } catch (err: any) {
        setError(err.message || 'Неверный код');
        setOtp('');
      }
    }
  };

  const reset = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setError(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="bg-white rounded-t-3xl p-6"
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  {step === 'phone' ? 'Вход или регистрация' : 'Подтверждение'}
                </Text>
                <Pressable onPress={handleClose} className="p-2">
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </View>

              {step === 'phone' ? (
                <View>
                  <Text className="text-gray-500 mb-4">
                    Введите номер телефона, чтобы войти или зарегистрироваться
                  </Text>
                  <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-200">
                    <Text className="text-gray-900 text-base font-medium mr-2">+998</Text>
                    <TextInput
                      className="flex-1 text-gray-900 text-base py-0"
                      placeholder="90 123 45 67"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        setError(null);
                      }}
                      autoFocus
                      maxLength={15}
                    />
                  </View>
                  
                  {error && <Text className="text-red-500 mt-2 text-sm">{error}</Text>}

                  <Pressable
                    className={`mt-6 rounded-xl py-4 items-center ${phone.length >= 9 ? 'bg-primary' : 'bg-gray-300'}`}
                    onPress={handleRequestOtp}
                    disabled={phone.length < 9 || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-base">Получить код</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text className="text-gray-500 mb-4">
                    Мы отправили СМС с кодом на номер +998 {phone}
                  </Text>
                  
                  <View className="flex-row justify-center mb-4">
                    <TextInput
                      ref={otpInputRef}
                      className="bg-gray-100 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[10px] w-full border border-gray-200"
                      placeholder="000000"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={handleVerifyOtp}
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  {error && <Text className="text-red-500 mb-4 text-center text-sm">{error}</Text>}

                  <Pressable 
                    onPress={() => setStep('phone')}
                    className="py-2"
                  >
                    <Text className="text-primary text-center font-medium">
                      Изменить номер телефона
                    </Text>
                  </Pressable>

                  {loading && (
                    <View className="mt-4 items-center">
                      <ActivityIndicator color="#DC2626" />
                    </View>
                  )}
                </View>
              )}
              
              <View className="h-8" />
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
