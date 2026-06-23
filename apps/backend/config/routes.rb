# frozen_string_literal: true

Rails.application.routes.draw do
  # JWT authentication (devise-jwt). Tokens are issued in the `Authorization`
  # response header on sign in / sign up and revoked on sign out.
  devise_for :users,
             path: 'api/v1/auth',
             defaults: { format: :json },
             path_names: {
               sign_in: 'sign_in',
               sign_out: 'sign_out',
               registration: 'sign_up',
               password: 'password'
             },
             controllers: {
               sessions: 'api/v1/sessions',
               registrations: 'api/v1/registrations',
               passwords: 'api/v1/passwords'
             }

  namespace :api do
    namespace :v1, defaults: { format: :json } do
      get :status, to: 'health#status'

      devise_scope :user do
        get 'auth/me', to: 'users#show'
        resource :user, only: %i[update show]
      end

      resources :settings, only: [] do
        get :must_update, on: :collection
      end

      namespace :finance do
        resource :settings, only: %i[show update], controller: 'settings'
        get :summary, to: 'summary#show'

        resources :categories, only: %i[index create update]
        resources :banks, only: %i[index create update destroy]

        resources :credit_cards, path: 'credit-cards', only: %i[index create update destroy] do
          member do
            get :summary
            get :transactions
          end
        end

        resources :transactions, only: %i[index show create]
        post 'transaction', to: 'transactions#create'

        resources :installments, only: %i[index create]

        post 'recurring', to: 'recurring#create'
        get 'recurring/pending', to: 'recurring#pending'
        post 'recurring/occurrence', to: 'recurring#occurrence'

        resources :spreadsheet, only: %i[index update destroy]
        post 'spreadsheet/bulk-paid', to: 'spreadsheet#bulk_paid'
        post 'spreadsheet/bulk-delete', to: 'spreadsheet#bulk_delete'
      end
    end
  end

  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)
  namespace :admin do
    authenticate(:admin_user) do
      mount Flipper::UI.app(Flipper) => '/feature-flags'
      mount GoodJob::Engine => '/background-jobs'
    end
  end

  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
end
