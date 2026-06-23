# frozen_string_literal: true

# Returns a 401 JSON body for failed authentication on API requests instead of
# redirecting to the sign-in page (which is Devise's default for navigational
# formats). HTML requests — e.g. the ActiveAdmin login — keep the default
# redirect behaviour.
class JsonFailureApp < Devise::FailureApp
  def respond
    if api_request?
      json_error_response
    else
      super
    end
  end

  private

  def api_request?
    request.path.start_with?('/api') || request.format.json?
  end

  def json_error_response
    self.status = 401
    self.content_type = 'application/json'
    self.response_body = { errors: [i18n_message] }.to_json
  end
end
