# frozen_string_literal: true

# Drops the devise_token_auth-specific columns now that authentication is
# handled by devise-jwt (stateless JWT in the Authorization header).
class RemoveDeviseTokenAuthFieldsFromUsers < ActiveRecord::Migration[8.1]
  def up
    safety_assured do
      remove_index :users, column: %i[uid provider], unique: true, if_exists: true
      remove_column :users, :provider, if_exists: true
      remove_column :users, :uid, if_exists: true
      remove_column :users, :tokens, if_exists: true
    end
  end

  def down
    change_table :users, bulk: true do |t|
      t.string :provider, null: false, default: 'email'
      t.string :uid, null: false, default: ''
      t.json :tokens

      t.index %i[uid provider], unique: true
    end
  end
end
