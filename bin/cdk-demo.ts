#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CwAlarmStack } from '../lib/cw-alarm-stack';

const app = new cdk.App();

new CwAlarmStack(app, 'CwAlarmStack');
