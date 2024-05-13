import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

dotenv.config();

export type dbStackProps = {
  env: {
    account: string;
    region: string;
  },
  vpcId: string;
};

export class DbStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: dbStackProps) {
    super(scope, id, props);

    const {env, vpcId} = props;

    // スタックの環境を設定
    this.node.setContext('env', {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    });

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_1 }),
      credentials: rds.Credentials.fromGeneratedSecret('clusteradmin'), // Optional - will default to 'admin' username and generated password
      writer: rds.ClusterInstance.provisioned('writer', {
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader1', { promotionTier: 1 }),
      ],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      // 既存のVPCIDを指定
      vpc: ec2.Vpc.fromLookup(this, 'VPC', { vpcId }),
    });
  }
}




