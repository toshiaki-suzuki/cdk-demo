#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CwAlarmStack } from '../lib/cw-alarm-stack';
import { DbStack } from '../lib/db-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  region: process.env.CDK_DEFAULT_REGION!,
};

new CwAlarmStack(app, 'CwAlarmStack');

new DbStack(app, 'DbStack',{
  env,
  vpcId: process.env.VPC_ID!,
});
