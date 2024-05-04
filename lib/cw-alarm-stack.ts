import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CwAlarmStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 既存のAPI Gatewayを取得
    const api = new apigateway.RestApi(this, 'alarm-count-api');
    const stage = api.deploymentStage;
    const method = api.root.addMethod('GET');

    const metricsOptions = {
      period: cdk.Duration.minutes(5),
      statistic: 'Sum'
    };

    const countMetrics = api.metric('Count', metricsOptions);

    // CloudWatchAlarmを作成
    const alarm = new cloudwatch.Alarm(this, 'ApiGatewayAlarm', {
      metric: countMetrics,
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      alarmDescription: 'API Gateway request count exceeds threshold',
      alarmName: 'ApiGatewayCountAlarm',
    });
  }
}




