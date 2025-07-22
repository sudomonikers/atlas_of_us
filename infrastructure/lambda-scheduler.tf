# IAM role for Lambda function
resource "aws_iam_role" "ec2_scheduler_lambda_role" {
  name = "ec2-scheduler-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda to stop EC2 instances
resource "aws_iam_role_policy" "ec2_scheduler_lambda_policy" {
  name = "ec2-scheduler-lambda-policy"
  role = aws_iam_role.ec2_scheduler_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream", 
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StopInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function to stop EC2 instances
resource "aws_lambda_function" "ec2_scheduler" {
  filename         = "ec2_scheduler.zip"
  function_name    = "ec2-auto-shutdown"
  role            = aws_iam_role.ec2_scheduler_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.ec2_scheduler_zip.output_base64sha256
  runtime         = "python3.12"
  timeout         = 60

  environment {
    variables = {
      INSTANCE_ID = aws_instance.api_server.id
    }
  }

  tags = {
    Name = "EC2 Auto Shutdown"
  }
}

# Create the Lambda function zip file
data "archive_file" "ec2_scheduler_zip" {
  type        = "zip"
  output_path = "ec2_scheduler.zip"
  source {
    content = <<EOF
import boto3
import os
import json

def handler(event, context):
    ec2 = boto3.client('ec2')
    instance_id = os.environ['INSTANCE_ID']
    
    try:
        # Check if instance is running
        response = ec2.describe_instances(InstanceIds=[instance_id])
        state = response['Reservations'][0]['Instances'][0]['State']['Name']
        
        if state == 'running':
            # Stop the instance
            ec2.stop_instances(InstanceIds=[instance_id])
            print(f"Stopped instance {instance_id}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Successfully stopped instance {instance_id}')
            }
        else:
            print(f"Instance {instance_id} is already {state}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Instance {instance_id} is already {state}')
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error stopping instance: {str(e)}')
        }
EOF
    filename = "index.py"
  }
}

# CloudWatch Event Rule to trigger Lambda at 12 AM EST daily
resource "aws_cloudwatch_event_rule" "ec2_shutdown_schedule" {
  name                = "ec2-shutdown-12am-est"
  description         = "Trigger EC2 shutdown at 12 AM EST daily"
  schedule_expression = "cron(0 5 * * ? *)" # 12:00 AM EST = 5:00 AM UTC (EST is UTC-5)
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.ec2_shutdown_schedule.name
  target_id = "TriggerLambda"
  arn       = aws_lambda_function.ec2_scheduler.arn
}

# Permission for CloudWatch Events to invoke Lambda
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_scheduler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec2_shutdown_schedule.arn
}