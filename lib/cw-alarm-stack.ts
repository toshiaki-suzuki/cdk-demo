import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dotenv from 'dotenv';

dotenv.config();

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

    // SNSトピックを作成
    const topic = new sns.Topic(this, 'AlarmNotificationTopic');

    const email = process.env.EMAIL;
    if (!email) {
      throw new Error('EMAIL environment variable is not set');
    }
    // メールアドレスをSNSトピックにサブスクライブ
    topic.addSubscription(new subscriptions.EmailSubscription(email));

    // // アラームの状態変更時にSNSトピックにメッセージを公開するアクションを追加
    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));
  }
}




