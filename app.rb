# frozen_string_literal: true

require 'bundler/setup'
Bundler.require
require 'sinatra'
require 'sinatra/reloader' if development?
require './models.rb'
require 'securerandom'

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

get '/chooser' do
  erb :chooser
end

get '/error' do
  erb :error
end

post '/make' do
  @room_id = SecureRandom.hex(10)
  erb :owner
end

post '/join' do
  @room_id = params[:text]
  erb :sender
end