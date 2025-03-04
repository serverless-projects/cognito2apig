# AWS API Gateway Test with cognito <a href="https://www.npmjs.com/package/cognito2apig"><img alt="NPM Version" src="https://img.shields.io/npm/v/cognito2apig.svg?style=flat-square" /></a>

### Notes

The original owner holds several PRs for a while. So I have to manage the change with new npm packages. 

A simple CLI to test API Gateway endpoints with IAM authorization. Uses the AWS SDK, AWS Cognito JS SDK, and the generic [API Gateway Client][apiGClient]. Using the login information given, this tool logs a user into the Cognito User Pool, gets the temporary IAM credentials, and makes the API request. It can be difficult to do these steps by hand without scripting them.

### Installation

To install globally run the following:

```
$ npm install -g cognito2apig
```

You can also use it locally using:

```
$ npx cognito2apig
```

### Usage

If you have it globally installed:

``` bash
$ coginto2apig \
  --username='johndoe' \
  --password='password' \
  --user-pool-id='us-east-1_Xxxxxxxx' \
  --app-client-id='29xxyyxxyxxxyyxxxyy' \
  --cognito-region='us-east-1' \
  --identity-pool-id='us-east-1:99xxyyx-9999-9999-xx0x-99xxxxxxxx' \
  --invoke-url='https://99xxxxxxx.execute-api.us-east-1.amazonaws.com' \
  --api-gateway-region='us-east-1' \
  --api-key='x3xaacea33DCDA3aqafae28aCdaeEWXX1ada3acx' \
  --path-template='/users' \
  --method='GET' \
  --params='{}' \
  --additional-params='{}' \
  --access-token-header='cognito-access-token' \
  --body='{}'
```

If you have it locally installed:

``` bash
$ coginto2apig --options
```

If you have body from file:

``` bash
$ cognito2apig --body='@mocks/create.json' --options
```

This command takes the following options:

- `username`
  The username of the Cognito User Pool user.

- `password`
  The password of the Cognito User Pool user.

- `user-pool-id`
  The Cognito User Pool Id.

- `app-client-id`
  The Cognito User Pool App Client Id.

- `cognito-region`
  The Cognito User Pool region. Defaults to `us-east-1`.

- `identity-pool-id`
  The Cognito Identity Pool Id.

- `invoke-url`
  The API Gateway root endpoint.

- `api-gateway-region`
  The API Gateway region. Defaults to `us-east-1`.
  
- `api-key`
  The API key if required by the method. Defaults to none.

- `path-template`
  The path template of the API.

- `method`
  The API method. Defaults to `GET`.

- `params`
  The API params (path, header, querystring, etc) as a JSON string. Defaults to `'{}'`.

- `additional-params`
  Any additional params (including the querystring) as a JSON string. Defaults to `'{}'`.

- `access-token-header`
  Header field on which to pass the access token.

- `body`
  The request body as a JSON string or file (start with @). Defaults to `'{}'`.

For additional documentation on the format for `params` and `additional-params`; refer to the generic [API Gateway Client][apiGClient] docs.

### Local Development

Clone the repo and initialize the project.

```
$ node index.js --options
```

To install the `cognito2apig` command, run the following:

```
$ npm link
```
