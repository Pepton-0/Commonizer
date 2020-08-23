# frozen_string_literal: true

require 'bundler/setup'
Bundler.require
require 'sinatra'
require 'sinatra/reloader' if development?
require './models.rb'

# if development?
#   require 'webrick/https'
#   require 'openssl'

#   set :server_settings,
#     SSLEnable: true,
#     SSLCertName: [['CN', "develop.test"]]
# end

get '/' do
  # erb :index
  erb :sample
end

post '/send' do
  @sender_id = rand
  erb :sender
end

post '/receive' do
  erb :receiver
end

post '/joinroom' do
end