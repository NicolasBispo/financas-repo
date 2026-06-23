# frozen_string_literal: true

module API
  module V1
    module Finance
      class SettingsController < BaseController
        def show
          setting = current_user.finance_setting
          if setting
            render json: { defaultCurrency: ::Finance::Currency.normalize(setting.default_currency),
                           source: 'user' }
          else
            region = ::Finance::Currency.from_accept_language(request.headers['Accept-Language'])
            render json: { defaultCurrency: region, source: 'region' }
          end
        end

        def update
          setting = current_user.finance_setting || current_user.build_finance_setting
          setting.default_currency = params[:defaultCurrency].presence || params[:default_currency]
          setting.save!
          render json: { defaultCurrency: setting.default_currency, source: 'user' }
        end
      end
    end
  end
end
