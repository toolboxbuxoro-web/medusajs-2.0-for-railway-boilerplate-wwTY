import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"
import { useTranslations } from 'next-intl'

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)
  const t = useTranslations('account')

  return (
    <div
      className="w-full flex flex-col"
      data-testid="login-page"
    >
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {t('welcome_back')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {t('sign_in_description')}
        </p>
      </div>

      {/* Form */}
      <form className="w-full space-y-4" action={formAction}>
        <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('phone')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+998 90 123 45 67"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                data-testid="phone-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                data-testid="password-input"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)}
            className="text-sm text-red-600 hover:underline"
            data-testid="forgot-password-button"
          >
            {t("forgot_password") || "Забыли пароль?"}
          </button>
        </div>

        <ErrorMessage error={message} data-testid="login-error-message" />

        <button
          type="submit"
          className="w-full py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
          data-testid="sign-in-button"
        >
          {t('sign_in')}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">{t('not_a_member')}</span>
        </div>
      </div>

      {/* Register Link */}
      <button
        onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
        className="w-full py-3 sm:py-3.5 border-2 border-gray-200 hover:border-red-500 text-gray-700 hover:text-red-600 font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base"
        data-testid="register-button"
      >
        {t('join_us')}
      </button>
    </div>
  )
}

export default Login
