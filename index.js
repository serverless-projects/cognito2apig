#!/usr/bin/env node

const packageJson = require('./package.json');
const fs = require('fs');

global.fetch = require('node-fetch');

const AWS = require('aws-sdk');
const AWSCognito = require('amazon-cognito-identity-js');
const apigClientFactory = require('aws-api-gateway-client').default;
const WindowMock = require('window-mock').default;

global.window = { localStorage: new WindowMock().localStorage };
global.navigator = function () {
  return null;
};

const { argv } = require('yargs')
  .option('username', {
    describe: 'Username of the user',
    demandOption: true,
  })
  .option('password', {
    describe: 'Password of the user',
    demandOption: true,
  })
  .option('user-pool-id', {
    describe: 'Cognito user pool id',
    demandOption: true,
  })
  .option('app-client-id', {
    describe: 'Cognito user pool app client id',
    demandOption: true,
  })
  .option('cognito-region', {
    describe: 'Cognito region',
    default: 'us-east-1',
  })
  .option('identity-pool-id', {
    describe: 'Cognito identity pool id',
    demandOption: true,
  })
  .option('invoke-url', {
    describe: 'API Gateway URL',
    demandOption: true,
  })
  .option('api-gateway-region', {
    describe: 'API Gateway region',
    default: 'us-east-1',
  })
  .option('api-key', {
    describe: 'API Key',
    default: undefined,
  })
  .option('path-template', {
    describe: 'API path template',
    demandOption: true,
  })
  .option('method', {
    describe: 'API method',
    default: 'GET',
  })
  .option('params', {
    describe: 'API request params',
    default: '{}',
  })
  .option('additional-params', {
    describe: 'API request additional params',
    default: '{}',
  })
  .option('body', {
    describe: 'API request body',
    default: '{}',
  })
  .option('access-token-header', {
    describe: 'Header to use to pass access token with request',
  })
  .help('h')
  .alias('h', 'help')
  .alias('v', 'version')
  .version(packageJson.version)
  .wrap(null);

function authenticate(callback) {
  const poolData = {
    UserPoolId: argv.userPoolId,
    ClientId: argv.appClientId,
  };

  AWS.config.update({ region: argv.cognitoRegion });
  const userPool = new AWSCognito.CognitoUserPool(poolData);

  const userData = {
    Username: argv.username,
    Pool: userPool,
  };
  const authenticationData = {
    Username: argv.username,
    Password: argv.password,
  };
  const authenticationDetails = new AWSCognito.AuthenticationDetails(
    authenticationData,
  );

  const cognitoUser = new AWSCognito.CognitoUser(userData);

  console.log('Authenticating with User Pool');

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess(result) {
      callback({
        idToken: result.getIdToken().getJwtToken(),
        accessToken: result.getAccessToken().getJwtToken(),
      });
    },
    onFailure(err) {
      console.log(err.message ? err.message : err);
    },
    newPasswordRequired() {
      console.log('Given user needs to set a new password');
    },
    mfaRequired() {
      console.log('MFA is not currently supported');
    },
    customChallenge() {
      console.log('Custom challenge is not currently supported');
    },
  });
}

function getCredentials(userTokens, callback) {
  console.log('Getting temporary credentials');

  const logins = {};
  const { idToken } = userTokens;
  const { accessToken } = userTokens;

  logins[
    `cognito-idp.${argv.cognitoRegion}.amazonaws.com/${argv.userPoolId}`
  ] = idToken;

  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: argv.identityPoolId,
    Logins: logins,
  });

  AWS.config.credentials.get((err) => {
    if (err) {
      console.log(err.message ? err.message : err);

      return;
    }

    callback(userTokens);
  });
}

function makeRequest(userTokens) {
  console.log('Making API request');

  const apigClient = apigClientFactory.newClient({
    apiKey: argv.apiKey,
    accessKey: AWS.config.credentials.accessKeyId,
    secretKey: AWS.config.credentials.secretAccessKey,
    sessionToken: AWS.config.credentials.sessionToken,
    region: argv.apiGatewayRegion,
    invokeUrl: argv.invokeUrl,
  });

  const params = JSON.parse(argv.params);
  const additionalParams = JSON.parse(argv.additionalParams);

  let body = '';

  if (argv.body.startsWith('@')) {
    // body from file
    const bodyFromFile = argv.body.replace(/^@/, '');
    const contentFromFile = fs.readFileSync(bodyFromFile);

    body = JSON.parse(contentFromFile);
  } else {
    body = JSON.parse(argv.body);
  }

  if (argv.accessTokenHeader) {
    const tokenHeader = {};

    tokenHeader[argv.accessTokenHeader] = userTokens.accessToken;
    additionalParams.headers = Object.assign({}, additionalParams.headers, tokenHeader);
  }

  apigClient
    .invokeApi(params, argv.pathTemplate, argv.method, additionalParams, body)
    .then((result) => {
      console.dir({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
      });
    })
    .catch((result) => {
      if (result.response) {
        console.dir({
          status: result.response.status,
          statusText: result.response.statusText,
          data: result.response.data,
        });
      } else {
        console.log(result.message);
      }
    });
}

authenticate((tokens) => {
  getCredentials(tokens, makeRequest);
});
