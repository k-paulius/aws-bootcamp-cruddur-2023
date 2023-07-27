require 'aws-sdk-s3'
require 'json'

def handler(event:, context:)
  puts "Event:"
  puts event

  if event["routeKey"] == "POST /avatars/key_upload"
    body_hash = JSON.parse(event["body"])
    extension = body_hash["extension"]
    cognito_user_uuid = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    puts cognito_user_uuid

    s3 = Aws::S3::Resource.new
    bucket_name = ENV["THUMBING_UPLOADS_BUCKET_NAME"]
    object_key = "#{cognito_user_uuid}.#{extension}"
    puts({object_key: object_key}.to_json)

    obj = s3.bucket(bucket_name).object(object_key)
    url = obj.presigned_url(:put, expires_in: 60 * 5)
    url # this is the data that will be returned
    body = {url: url}.to_json
    {
      statusCode: 200,
      body: body
    }
  end
end

puts handler(
  event: {},
  context: {}
)