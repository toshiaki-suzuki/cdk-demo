import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dotenv from 'dotenv';
import * as lambda from 'aws-cdk-lib/aws-lambda';

dotenv.config();

export class CwAlarmStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda関数を作成
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_LATEST,    // execution environment
      code: lambda.Code.fromAsset('lambda'),  // code loaded from "lambda" directory
      handler: 'hello.handler'                // file is "hello", function is "handler"
    });

    // 既存のAPI Gatewayを取得
    const api = new apigateway.RestApi(this, 'alarm-count-api');
    api.deploymentStage;
    api.root.addMethod('GET', new apigateway.LambdaIntegration(hello));

    const metricsOptions = {
      period: cdk.Duration.minutes(5),
      statistic: 'Sum'
    };

    const countMetrics = api.metric('Count', metricsOptions);
    const topic = new sns.Topic(this, 'AlarmNotificationTopic');

    // CloudWatchAlarmを作成
    const apigwErrorsAlarm = new cloudwatch.Alarm(this, 'ApiGatewayAlarm', {
      metric: countMetrics,
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 5,
      alarmDescription: 'API Gateway request count exceeds threshold',
      alarmName: 'ApiGatewayCountAlarm',
    });

    apigwErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));

    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaAlarm', {
      metric: hello.metricInvocations({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 5,
      alarmDescription: 'Lambda invocation count exceeds threshold',
      alarmName: 'LambdaInvocationAlarm',
    });

    lambdaErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));


    // Lambda関数のスロットル回数が1回以上の場合にアラームを作成
    const lambdaThrottlesAlarm = new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
      metric: hello.metricThrottles(),
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 5,
      alarmDescription: 'Lambda throttles count exceeds threshold',
      alarmName: 'LambdaThrottlesAlarm',
    });

    lambdaThrottlesAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));


    // Lambda関数の実行時間が60秒以上の場合にアラームを作成
    const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      metric: hello.metricDuration({
        period: cdk.Duration.minutes(1),
        statistic: 'Average'
      }),
      threshold: 60,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 5,
      datapointsToAlarm: 5,
      alarmDescription: 'Lambda duration exceeds threshold',
      alarmName: 'LambdaDurationAlarm',
    });

    lambdaDurationAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));

    const email = process.env.EMAIL;
    if (!email) {
      throw new Error('EMAIL environment variable is not set');
    }
    // メールアドレスをSNSトピックにサブスクライブ
    topic.addSubscription(new subscriptions.EmailSubscription(email));

    // アラームの状態変更時にSNSトピックにメッセージを公開するアクションを追加
    apigwErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));



  }
}




