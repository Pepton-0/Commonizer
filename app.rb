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

set :_webextensin, File.dirname(__FILE__) + '/_webextension'

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

get '/chrome_extension_download' do
  crxPath = '_webextension/src.crx'
  send_file crxPath
end

post '/make' do
  @room_id = SecureRandom.hex(6)
  erb :owner
end

post '/join' do
  @room_id = params[:text]
  erb :sender
end