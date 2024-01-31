#!/bin/bash
echo -n 'Username: '
read JOMAX_USER 
echo -n 'Password: ' 
read -s JOMAX_PASSWD 
curl -s https://sso.godaddy.com/v1/api/token --data-urlencode "username=$JOMAX_USER" --data-urlencode "password=$JOMAX_PASSWD" --data-urlencode "realm=jomax"
#SSO_RESPONSE=$(curl -s https://sso.godaddy.com/v1/api/token --data-urlencode "username=$JOMAX_USER" --data-urlencode "password=$JOMAX_PASSWD" --data-urlencode "realm=jomax")
#JOMAX_JWT=$(echo $SSO_RESPONSE | json data) 
#echo "\nToken: jomax-jwt $JOMAX_JWT"


# okta
# aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 232497835605.dkr.ecr.us-west-2.amazonaws.com
# docker build -t frontdoor-ui --build-arg NPM_AUTH_TOKEN=[token] --build-arg AWS_ENV=[env].