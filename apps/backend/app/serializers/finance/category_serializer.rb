# frozen_string_literal: true

module Finance
  class CategorySerializer
    def self.call(category)
      new(category).as_json
    end

    def initialize(category)
      @category = category
    end

    def as_json(*)
      {
        id: @category.id,
        name: @category.name,
        colorHex: @category.color_hex,
        icon: @category.icon
      }
    end
  end
end
