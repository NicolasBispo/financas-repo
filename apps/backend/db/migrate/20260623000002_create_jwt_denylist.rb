# frozen_string_literal: true

# Revocation strategy table for devise-jwt. A token's `jti` is added here on
# sign out and checked on every authenticated request.
class CreateJwtDenylist < ActiveRecord::Migration[8.1]
  def change
    create_table :jwt_denylist do |t|
      t.string :jti, null: false
      t.datetime :exp, null: false
    end

    add_index :jwt_denylist, :jti
  end
end
