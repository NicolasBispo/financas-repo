# frozen_string_literal: true

module API
  module V1
    module Finance
      class CategoriesController < BaseController
        def index
          categories = current_user.transaction_categories.order(:name)
          render json: categories.map { |c| ::Finance::CategorySerializer.call(c) }
        end

        def create
          category = current_user.transaction_categories.create!(category_attributes)
          render json: ::Finance::CategorySerializer.call(category), status: :created
        end

        def update
          category = current_user.transaction_categories.find(params[:id])
          category.update!(category_attributes)
          render json: ::Finance::CategorySerializer.call(category)
        end

        private

        def category_attributes
          attrs = {}
          attrs[:name] = params[:name] if params.key?(:name)
          attrs[:color_hex] = params[:colorHex] if params.key?(:colorHex)
          attrs[:icon] = params[:icon] if params.key?(:icon)
          attrs
        end
      end
    end
  end
end
