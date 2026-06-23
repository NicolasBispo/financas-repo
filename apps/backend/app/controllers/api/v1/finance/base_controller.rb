# frozen_string_literal: true

module API
  module V1
    module Finance
      # Base for all finance endpoints. Everything is scoped to current_user, so
      # Pundit's per-action authorization is not used here.
      class BaseController < API::V1::APIController
        skip_after_action :verify_authorized, raise: false
        skip_after_action :verify_policy_scoped, raise: false

        private

        # Resolve a category by id, by name (creating it on demand), or fall back
        # to a per-user "General" bucket.
        def resolve_category(category_id: nil, category_name: nil)
          if category_id.present?
            current_user.transaction_categories.find(category_id)
          elsif category_name.present?
            find_or_create_category(category_name)
          else
            find_or_create_category('General')
          end
        end

        def find_or_create_category(name)
          trimmed = name.to_s.strip
          current_user.transaction_categories
                      .where('lower(name) = ?', trimmed.downcase)
                      .first_or_create!(name: trimmed)
        end

        def resolve_currency_for_create(currency_code)
          return ::Finance::Currency.normalize(currency_code) if currency_code.present?

          setting = current_user.finance_setting
          return ::Finance::Currency.normalize(setting.default_currency) if setting

          ::Finance::Currency.from_accept_language(request.headers['Accept-Language'])
        end

        # A credit card is only attached to expenses, and only if the user owns it.
        def resolve_credit_card_id(transaction_type, credit_card_id)
          return nil unless transaction_type.to_s == 'expense'
          return nil if credit_card_id.blank?

          current_user.credit_cards.find(credit_card_id).id
        end

        def parse_transaction_type(value)
          case value.to_s.strip.downcase
          when 'income', '0' then :income
          else :expense
          end
        end

        def parse_frequency(value)
          case value.to_s.strip.downcase
          when 'daily', '1' then :daily
          when 'weekly', '2' then :weekly
          when 'monthly', '3' then :monthly
          when 'yearly', '4' then :yearly
          else :none
          end
        end

        def period_bounds
          start_at = parse_time(params[:start]) || Time.current.beginning_of_month
          end_at = parse_time(params[:end]) || Time.current.end_of_month
          [start_at, end_at]
        end

        def month_bounds(year, month)
          y = year.presence&.to_i || Date.current.year
          m = month.presence&.to_i || Date.current.month
          m = Date.current.month unless (1..12).cover?(m)
          start_at = Time.zone.local(y, m, 1).beginning_of_day
          [start_at, start_at.end_of_month]
        end

        def parse_time(value)
          return nil if value.blank?

          Time.zone.parse(value.to_s)
        rescue ArgumentError
          nil
        end

        def cast_boolean(value)
          ActiveModel::Type::Boolean.new.cast(value)
        end

        def with_associations(transaction)
          current_user.financial_transactions
                      .includes(:transaction_category, :credit_card)
                      .find(transaction.id)
        end
      end
    end
  end
end
