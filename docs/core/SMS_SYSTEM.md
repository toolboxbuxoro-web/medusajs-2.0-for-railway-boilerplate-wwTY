# SMS System

## Overview
The SMS system is responsible for delivering OTP codes to users.

## Provider Integration
- **Current implementation**: Uses a dedicated SMS provider (e.g., Eskiz or similar) via a custom notification provider or direct fetch within the OTP request route.
- **Message Template**: 
  - English/Standard: `Your code is: 123456. Do not share it.`
  - Russian: `Ваш код: 123456. Не сообщайте его никому.`
  - Uzbek: `Sizning kodingiz: 123456. Uni hech kimga bermang.`

## Reliability and Logging
- **Success Logging**: Every successful SMS dispatch is logged in the backend with the recipient phone and provider response ID.
- **Error Handling**: If the SMS provider fails, a `failed_to_send_otp` error is returned to the user, and the error is logged for investigation.
- **Queueing**: (Optional) In high-traffic scenarios, SMS delivery can be offloaded to a background worker (e.g., Redis Streams or BullMQ).

## Formatting
- **Phone Prefix**: All numbers sent to the provider are formatted with a `+` prefix and country code.
- **Normalization**: Handled by `lib/phone.ts` to ensure consistency.
